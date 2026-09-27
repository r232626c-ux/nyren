import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import NeonHeader from '../components/NeonHeader';
import { apiService } from "../services/apiService";

/* ---------------- SCIENTIFIC AGENT ---------------- */

const localReasoning = (query) => ({
  hypothesis: query,
  expansion:
    "AI expanded this hypothesis using biomedical reasoning and systems biology concepts.",
  genes: ["TP53", "BRCA1", "EGFR"],
  pathways: ["DNA Repair", "Cell Cycle"],
});

/* ---------------- MAIN ---------------- */

export default function ResearchScreen({ navigation }) {
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [searchStarted, setSearchStarted] = useState(false);

  const [pubmed, setPubmed] = useState([]);
  const [arxiv, setArxiv] = useState([]);
  const [scholar, setScholar] = useState([]);

  const [synthesis, setSynthesis] = useState(null);

  const [paper, setPaper] = useState(null);
  const [openPaper, setOpenPaper] = useState(false);
  const [savingPaper, setSavingPaper] = useState(false);

  /* ---------------- SAFE API ---------------- */

  const safe = async (fn, fallback = null) => {
    try {
      return await fn();
    } catch (e) {
      console.log("SCIENTIFIC AGENT:", e.message);
      return fallback;
    }
  };

  /* ---------------- RUN AGENT ---------------- */

  const runAgent = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearchStarted(true);

    try {

      // 🔬 direct search for PubMed, arXiv, and Scholar
      const [pubmedRes, arxivRes, scholarRes] = await Promise.all([
        safe(() => apiService.searchPubMed(query), { papers: [] }),
        safe(() => apiService.searchArxiv(query), { papers: [] }),
        safe(() => apiService.searchScholar(query), { papers: [] }),
      ]);

      const pubmedPapers = (pubmedRes?.papers || []).filter(
        (p) => p?.abstract && String(p.abstract).trim().length > 0
      );
      const arxivPapers = (arxivRes?.papers || []).filter(
        (p) => p?.abstract && String(p.abstract).trim().length > 0
      );
      const scholarPapers = (scholarRes?.papers || []);

      setPubmed(pubmedPapers);
      setArxiv(arxivPapers);
      setScholar(scholarPapers || []);

      // Generate synthesis from all papers
      const allPapers = [...pubmedPapers, ...arxivPapers, ...scholarPapers];
      const synthRes = await safe(
        () => apiService.generateScientificSynthesis(allPapers),
        null
      );

      setSynthesis(
        synthRes || {
          summary:
            "No live synthesis available. Local reasoning fallback activated.",
          keyFindings: "Research findings pending API response",
          methodologies: "Standard scientific methodologies employed",
          recommendations: "Continue research with the papers found",
        }
      );

      // save memory safely (non-blocking)
      safe(() =>
        apiService.saveResearchMemory(
          [query],
          [],
          "Research query executed"
        )
      ).catch(() => {
        // Silently fail - memory save is optional
      });
    } catch (e) {
      console.log("AGENT ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PARSE SUMMARY TO POINTS ---------------- */

  const parseSummaryPoints = (summary) => {
    if (!summary) return ["Research analysis in progress"];
    
    let points = [];
    
    // Try to split by existing bullet points or dashes first
    let candidates = summary
      .split(/[•\n-]/)
      .map(p => p.trim())
      .filter(p => p.length > 10);
    
    if (candidates.length > 0) {
      points = candidates;
    } else {
      // Split by sentences if no bullets found
      candidates = summary
        .split(/[.!?]+/)
        .map(p => p.trim())
        .filter(p => p.length > 10);
      
      if (candidates.length > 0) {
        points = candidates;
      } else {
        // Break into chunks if sentences are too long
        const chunks = summary.match(/[^.!?]*[.!?]+/g) || [summary];
        points = chunks.map(c => c.trim()).filter(c => c.length > 5);
      }
    }
    
    // Ensure we always have at least 1 point
    if (points.length === 0) {
      points = [summary.substring(0, 150)];
    }
    
    return points.slice(0, 5); // Limit to 5 key points
  };

  /* ---------------- PAPER VIEW ---------------- */

  const openPaperView = (item) => {
    setPaper(item);
    setOpenPaper(true);
  };

  const openPaperLink = async (url) => {
    if (!url || url === '#') {
      Alert.alert('Paper link unavailable', 'This result does not include a public paper or PDF link.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Could not open paper', error.message || 'Try again later.');
    }
  };

  const savePaperToMemory = async () => {
    if (!paper || savingPaper) return;
    setSavingPaper(true);
    try {
      const result = await apiService.saveResearchMemory(
        [{ type: 'paper', ...paper }],
        [],
        `Saved research paper: ${paper.title || 'Untitled'}`
      );
      if (!result?.success) throw new Error(result?.message || 'Memory save failed');
      Alert.alert('Saved to Memory', 'This paper is now in your research memory.');
    } catch (error) {
      Alert.alert('Could not save paper', error.message || 'Try again later.');
    } finally {
      setSavingPaper(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.getParent?.()?.openDrawer?.()} style={styles.menuBtn}>
        <Ionicons name="menu" size={24} color="#38bdf8" />
      </TouchableOpacity>

      <NeonHeader
        title="Literature search"
        subtitle="Search biomedical research papers and generate AI-powered summaries"
      />

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runAgent}
          returnKeyType="search"
          returnKeyLabel="Search"
          placeholder="Search by title, abstract, authors, keywords..."
          placeholderTextColor="#64748b"
        />

        <TouchableOpacity onPress={runAgent}>
          <Ionicons
            name="flask"
            size={28}
            color="#38bdf8"
          />
        </TouchableOpacity>
      </View>

      {/* LOADING */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#38bdf8" style={{ marginRight: 12 }} />
          <Text style={styles.loadingText}>Loading papers...</Text>
        </View>
      )}

      {/* AI SYNTHESIS */}
      {synthesis && (
        <View style={styles.synthesisCard}>
          <View style={styles.synthesisHeader}>
            <Ionicons name="sparkles" size={20} color="#38bdf8" />
            <Text style={styles.synthesisTitle}>AI Research Summary</Text>
          </View>

          <View style={styles.aiSummaryBox}>
            <Text style={styles.aiSummaryText}>
              {synthesis.summary}
            </Text>
          </View>

          {/* KEY POINTS TO NOTE */}
          <View style={styles.keyPointsContainer}>
            <Text style={styles.keyPointsTitle}>📌 Points to Note</Text>
            {parseSummaryPoints(synthesis.summary).map((point, idx) => (
              <View key={idx} style={styles.keyPointRow}>
                <View style={styles.pointBullet}>
                  <Text style={styles.pointBulletText}>{idx + 1}</Text>
                </View>
                <Text style={styles.keyPointText}>{point}</Text>
              </View>
            ))}
          </View>

          {synthesis.keyFindings && (
            <View style={styles.synthesisSection}>
              <Text style={styles.synthesisLabel}>🔬 Key Findings:</Text>
              <Text style={styles.text}>{synthesis.keyFindings}</Text>
            </View>
          )}

          {synthesis.methodologies && (
            <View style={styles.synthesisSection}>
              <Text style={styles.synthesisLabel}>🧪 Common Methodologies:</Text>
              <Text style={styles.text}>{synthesis.methodologies}</Text>
            </View>
          )}

          {synthesis.recommendations && (
            <View style={styles.synthesisSection}>
              <Text style={styles.synthesisLabel}>💡 Research Recommendations:</Text>
              <Text style={styles.text}>{synthesis.recommendations}</Text>
            </View>
          )}

          <Text style={styles.paperCountBadge}>Based on {pubmed.length + arxiv.length + scholar.length} papers</Text>
        </View>
      )}

      {/* PAPER COUNTS */}
      {(pubmed.length > 0 || arxiv.length > 0 || scholar.length > 0) && (
        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>📊 Research Summary</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>PubMed Papers:</Text>
            <Text style={styles.statValue}>{pubmed.length}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>arXiv Papers:</Text>
            <Text style={styles.statValue}>{arxiv.length}</Text>
          </View>
          {scholar.length > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Scholar Papers:</Text>
              <Text style={styles.statValue}>{scholar.length}</Text>
            </View>
          )}
          <View style={styles.statsRowDivider}>
            <Text style={styles.statLabel}>Total Papers:</Text>
            <Text style={[styles.statValue, { fontSize: 18, color: "#38bdf8" }]}>
              {pubmed.length + arxiv.length + scholar.length}
            </Text>
          </View>
        </View>
      )}

      {/* NO RESULTS */}
      {!loading && searchStarted && query && pubmed.length === 0 && arxiv.length === 0 && scholar.length === 0 && (
        <View style={styles.noResultsCard}>
          <Ionicons name="search" size={32} color="#64748b" />
          <Text style={styles.noResultsText}>
            No papers found for "{query}"
          </Text>
          <Text style={styles.noResultsSubtext}>
            Try a different search term
          </Text>
        </View>
      )}

      {/* PUBMED */}
      <Text style={styles.section}>
        🔬 PubMed Intelligence
      </Text>

      {pubmed.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={styles.paperCard}
          onPress={() => openPaperView(p)}
        >
          <Text style={styles.paperTitle}>
            {p.title}
          </Text>

          <Text style={styles.paperMeta}>
            PMID: {p.pmid}
          </Text>
        </TouchableOpacity>
      ))}

      {/* ARXIV */}
      <Text style={styles.section}>
        🤖 arXiv Intelligence
      </Text>

      {arxiv.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={styles.paperCard}
          onPress={() => openPaperView(p)}
        >
          <Text style={styles.paperTitle}>
            {p.title}
          </Text>

          <Text style={styles.paperMeta}>
            arXiv
          </Text>
        </TouchableOpacity>
      ))}

      {/* GOOGLE SCHOLAR */}
      {scholar.length > 0 && (
        <>
          <Text style={styles.section}>
            🔍 Google Scholar
          </Text>

          {scholar.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.paperCard}
              onPress={() => openPaperView(p)}
            >
              <Text style={styles.paperTitle}>
                {p.title}
              </Text>

              <Text style={styles.paperMeta}>
                Scholar • {p.year || "Unknown Year"}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* PAPER MODAL */}
      <Modal visible={openPaper} animationType="slide">
        <ScrollView style={styles.paperContainer}>
          {paper && (
            <View style={styles.paperDetailCard}>
              <Text style={styles.paperDetailTitle}>
                {paper.title}
              </Text>

              <Text style={styles.paperDetailMeta}>
                {paper.authors?.join(", ")}
              </Text>

              <View style={styles.paperDetailRow}>
                <Text style={styles.paperDetailLabel}>{paper.source?.toUpperCase() || 'SOURCE'}</Text>
                <Text style={styles.paperDetailLabel}>{paper.year || 'Year unknown'}</Text>
                {paper.journal ? <Text style={styles.paperDetailLabel}>{paper.journal}</Text> : null}
              </View>

              <Text style={styles.abstractHeading}>Abstract</Text>
              <Text style={styles.paperAbstract}>
                {paper.abstract || paper.summary || paper.description || paper.excerpt || 'Abstract not available.'}
              </Text>

              <View style={styles.paperActions}>
                <TouchableOpacity
                  style={styles.paperAction}
                  onPress={savePaperToMemory}
                  disabled={savingPaper}
                >
                  {savingPaper ? <ActivityIndicator color="#020617" /> : <Ionicons name="bookmark" size={18} color="#020617" />}
                  <Text style={styles.paperActionText}>{savingPaper ? 'Saving' : 'Save to Memory'}</Text>
                </TouchableOpacity>
                {!!(paper.pdfUrl || paper.url) && (
                  <TouchableOpacity
                    style={[styles.paperAction, styles.paperActionSecondary]}
                    onPress={() => openPaperLink(paper.pdfUrl || paper.url)}
                  >
                    <Ionicons name={paper.pdfUrl ? 'download' : 'open-outline'} size={18} color="#38bdf8" />
                    <Text style={[styles.paperActionText, styles.paperActionSecondaryText]}>
                      {paper.pdfUrl ? 'Open / Download PDF' : 'Open Paper'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.close}
                onPress={() => setOpenPaper(false)}
              >
                <Text style={styles.closeText}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  header: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 1,
    ...Platform.select({
      web: { textShadow: '0px 4px 12px rgba(56,189,248,0.35)' },
      default: { textShadowColor: 'rgba(56,189,248,0.35)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
    }),
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.18)',
    ...Platform.select({
      web: { boxShadow: '0px 10px 24px rgba(56,189,248,0.16)' },
      default: { shadowColor: '#38bdf8', shadowOpacity: 0.16, shadowOffset: { width: 0, height: 10 }, shadowRadius: 24, elevation: 7 },
    }),
    marginBottom: 18,
  },

  input: {
    flex: 1,
    color: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },

  synthesisCard: {
    backgroundColor: 'rgba(12,20,38,0.96)',
    padding: 18,
    borderRadius: 22,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },

  section: {
    color: '#94a3b8',
    marginTop: 26,
    marginBottom: 10,
    fontWeight: '700',
    fontSize: 15,
  },

  paperCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.12)',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 4,
  },

  paperTitle: {
    color: '#E9F2FF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },

  paperMeta: {
    color: '#8EA9D4',
    fontSize: 12,
  },

  statsCard: {
    backgroundColor: 'rgba(8,16,34,0.95)',
    padding: 18,
    borderRadius: 18,
    marginTop: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },

  statsHeader: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  statLabel: {
    color: '#94a3b8',
    fontWeight: '600',
  },

  statValue: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },

  statsRowDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    marginTop: 10,
  },

  noResultsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 24,
    borderRadius: 18,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.12)',
  },

  noResultsText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },

  noResultsSubtext: {
    color: '#8EA9D4',
    fontSize: 14,
    marginTop: 6,
  },

  text: {
    color: '#fff',
    marginTop: 8,
    lineHeight: 22,
  },

  synthesisLabel: {
    color: '#38bdf8',
    marginTop: 14,
    marginBottom: 6,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
  },

  synthesisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56,189,248,0.2)',
  },

  synthesisTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 0.5,
  },

  aiSummaryBox: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    marginBottom: 16,
  },

  aiSummaryText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },

  keyPointsContainer: {
    backgroundColor: 'rgba(56,189,248,0.05)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.15)',
  },

  keyPointsTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  pointBullet: {
    width: 28,
    height: 28,
    borderRadius: 50,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  pointBulletText: {
    color: '#020617',
    fontWeight: '900',
    fontSize: 12,
  },

  keyPointText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },

  synthesisSection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  paperCountBadge: {
    color: '#8EA9D4',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  paperContainer: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 16,
  },

  paperDetailCard: {
    backgroundColor: 'rgba(12,16,32,0.98)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 24,
    elevation: 8,
  },

  paperDetailTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 10,
  },

  paperDetailMeta: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },

  paperDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  paperActions: {
    gap: 10,
    marginTop: 20,
  },

  paperAction: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#38bdf8',
  },

  paperActionSecondary: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
  },

  paperActionText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '700',
  },

  paperActionSecondaryText: {
    color: '#38bdf8',
  },

  paperDetailLabel: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginRight: 14,
  },

  abstractHeading: {
    color: '#CAD7F1',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.6,
  },

  paperAbstract: {
    color: '#E2E8F0',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  loadingText: {
    color: '#38bdf8',
    fontSize: 14,
  },

  close: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.16)',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },

  closeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  menuBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.18)',
    marginBottom: 18,
  },
});