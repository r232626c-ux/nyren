import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import NeonHeader from '../components/NeonHeader';

const THEME = {
  colors: {
    primary: '#38bdf8',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#071226',
    card: 'rgba(13, 33, 61, 0.65)',
    text: '#e5e7eb',
  },
  pills: {
    reading: '#38bdf8',
    lab: '#10b981',
    exercise: '#8b5cf6',
    quiz: '#f59e0b',
    project: '#ec4899',
  }
};
const contentTypeLabel = (t) => {
  if (t === 'reading') return '📝 Notes';
  if (t === 'lab') return '🧪 Lab';
  if (t === 'exercise') return '📌 Assignment';
  if (t === 'assignment') return '📌 Assignment';
  if (t === 'quiz') return '✅ In-class Test';
  if (t === 'project') return '🚀 Project';
  return t || 'content';
};

function toPayloadProgress({ moduleId, contentId, contentType, score, status, timeSpentSeconds }) {
  return {
    moduleId,
    contentId,
    score,
    status: status || 'completed',
    timeSpentSeconds: timeSpentSeconds || 60,
  };
}

const cleanInlineMarkdown = (text) => String(text)
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/__(.*?)__/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/`([^`]+)`/g, '$1');

function LessonContent({ content }) {
  if (!content) return null;
  const blocks = String(content).split(/\n\s*\n/).filter((block) => block.trim());

  return (
    <View>
      {blocks.map((block, blockIndex) => {
        const fenced = block.match(/^```[^\n]*\n?([\s\S]*?)\n?```$/);
        if (fenced) {
          return (
            <ScrollView key={`code-${blockIndex}`} horizontal style={styles.diagramBox}>
              <Text style={styles.diagramText}>{fenced[1]}</Text>
            </ScrollView>
          );
        }

        return block.split('\n').map((line, lineIndex) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
          if (heading) {
            return <Text key={`${blockIndex}-${lineIndex}`} style={styles.lessonContentHeading}>{cleanInlineMarkdown(heading[1])}</Text>;
          }
          const listItem = trimmed.match(/^[-*+]\s+(.+)$/);
          const numberedItem = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
          if (listItem || numberedItem) {
            const itemText = listItem ? listItem[1] : numberedItem[2];
            return (
              <View key={`${blockIndex}-${lineIndex}`} style={styles.lessonListRow}>
                <Text style={styles.lessonListMarker}>{numberedItem ? `${numberedItem[1]}.` : '\u2022'}</Text>
                <Text style={styles.paragraph}>{cleanInlineMarkdown(itemText)}</Text>
              </View>
            );
          }
          return <Text key={`${blockIndex}-${lineIndex}`} style={styles.paragraph}>{cleanInlineMarkdown(trimmed)}</Text>;
        });
      })}
    </View>
  );
}

const ModuleDetail = ({ route, navigation }) => {
  const { module } = route.params || {};
  const [moduleDetail, setModuleDetail] = useState(module || null);
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({}); // { [contentId]: { selectedIndex } }
  const [notesById, setNotesById] = useState({});
  const [completedIds, setCompletedIds] = useState(new Set());
  const [checklistState, setChecklistState] = useState({}); // { [contentId]: { [index]: boolean } }
  const [quickCheckState, setQuickCheckState] = useState({}); // { [contentId]: selectedIndex }
  const [assessmentFeedback, setAssessmentFeedback] = useState({});

  const moduleId = moduleDetail?.id;

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!moduleId) {
        Alert.alert('Module not found', 'Missing module id. Go back to Learn.');
        return;
      }

      const [moduleRes, contentRes, notesRes, progressRes] = await Promise.all([
        apiService.get(`/api/learn/modules/${moduleId}`),
        apiService.get(`/api/learn/content/${moduleId}?limit=200`),
        apiService.get(`/api/learn/progress/notes?moduleId=${moduleId}`),
        apiService.get(`/api/learn/progress?moduleId=${moduleId}`),
      ]);

      const moduleData = moduleRes?.data?.data || moduleRes?.data || null;
      // ---- Robust response-shape normalization ----
      const contentDataCandidate =
        contentRes?.data?.data ?? // { data: { data: [...] } }
        contentRes?.data?.rows ?? // { data: { rows: [...] } }
        contentRes?.data ?? // { data: [...] } (if api client returns directly)
        moduleData?.ModuleContents ?? // Fallback to included contents from detail call
        moduleData?.module_contents ??
        [];

      // If backend nests rows inside a second container, flatten best-effort.
      const contentData = Array.isArray(contentDataCandidate)
        ? contentDataCandidate
        : (Array.isArray(contentDataCandidate?.rows) ? contentDataCandidate.rows : []);

      const notesDataCandidate =
        notesRes?.data?.data ?? // { data: { [contentId]: notes } }
        notesRes?.data ?? // { data: { [contentId]: notes } } or { data: ... }
        {};

      // Some backends may return rows/arrays instead of a key-value map.
      // Normalize best-effort into: { [contentId]: notesString }
      const tryNormalizeNotesFromArray = () => {
        if (!Array.isArray(notesDataCandidate)) return null;
        const out = {};
        notesDataCandidate.forEach((row) => {
          const cid = row?.contentId ?? row?.content_id;
          if (!cid) return;
          out[String(cid)] = typeof row?.notes === 'string' ? row.notes : '';
        });
        return out;
      };

      // Debug: capture resolved inputs so we can pinpoint mismatches quickly

      console.log('[ModuleDetail] moduleId resolved:', moduleId);
      console.log('[ModuleDetail] /learn/content raw contentRes:', contentRes);
      console.log('[ModuleDetail] /learn/progress/notes raw notesRes:', notesRes);

      const normalizedNotes = (() => {
        // 1) If backend returned rows/array, normalize to map.
        const fromArray = tryNormalizeNotesFromArray();
        if (fromArray) return fromArray;

        // 2) Expected (backend): { [contentId]: 'notes...' }
        if (!notesDataCandidate || typeof notesDataCandidate !== 'object' || Array.isArray(notesDataCandidate)) {
          return {};
        }

        return Object.keys(notesDataCandidate).reduce((acc, k) => {
          acc[String(k)] = typeof notesDataCandidate[k] === 'string' ? notesDataCandidate[k] : '';
          return acc;
        }, {});
      })();

      // Map progress rows to completed IDs
      const progressRows = Array.isArray(progressRes?.data?.data)
        ? progressRes.data.data
        : Array.isArray(progressRes?.data)
          ? progressRes.data
          : [];
      const doneIds = new Set();
      const restoredChecklists = {};
      const restoredQuickChecks = {};
      progressRows.forEach(row => {
        if (row.status === 'completed' || row.status === 'mastered') {
          doneIds.add(String(row.contentId));
        }
        const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
        if (metadata.checklistState) restoredChecklists[String(row.contentId)] = metadata.checklistState;
        if (metadata.quickCheckState !== undefined && metadata.quickCheckState !== null) {
          restoredQuickChecks[String(row.contentId)] = metadata.quickCheckState;
        }
      });

      setModuleDetail(moduleData);
      setNotesById(normalizedNotes);
      setCompletedIds(doneIds);
      setChecklistState(restoredChecklists);
      setQuickCheckState(restoredQuickChecks);

      // DEBUG: verify key-space alignment between content item IDs and progress note keys.
      try {
        const contentIds = (Array.isArray(contentData) ? contentData : [])
          .map((it) => ({
            id: it?.id ? String(it.id) : null,
            contentId: it?.contentId ? String(it.contentId) : null,
            content_id: it?.content_id ? String(it.content_id) : null,
          }))
          .filter((x) => x.id || x.contentId || x.content_id);

        const noteKeys = Object.keys(normalizedNotes || {});
        const noteKeySet = new Set(noteKeys);

        const first = contentIds.slice(0, 15);
        const matchesById = first.filter((x) => x.id && noteKeySet.has(x.id)).length;
        const matchesByContentId = first.filter((x) => x.contentId && noteKeySet.has(x.contentId)).length;
        const matchesByContentIdUnderscore = first.filter((x) => x.content_id && noteKeySet.has(x.content_id)).length;

        console.log('[ModuleDetail] KEY ALIGNMENT CHECK', {
          noteKeysCount: noteKeys.length,
          contentItemSample: first,
          matchesByContentItemId: matchesById,
          matchesByContentItemContentId: matchesByContentId,
          matchesByContentItemContent_id: matchesByContentIdUnderscore,
          normalizedNotesSample: noteKeys.slice(0, 10),
        });
      } catch (e) {
        // ignore debug-only errors
      }


      // Normalize items to ensure they all have a consistent 'id' field for mapping notes and progress
      const items = (Array.isArray(contentData) ? contentData : []).map(it => ({
        ...it,
        id: String(it.id || it.contentId || it._id || it.content_id || '')
      })).filter(it => it.id);

      setContentItems(items);

      // Debug: ensure we know what keys we got vs what content ids are present
      try {
        const contentIds = items.map((it) => String(it.id));
        const noteKeys = Object.keys(normalizedNotes || {});
        const noteKeySet = new Set(noteKeys);
        const overlap = contentIds.filter((id) => noteKeySet.has(id));
        console.log('[ModuleDetail] consistency report:', { 
          itemsCount: items.length, 
          noteKeysCount: noteKeys.length, 
          matches: overlap.length 
        });
      } catch (debugErr) {
        // ignore
      }


      // Notes are already normalized above; do not override them here.
      // Content items set after this block, so UI can safely read notesById[String(item.id)].
    } catch (e) {
      console.error('[ModuleDetail] fetch error:', e?.message || e);
      Alert.alert('Failed to load module', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id]);

  const grouped = useMemo(() => {
    const groups = {
      reading: [],
      lab: [],
      exercise: [],
      quiz: [],
      project: [],
    };

    contentItems.forEach((it) => {
      let ct = it.contentType || 'exercise';
      if (ct === 'assignment') ct = 'exercise'; // Use assignment view for exercise types
      if (!groups[ct]) groups[ct] = [];
      groups[ct].push(it);
    });

    return groups;
  }, [contentItems]);

  const syllabusGroups = useMemo(() => {
    const numberedLessons = contentItems.filter((item) => Number.isInteger(Number(item.weekNumber)) && item.weekNumber !== null && item.weekNumber !== undefined);
    if (numberedLessons.length === 0) {
      return Object.entries(grouped)
        .filter(([, items]) => items.length > 0)
        .map(([key, items]) => ({ key, title: contentTypeLabel(key), items }));
    }

    const weeks = new Map();
    for (const item of contentItems) {
      const key = Number.isInteger(Number(item.weekNumber)) && item.weekNumber !== null
        ? Number(item.weekNumber)
        : null;
      const week = weeks.get(key) || [];
      week.push(item);
      weeks.set(key, week);
    }
    return [...weeks.entries()]
      .sort(([left], [right]) => (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER))
      .map(([weekNumber, items]) => ({
        key: weekNumber === null ? 'additional' : `week-${weekNumber}`,
        title: weekNumber === null ? 'Additional lessons' : `Week ${weekNumber}`,
        items: items.sort((left, right) => (left.orderIndex || 0) - (right.orderIndex || 0)),
      }));
  }, [contentItems, grouped]);

  const handleSubmitProgress = async ({ contentItem, score, status, notes }) => {
    try {
      if (!moduleId) throw new Error('Missing moduleId');
      const payload = toPayloadProgress({
        moduleId,
        contentId: contentItem.id,
        contentType: contentItem.contentType,
        score,
        status,
        timeSpentSeconds: 120,
      });

      // Optional progress notes (stored per contentId via backend)
      if (typeof notes === 'string') {
        payload.notes = notes;
      }

      setSubmitting(true);
      const res = await apiService.post('/api/learn/progress', payload);
      if (res?.success || res?.data) {
        setCompletedIds(prev => new Set(prev).add(String(contentItem.id)));
      }
      return res;
    } catch (e) {
      console.warn('[ModuleDetail] Submission failed silently:', e?.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const persistInteraction = async (contentId, updates) => {
    try {
      const result = await apiService.saveLearningInteractions({
        moduleId,
        contentId,
        ...(updates.checklistState !== undefined ? { checklistState: updates.checklistState } : {}),
        ...(updates.quickCheckState !== undefined ? { quickCheckState: updates.quickCheckState } : {}),
        ...(typeof updates.notes === 'string' ? { notes: updates.notes } : {}),
      });
      if (!result?.success) console.warn('[ModuleDetail] Interaction save failed:', result?.error);
    } catch (error) {
      console.warn('[ModuleDetail] Interaction save failed:', error?.message);
    }
  };

  const submitAssessment = async ({ item, answers, questionIndices }) => {
    setSubmitting(true);
    try {
      const response = await apiService.submitLearningAssessment(item.id, {
        moduleId,
        answers,
        questionIndices,
        timeSpentSeconds: 120,
      });
      const result = response?.data?.data || response?.data || response;
      if (!response?.success || result?.score === undefined) {
        throw new Error(response?.error || 'Assessment could not be graded.');
      }
      setAssessmentFeedback((previous) => ({ ...previous, [item.id]: result }));
      if (result.passed) setCompletedIds((previous) => new Set(previous).add(String(item.id)));
      await fetchData();
      return result;
    } catch (error) {
      Alert.alert('Assessment not submitted', error?.message || 'Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const openReference = async (reference, kind = 'pubmed') => {
    const url = kind === 'doi'
      ? (reference?.doi ? `https://doi.org/${encodeURIComponent(reference.doi)}` : null)
      : (reference?.pmid && /^\d+$/.test(String(reference.pmid))
        ? `https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}/`
        : null);
    if (!url) {
      Alert.alert('Link unavailable', 'This verified reference does not provide that identifier.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Could not open reference', error?.message || 'Try again later.');
    }
  };

  const QuizItem = ({ item }) => {
    const contentKey = String(item.id);
    const answers = quizAnswers[item.id] || {};
    const feedback = assessmentFeedback[item.id];

    const questions = (() => {
      const quizQuestions = item.quizQuestions ?? null;
      if (Array.isArray(quizQuestions) && quizQuestions.length) return quizQuestions;
      if (quizQuestions?.question) return [quizQuestions];

      // Preferred: item.content contains JSON for quiz rendering.
      const raw = item.content || '';
      if (raw && typeof raw === 'string') {
        try {
          const parsedContent = JSON.parse(raw);
          if (Array.isArray(parsedContent)) return parsedContent;
          if (parsedContent?.question) return [parsedContent];
        } catch {
          // ignore and fall back to quizQuestions
        }
      }


      // Fallback: some seeders may store quiz payload in quizQuestions.
      // We expect it to be either an object: { question, options, correctIndex }
      // or an array (use first element).
      return [];
    })();

    const isReady = Array.isArray(questions) && questions.length > 0 && questions.every((question) => Array.isArray(question.options) && question.options.length > 0);
    const isDone = completedIds.has(String(item.id));

    const submit = async () => {
      if (!isReady) {
        Alert.alert('Assessment unavailable', 'This quiz has no gradable questions. No completion was recorded.');
        return;
      }
      if (questions.some((_, index) => !Number.isInteger(answers[index]))) {
        Alert.alert('Finish the assessment', 'Select an answer for every question before submitting.');
        return;
      }

      const result = await submitAssessment({
        item,
        answers: questions.map((_, index) => answers[index]),
      });
      if (result) Alert.alert('Graded', `${result.score}%${result.mastered ? ' · Mastery achieved' : result.passed ? ' · Passed' : ' · Review the feedback and try again'}`);
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.pill, { backgroundColor: THEME.pills.quiz }]}> 
              <Text style={styles.pillText}>Quiz</Text>
            </View>
            {isDone && (
              <View style={[styles.pill, { backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: THEME.colors.success }]}>
                <Text style={[styles.pillText, { color: THEME.colors.success }]}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        {questions?.map((question, questionIndex) => (
          <View key={`${item.id}-question-${questionIndex}`} style={styles.assessmentQuestion}>
            <Text style={styles.sectionLabel}>Question {questionIndex + 1}</Text>
            <Text style={[styles.paragraph, { fontSize: 15 }]}>{question.question || item.title}</Text>
            {question.options.map((option, optionIndex) => {
              const submittedFeedback = feedback?.feedback?.find((entry) => entry.questionIndex === questionIndex);
              const selected = answers[questionIndex] === optionIndex;
              const isCorrect = submittedFeedback?.correctIndex === optionIndex;
              const isWrongChoice = submittedFeedback && selected && !submittedFeedback.correct;
              return (
                <TouchableOpacity
                  key={`${item.id}-${questionIndex}-${optionIndex}`}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowActive,
                    isCorrect && styles.optionRowCorrect,
                    isWrongChoice && styles.optionRowIncorrect,
                  ]}
                  disabled={!!feedback}
                  onPress={() => setQuizAnswers((previous) => ({
                    ...previous,
                    [item.id]: { ...previous[item.id], [questionIndex]: optionIndex },
                  }))}
                >
                  <View style={[styles.optionDot, selected && styles.optionDotActive]} />
                  <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            {feedback?.feedback?.[questionIndex]?.explanation ? (
              <Text style={styles.mutedText}>{feedback.feedback[questionIndex].explanation}</Text>
            ) : null}
          </View>
        ))}

        {feedback ? (
          <View style={styles.assessmentResult}>
            <Text style={styles.assessmentResultTitle}>{feedback.score}% · {feedback.passed ? 'Passed' : 'Not passed yet'}</Text>
            <Text style={styles.mutedText}>{feedback.correctAnswers} of {feedback.totalQuestions} correct. Answers are graded by COLI.</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Lecture Notes (optional)</Text>
        <TextInput
          value={notesById[contentKey] || ''}
          onChangeText={(text) => {
            setNotesById((previous) => ({ ...previous, [contentKey]: text }));
            persistInteraction(contentKey, { notes: text });
          }}
          placeholder="Add your notes like Coursera"
          placeholderTextColor="rgba(229, 231, 235, 0.55)"
          multiline
          style={styles.textArea}
        />


        <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={submitting}>
          <Ionicons name="checkmark-circle" size={18} color="#05101f" />
          <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Submit Test'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const AssignmentItem = ({ item }) => {
    const contentKey = String(item.id);
    const isDone = completedIds.has(String(item.id));

    const submit = async () => {
      const res = await handleSubmitProgress({
        contentItem: item,
        status: 'completed',
        notes: notesById[contentKey] || '',
      });
      if (res) Alert.alert('Success', 'Assignment marked as complete.');
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.pill, { backgroundColor: THEME.pills.exercise }]}>
              <Text style={styles.pillText}>Assignment</Text>
            </View>
            {isDone && (
              <View style={[styles.pill, { backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: '#10b981' }]}>
                <Text style={[styles.pillText, { color: '#10b981' }]}>Submitted</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <LessonContent content={item.content} />

        <Text style={styles.sectionLabel}>My notes</Text>
        <TextInput
          value={notesById[contentKey] || ''}
          onChangeText={(text) => {
            setNotesById((previous) => ({ ...previous, [contentKey]: text }));
            persistInteraction(contentKey, { notes: text });
          }}
          placeholder="Key idea, result, or question..."
          placeholderTextColor="rgba(229, 231, 235, 0.55)"
          multiline
          style={styles.textArea}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={submitting}>
          <Ionicons name="document-text" size={18} color="#05101f" />
          <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Mark as Done'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ProjectItem = ({ item }) => {
    const contentKey = String(item.id);
    const notes = notesById[contentKey] || '';
    const isDone = completedIds.has(String(item.id));

    const submit = async () => {
      const res = await handleSubmitProgress({
        contentItem: item,
        status: 'completed',
        notes: notesById[contentKey] || '',
      });
      if (res) Alert.alert('Success', 'Milestone saved.');
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.pill, { backgroundColor: THEME.pills.project }]}>
              <Text style={styles.pillText}>Project</Text>
            </View>
            {isDone && (
              <View style={[styles.pill, { backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: '#10b981' }]}>
                <Text style={[styles.pillText, { color: '#10b981' }]}>Milestone Met</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        <LessonContent content={item.content} />

        <Text style={styles.sectionLabel}>My notes</Text>
        <TextInput
          value={notes}
          onChangeText={(text) => {
            setNotesById((previous) => ({ ...previous, [contentKey]: text }));
            persistInteraction(contentKey, { notes: text });
          }}
          placeholder="Key result or next step..."
          placeholderTextColor="rgba(229, 231, 235, 0.55)"
          multiline
          style={styles.textArea}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={submitting}>
          <Ionicons name="rocket" size={18} color="#05101f" />
          <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Submit Project'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ContentCard = ({ item }) => {
    let ct = item.contentType || 'exercise';
    if (ct === 'assignment') ct = 'exercise';

    if (ct === 'quiz') return <QuizItem item={item} />;
    if (ct === 'exercise') return <AssignmentItem item={item} />;
    if (ct === 'project') return <ProjectItem item={item} />;

    const header = contentTypeLabel(ct);
    const contentKey = String(item.id);
    const isDone = completedIds.has(String(item.id));
    const displayStructured = (value) => typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.pill, { backgroundColor: THEME.pills[ct] || '#38bdf8' }]}>
              <Text style={styles.pillText}>{header}</Text>
            </View>
            {isDone && (
              <View style={[styles.pill, { backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: '#10b981' }]}>
                <Text style={[styles.pillText, { color: '#10b981' }]}>Viewed</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        {Array.isArray(item.scientificReferences) && item.scientificReferences.length > 0 ? (
          <View style={styles.referencesSection}>
            <Text style={styles.sectionLabel}>Scientific Evidence</Text>
            {item.scientificReferences.map((reference) => (
              <View key={reference.id || reference.pmid || reference.doi} style={styles.referenceCard}>
                <Text style={styles.referenceTitle}>{reference.title}</Text>
                <Text style={styles.referenceMeta}>
                  {[Array.isArray(reference.authors) ? reference.authors.slice(0, 3).join(', ') : reference.authors, reference.journal, reference.year].filter(Boolean).join(' · ')}
                </Text>
                {reference.pmid ? <Text style={styles.referenceMeta}>PMID: {reference.pmid}</Text> : null}
                {Array.isArray(reference.articleType) && reference.articleType.length ? <Text style={styles.referenceMeta}>{reference.articleType.join(', ')}</Text> : null}
                <View style={styles.referenceActions}>
                  {reference.pmid && /^\d+$/.test(String(reference.pmid)) ? (
                    <TouchableOpacity style={styles.referenceLinkButton} onPress={() => openReference(reference, 'pubmed')}>
                      <Ionicons name="open-outline" size={16} color="#38bdf8" />
                      <Text style={styles.referenceLinkText}>Read on PubMed</Text>
                    </TouchableOpacity>
                  ) : null}
                  {reference.doi ? (
                    <TouchableOpacity style={styles.referenceLinkButton} onPress={() => openReference(reference, 'doi')}>
                      <Ionicons name="link-outline" size={16} color="#38bdf8" />
                      <Text style={styles.referenceLinkText}>View DOI</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {item.videoUrl ? (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: '#38bdf8', marginBottom: 12 }]}
            onPress={() => Alert.alert('Video Lecture', 'Opening video stream...')}
          >
            <Ionicons name="play-circle" size={20} color="#38bdf8" />
            <Text style={[styles.primaryBtnText, { color: '#38bdf8' }]}>Watch Lecture</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionLabel}>Learning Material</Text>
        <LessonContent content={item.content} />

        {Array.isArray(item.learningObjectives) && item.learningObjectives.length ? (
          <View style={styles.lessonSection}>
            <Text style={styles.sectionLabel}>Learning objectives</Text>
            {item.learningObjectives.map((objective, index) => <Text key={index} style={styles.paragraph}>• {objective}</Text>)}
          </View>
        ) : null}
        {Array.isArray(item.prerequisites) && item.prerequisites.length ? (
          <View style={styles.lessonSection}>
            <Text style={styles.sectionLabel}>Prerequisite knowledge</Text>
            <Text style={styles.paragraph}>{item.prerequisites.join(' · ')}</Text>
          </View>
        ) : null}
        {item.workedExample ? (
          <View style={styles.lessonSection}>
            <Text style={styles.sectionLabel}>Worked example</Text>
            <Text style={styles.paragraph}>{displayStructured(item.workedExample)}</Text>
          </View>
        ) : null}
        {item.biomedicalApplication ? (
          <View style={styles.lessonSection}>
            <Text style={styles.sectionLabel}>Biomedical application</Text>
            <Text style={styles.paragraph}>{item.biomedicalApplication}</Text>
          </View>
        ) : null}
        {item.practicalActivity ? (
          <View style={styles.lessonSection}>
            <Text style={styles.sectionLabel}>Practical activity</Text>
            <Text style={styles.paragraph}>{displayStructured(item.practicalActivity)}</Text>
          </View>
        ) : null}
        {item.criticalThinkingQuestion ? (
          <View style={styles.criticalThinkingBox}>
            <Text style={styles.sectionLabel}>Critical appraisal</Text>
            <Text style={styles.paragraph}>{item.criticalThinkingQuestion}</Text>
          </View>
        ) : null}

        {Array.isArray(item.exercises) && item.exercises.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Checklist</Text>
            {item.exercises.map((label, index) => {
              const checked = !!checklistState[contentKey]?.[index];
              const toggleChecklist = () => {
                const next = { ...checklistState[contentKey], [index]: !checked };
                setChecklistState((previous) => ({ ...previous, [contentKey]: next }));
                persistInteraction(contentKey, { checklistState: next });
              };
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.checklistRow}
                  activeOpacity={0.7}
                  onPress={toggleChecklist}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? '#10b981' : 'rgba(229,231,235,0.6)'}
                  />
                  <Text style={[styles.checklistText, checked && styles.checklistTextDone]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {Array.isArray(item.quizQuestions) && item.quizQuestions[0] ? (() => {
          const q = item.quizQuestions[0];
          const selected = quickCheckState[contentKey]?.selectedIndex;
          const feedback = assessmentFeedback[`${contentKey}:quick`];
          const submitQuickCheck = async () => {
            if (selected === undefined) {
              Alert.alert('Select an answer', 'Choose an option before submitting the quick check.');
              return;
            }
            const result = await submitAssessment({ item, answers: [selected], questionIndices: [0] });
            if (result) setAssessmentFeedback((previous) => ({ ...previous, [`${contentKey}:quick`]: result }));
          };
          return (
            <View style={styles.quickCheckBox}>
              <Text style={styles.sectionLabel}>🧠 Quick Check</Text>
              <Text style={[styles.paragraph, { marginTop: 4 }]}>{q.question}</Text>
              {q.options.map((opt, index) => {
                const isSelected = selected === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickCheckOption, isSelected && styles.quickCheckOptionActive]}
                    activeOpacity={0.7}
                    disabled={!!feedback}
                    onPress={() => {
                      const next = { selectedIndex: index };
                      setQuickCheckState((previous) => ({ ...previous, [contentKey]: next }));
                      persistInteraction(contentKey, { quickCheckState: next });
                    }}
                  >
                    <Text style={styles.quickCheckOptionText}>{opt}</Text>
                    {feedback?.feedback?.[0] && isSelected ? (
                      <Ionicons name={feedback.feedback[0].correct ? 'checkmark-circle' : 'close-circle'} size={18} color={feedback.feedback[0].correct ? '#10b981' : '#ef4444'} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              {feedback ? (
                <Text style={[styles.mutedText, { color: feedback.passed ? '#10b981' : '#f59e0b' }]}>
                  {feedback.feedback?.[0]?.explanation || (feedback.passed ? 'Correct.' : 'Review this concept and try again.')}
                </Text>
              ) : null}
              {!feedback ? (
                <TouchableOpacity style={styles.primaryBtn} onPress={submitQuickCheck} disabled={submitting}>
                  <Ionicons name="checkmark-circle" size={18} color="#05101f" />
                  <Text style={styles.primaryBtnText}>{submitting ? 'Checking...' : 'Submit quick check'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })() : null}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>My notes</Text>
        <TextInput
          value={notesById[contentKey] || ''}
          onChangeText={(text) => {
            setNotesById((previous) => ({ ...previous, [contentKey]: text }));
            persistInteraction(contentKey, { notes: text });
          }}
          placeholder="Key idea, example, or question..."
          placeholderTextColor="rgba(229, 231, 235, 0.55)"
          multiline
          style={styles.textArea}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={async () => {
            const res = await handleSubmitProgress({
              contentItem: item,
              status: 'completed',
              notes: notesById[contentKey] || '',
            });
            if (res) Alert.alert('Success', 'Progress and notes saved.');
          }}
          disabled={submitting}
        >
          <Ionicons name="checkmark-circle" size={18} color="#05101f" />
          <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Mark Done'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={24} color="#38bdf8" />
        </TouchableOpacity>
        <NeonHeader title={moduleDetail?.title || 'Module Detail'} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={["rgba(56,189,248,0.28)", "rgba(236,72,153,0.22)"]}
            style={styles.heroGradient}
          >
            <Text style={styles.heroTitle}>{moduleDetail?.title}</Text>
            <Text style={styles.heroSubtitle}>
              {moduleDetail?.description || 'Complete module activities to progress.'}
            </Text>
            {moduleDetail?.subtitle ? <Text style={styles.courseSubtitle}>{moduleDetail.subtitle}</Text> : null}
            {Array.isArray(moduleDetail?.learningObjectives) && moduleDetail.learningObjectives.length ? (
              <View style={styles.courseMetadataSection}>
                <Text style={styles.courseMetadataTitle}>Learning objectives</Text>
                {moduleDetail.learningObjectives.map((objective, index) => (
                  <Text key={`objective-${index}`} style={styles.courseMetadataText}>• {objective}</Text>
                ))}
              </View>
            ) : null}
            {Array.isArray(moduleDetail?.skills) && moduleDetail.skills.length ? (
              <Text style={styles.courseSkills}>Skills: {moduleDetail.skills.join(' · ')}</Text>
            ) : null}
            {moduleDetail?.estimatedDurationMinutes ? (
              <Text style={styles.courseDuration}>{moduleDetail.estimatedDurationMinutes} minutes · {moduleDetail.difficulty || 'Level not specified'}</Text>
            ) : null}
            {contentItems.length > 0 ? (
              <View style={{ marginTop: 14 }}>
                <View style={styles.courseProgressTrack}>
                  <View
                    style={[
                      styles.courseProgressFill,
                      {
                        width: `${Math.round((completedIds.size / contentItems.length) * 100)}%`,
                        backgroundColor: completedIds.size >= contentItems.length ? '#10b981' : '#38bdf8',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.courseProgressLabel}>
                  {completedIds.size}/{contentItems.length} lessons complete · {Math.round((completedIds.size / contentItems.length) * 100)}%
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        {syllabusGroups.length === 0 ? (
          <View style={styles.emptyLessons}>
            <Ionicons name="book-outline" size={28} color="#67e8f9" />
            <Text style={styles.emptyLessonsTitle}>Lessons are temporarily unavailable</Text>
            <Text style={styles.mutedText}>Try loading this course again.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={fetchData}>
              <Ionicons name="refresh" size={18} color="#05101f" />
              <Text style={styles.primaryBtnText}>Reload lessons</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {syllabusGroups.map((group) => {
          return (
            <View key={group.key} style={{ marginTop: 18 }}>
              <Text style={styles.sectionHeader}>{group.title}</Text>
              {group.items.map((it, lessonIndex) => (
                <View key={it.id} style={{ marginTop: 12 }}>
                  <Text style={styles.lessonOrderLabel}>
                    {it.weekNumber ? `Week ${it.weekNumber} · ` : ''}Lesson {lessonIndex + 1}
                  </Text>
                  <ContentCard item={it} />
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071226' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: {
    padding: 8,
  },
  scrollContent: { padding: 16, paddingBottom: 36 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#071226' },
  heroCard: { borderRadius: 18, overflow: 'hidden', marginTop: 12 },
  heroGradient: { padding: 18 },
  heroTitle: { color: '#e5e7eb', fontSize: 22, fontWeight: '800' },
  heroSubtitle: { marginTop: 6, color: 'rgba(229,231,235,0.75)', lineHeight: 20 },
  courseSubtitle: { marginTop: 8, color: '#bae6fd', fontSize: 15, fontWeight: '600', lineHeight: 21 },
  courseMetadataSection: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  courseMetadataTitle: { color: '#e5e7eb', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  courseMetadataText: { color: 'rgba(229,231,235,0.84)', lineHeight: 20, marginTop: 4 },
  courseSkills: { color: '#a5f3fc', lineHeight: 19, marginTop: 12 },
  courseDuration: { color: 'rgba(229,231,235,0.65)', fontSize: 12, marginTop: 10 },
  lessonOrderLabel: { color: '#67e8f9', fontSize: 11, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  lessonSection: { marginTop: 12, paddingTop: 4 },
  criticalThinkingBox: { marginTop: 16, padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.07)' },
  sectionHeader: { color: '#e5e7eb', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  card: {
    backgroundColor: 'rgba(13, 33, 61, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.18)',
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: { color: '#e5e7eb', fontSize: 16, fontWeight: '700', flex: 1 },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  pillText: { color: '#02101f', fontWeight: '900', fontSize: 12 },
  paragraph: { marginTop: 10, marginBottom: 10, color: 'rgba(229,231,235,0.86)', lineHeight: 20 }, // Added marginBottom for paragraph separation
  lessonContentHeading: { marginTop: 14, marginBottom: 4, color: '#e5e7eb', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  lessonListRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lessonListMarker: { color: '#67e8f9', fontWeight: '800', marginTop: 10 },
  emptyLessons: { marginTop: 20, padding: 20, alignItems: 'center', backgroundColor: 'rgba(13,33,61,0.65)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  emptyLessonsTitle: { marginTop: 8, color: '#e5e7eb', fontSize: 16, fontWeight: '800' },
  mutedText: { marginTop: 10, color: 'rgba(229,231,235,0.55)' },
  courseProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  courseProgressLabel: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(229,231,235,0.75)',
    fontWeight: '600',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  checklistText: {
    flex: 1,
    color: 'rgba(229,231,235,0.86)',
    lineHeight: 20,
  },
  checklistTextDone: {
    color: 'rgba(16,185,129,0.9)',
    textDecorationLine: 'line-through',
  },
  quickCheckBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(56,189,248,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
  },
  quickCheckOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  quickCheckOptionActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56,189,248,0.10)',
  },
  quickCheckOptionText: {
    flex: 1,
    color: 'rgba(229,231,235,0.9)',
  },
  diagramBox: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(2,16,31,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    borderRadius: 8,
    padding: 10,
  },
  diagramText: {
    color: '#38bdf8',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  sectionLabel: { marginTop: 12, color: 'rgba(229,231,235,0.75)', fontWeight: '700' },
  textArea: {
    marginTop: 8,
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.18)',
    color: '#e5e7eb',
    padding: 10,
    backgroundColor: 'rgba(2, 16, 31, 0.25)',
  },
  primaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.45)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  primaryBtnText: { color: '#e5e7eb', fontWeight: '900' },
  backToCurriculumBtn: {
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: 'rgba(34, 211, 238, 0.05)',
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.12)',
    backgroundColor: 'rgba(2, 16, 31, 0.22)',
  },
  optionRowActive: { borderColor: 'rgba(34, 211, 238, 0.55)', backgroundColor: 'rgba(34, 211, 238, 0.10)' },
  optionDot: { width: 12, height: 12, borderRadius: 999, backgroundColor: 'rgba(229,231,235,0.25)' },
  optionDotActive: { backgroundColor: 'rgba(34, 211, 238, 0.9)' },
  optionText: { color: 'rgba(229,231,235,0.86)', flex: 1 },
  optionTextActive: { color: '#e5e7eb', fontWeight: '900' },
  optionRowCorrect: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)' },
  optionRowIncorrect: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' },
  assessmentQuestion: { marginTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.12)' },
  assessmentResult: { marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.08)' },
  assessmentResultTitle: { color: '#e5e7eb', fontWeight: '800' },
  referencesSection: { marginTop: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(56,189,248,0.22)' },
  referenceCard: { marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: 'rgba(2,16,31,0.55)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.20)' },
  referenceTitle: { color: '#e5e7eb', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  referenceMeta: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 4 },
  referenceActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  referenceLinkButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6 },
  referenceLinkText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
});

export default ModuleDetail;
