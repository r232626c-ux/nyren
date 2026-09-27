import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { apiService } from '../services/apiService';
import NeonHeader from '../components/NeonHeader';


const categoryColors = {
  CORE_AI: '#3B82F6',
  APPLIED_AI: '#8B5CF6',
  AI_ENGINEERING: '#EC4899',
  BIOLOGY: '#10B981',
  CHEMISTRY: '#F59E0B',
  PHYSICS_MATHS: '#06B6D4',
  CORE_BIOINFORMATICS: '#14B8A6',
  ADVANCED_BIOINFORMATICS: '#6366F1',
};

const categoryNames = {
  CORE_AI: 'AI & Machine Learning',
  APPLIED_AI: 'Biomedical AI',
  AI_ENGINEERING: 'AI Engineering',
  BIOLOGY: 'Biology',
  CHEMISTRY: 'Chemistry',
  PHYSICS_MATHS: 'Physics & Mathematics',
  CORE_BIOINFORMATICS: 'Bioinformatics',
  ADVANCED_BIOINFORMATICS: 'Advanced Bioinformatics',
};


const normalizeArray = (res, keys = []) => {
  const data = res?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};


const LearnScreen = ({ navigation }) => {

  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState(null);
  const [progressRows, setProgressRows] = useState([]);
  const [progressSummary, setProgressSummary] = useState({});
  const [certificates, setCertificates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('CORE_AI');

  const [activeTab, setActiveTab] = useState('courses');

  const [searchMode, setSearchMode] = useState(false);


  /*
   * ---------------------------------------------------------
   * LOAD COURSES
   * ---------------------------------------------------------
   */

  const loadCourses = useCallback(async () => {

    try {

      setLoading(true);

      const [coursesRes, categoriesRes] = await Promise.all([

        apiService.get(
          `/api/learn/modules?category=${selectedCategory}&limit=50`
        ),

        apiService.get('/api/learn/categories'),

      ]);

      const courseData = normalizeArray(
        coursesRes,
        ['modules', 'courses']
      );

      setCourses(courseData);

    } catch (error) {

      console.error(
        '[COLI Learn] Course loading error:',
        error
      );

      setCourses([]);

    } finally {

      setLoading(false);

    }

  }, [selectedCategory]);


  /*
   * ---------------------------------------------------------
   * LOAD PROGRESS
   * ---------------------------------------------------------
   */

  const loadProgress = useCallback(async () => {

    try {

      const response =
        await apiService.get('/api/learn/progress');

      const data =
        response?.stats ||
        response?.data?.stats ||
        response?.data?.data ||
        response?.data ||
        {};

      setProgress(data);
      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
      setProgressRows(rows);

    } catch (error) {

      console.error(
        '[COLI Learn] Progress error:',
        error
      );

    }

  }, []);


  /*
   * ---------------------------------------------------------
   * LOAD COURSE SUMMARY
   * ---------------------------------------------------------
   */

  const loadProgressSummary = useCallback(async () => {

    try {

      const response =
        await apiService.get(
          '/api/learn/progress/summary'
        );

      const data =
        response?.data?.data ||
        response?.data ||
        {};

      setProgressSummary(
        typeof data === 'object'
          ? data
          : {}
      );

    } catch (error) {

      console.error(
        '[COLI Learn] Summary error:',
        error
      );

    }

  }, []);


  /*
   * ---------------------------------------------------------
   * LOAD CERTIFICATES
   * ---------------------------------------------------------
   */

  const loadCertificates = useCallback(async () => {

    try {

      const response =
        await apiService.get(
          '/api/learn/certificates'
        );

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      setCertificates(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        '[COLI Learn] Certificate error:',
        error
      );

      setCertificates([]);

    }

  }, []);


  useEffect(() => {

    loadCourses();

  }, [loadCourses]);


  useFocusEffect(

    useCallback(() => {

      loadProgress();

      loadProgressSummary();

    }, [
      loadProgress,
      loadProgressSummary
    ])

  );


  useEffect(() => {

    if (
      activeTab === 'certificates'
    ) {

      loadCertificates();

    }

  }, [
    activeTab,
    loadCertificates
  ]);


  /*
   * ---------------------------------------------------------
   * COURSE PROGRESS
   * ---------------------------------------------------------
   */

  const getCourseProgress = (course) => {

    const summary =
      progressSummary?.[course?.id];

    if (summary) {

      return {

        percent:
          Number(summary.percent || 0),

        completedLessons:
          Number(
            summary.completedLessons || 0
          ),

        totalLessons:
          Number(
            summary.totalLessons || 0
          ),

        status:
          summary.status || 'not_started',
        lastAccessedAt: summary.lastAccessedAt || null,

      };

    }


    return {

      percent:
        Number(course?.progressPercent || 0),

      completedLessons:
        Number(course?.completedLessons || 0),

      totalLessons:
        Number(
          course?.totalLessons ||
          course?.lessonsCount ||
          0
        ),

      status:
        course?.status || 'not_started',
      lastAccessedAt: course?.lastAccessedAt || null,

    };

  };


  /*
   * ---------------------------------------------------------
   * CONTINUE LEARNING
   * ---------------------------------------------------------
   */

  const continueCourse = useMemo(() => {

    const activeCourses =
      courses
        .map(course => ({
          course,
          progress:
            getCourseProgress(course),
        }))
        .filter(
          item =>
            item.progress.percent > 0 &&
            item.progress.percent < 100
        )
        .sort((a, b) => new Date(b.progress.lastAccessedAt || 0) - new Date(a.progress.lastAccessedAt || 0));

    return activeCourses[0] || null;

  }, [courses, progressSummary]);

  const progressCourses = useMemo(() => {
    const grouped = new Map();
    for (const row of progressRows) {
      const moduleId = row.moduleId || row.LearningModule?.id;
      if (!moduleId) continue;
      const moduleInfo = row.LearningModule || row.learningModule || {};
      const course = grouped.get(moduleId) || {
        id: moduleId,
        title: moduleInfo.title || 'Course',
        category: moduleInfo.category,
        statuses: [],
        lastAccessedAt: null,
      };
      course.statuses.push(row.status);
      if (!course.lastAccessedAt || new Date(row.lastAccessedAt) > new Date(course.lastAccessedAt)) {
        course.lastAccessedAt = row.lastAccessedAt;
      }
      grouped.set(moduleId, course);
    }
    return [...grouped.values()].map((course) => {
      const summary = progressSummary[course.id];
      const allMastered = course.statuses.length > 0 && course.statuses.every((status) => status === 'mastered');
      return {
        ...course,
        status: allMastered ? 'mastered' : summary?.status || (course.statuses.includes('in_progress') ? 'in_progress' : course.statuses.includes('completed') ? 'completed' : 'not_started'),
        progress: summary,
      };
    }).sort((a, b) => new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0));
  }, [progressRows, progressSummary]);

  const progressCourseSections = [
    { id: 'in_progress', title: 'In Progress', rows: progressCourses.filter((course) => course.status === 'in_progress') },
    { id: 'completed', title: 'Completed', rows: progressCourses.filter((course) => course.status === 'completed') },
    { id: 'mastered', title: 'Mastered', rows: progressCourses.filter((course) => course.status === 'mastered') },
  ];


  /*
   * ---------------------------------------------------------
   * OPEN COURSE
   * ---------------------------------------------------------
   */

  const openCourse = (course) => {

    navigation.navigate(
      'ModuleDetail',
      {
        module: course,
      }
    );

  };


  /*
   * ---------------------------------------------------------
   * CATEGORY SELECTOR
   * ---------------------------------------------------------
 */

  const CategorySelector = () => (

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
    >

      {Object.keys(categoryNames).map(category => {

        const active =
          selectedCategory === category;

        return (

          <TouchableOpacity

            key={category}

            onPress={() =>
              setSelectedCategory(category)
            }

            style={[
              styles.categoryButton,

              active &&
                styles.categoryButtonActive,

              {
                borderColor:
                  categoryColors[category],
              },

            ]}

          >

            <Text
              style={[
                styles.categoryText,

                active &&
                  styles.categoryTextActive,
              ]}
            >

              {categoryNames[category]}

            </Text>

          </TouchableOpacity>

        );

      })}

    </ScrollView>

  );


  /*
   * ---------------------------------------------------------
   * LEARNING STATISTICS
   * ---------------------------------------------------------
 */

  const LearningStats = () => (

    <LinearGradient
      colors={[
        'rgba(34,211,238,0.16)',
        'rgba(139,92,246,0.12)',
      ]}
      style={styles.statsCard}
    >

      <View style={styles.stat}>

        <Ionicons
          name="flame"
          size={22}
          color="#22D3EE"
        />

        <Text style={styles.statNumber}>
          {progress?.currentStreak || 0}
        </Text>

        <Text style={styles.statLabel}>
          Day streak
        </Text>

      </View>


      <View style={styles.stat}>

        <Ionicons
          name="school"
          size={22}
          color="#8B5CF6"
        />

        <Text style={styles.statNumber}>
          {progress?.completed || 0}
        </Text>

        <Text style={styles.statLabel}>
          Completed
        </Text>

      </View>


      <View style={styles.stat}>

        <Ionicons
          name="trophy"
          size={22}
          color="#F59E0B"
        />

        <Text style={styles.statNumber}>
          {progress?.mastered || 0}
        </Text>

        <Text style={styles.statLabel}>
          Mastered
        </Text>

      </View>


      <View style={styles.stat}>

        <Ionicons
          name="time"
          size={22}
          color="#10B981"
        />

        <Text style={styles.statNumber}>
          {Math.round(
            (progress?.totalTimeSeconds || 0) / 60
          )}
        </Text>

        <Text style={styles.statLabel}>
          Minutes
        </Text>

      </View>

    </LinearGradient>

  );


  /*
   * ---------------------------------------------------------
   * CONTINUE LEARNING
   * ---------------------------------------------------------
 */

  const ContinueLearning = () => {

    if (!continueCourse) return null;

    const {
      course,
      progress: courseProgress,
    } = continueCourse;

    return (

      <TouchableOpacity
        onPress={() => openCourse(course)}
        activeOpacity={0.85}
        style={styles.continueCard}
      >

        <LinearGradient
          colors={[
            'rgba(34,211,238,0.20)',
            'rgba(139,92,246,0.18)',
          ]}
          style={styles.continueGradient}
        >

          <View style={{ flex: 1 }}>

            <Text style={styles.eyebrow}>
              CONTINUE LEARNING
            </Text>

            <Text
              style={styles.continueTitle}
              numberOfLines={2}
            >

              {course?.title}

            </Text>


            <Text style={styles.continueMeta}>

              {courseProgress.completedLessons}
              /
              {courseProgress.totalLessons}
              {' '}lessons completed

            </Text>


            <View style={styles.progressTrack}>

              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      `${courseProgress.percent}%`,
                  },
                ]}
              />

            </View>

          </View>


          <View style={styles.playButton}>

            <Ionicons
              name="play"
              size={24}
              color="#06111B"
            />

          </View>

        </LinearGradient>

      </TouchableOpacity>

    );

  };


  /*
   * ---------------------------------------------------------
   * COURSE CARD
   * ---------------------------------------------------------
 */

  const CourseCard = ({ course }) => {

    const courseProgress =
      getCourseProgress(course);

    const color =
      categoryColors[
        course?.category
      ] || '#3B82F6';


    const difficulty = course?.difficulty;


    return (

      <TouchableOpacity

        activeOpacity={0.88}

        onPress={() =>
          openCourse(course)
        }

        style={styles.courseCard}

      >

        <View
          style={[
            styles.courseAccent,
            {
              backgroundColor: color,
            },
          ]}
        />


        <View style={styles.courseContent}>

          <View style={styles.courseTopRow}>

            <View
              style={[
                styles.categoryPill,
                {
                  borderColor:
                    `${color}70`,
                },
              ]}
            >

              <Text
                style={[
                  styles.categoryPillText,
                  {
                    color,
                  },
                ]}
              >

                {categoryNames[
                  course?.category
                ] || 'Science'}

              </Text>

            </View>


            {course?.version ? (
              <Text style={styles.courseVersion}>v{course.version}</Text>
            ) : null}

          </View>


          <Text style={styles.courseTitle}>

            {course.title}

          </Text>


          {course.description ? (
            <Text style={styles.courseDescription} numberOfLines={3}>
              {course.description}
            </Text>
          ) : null}


          <View style={styles.courseMetaRow}>

            {course?.estimatedDurationMinutes ? <Text style={styles.courseMeta}>{course.estimatedDurationMinutes} min</Text> : null}


            <Text style={styles.courseMeta}>

              {courseProgress.totalLessons ||
                course?.lessonsCount ||
                0}
              {' '}lessons

            </Text>


            {difficulty ? <Text style={styles.courseMeta}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</Text> : null}

          </View>


          {courseProgress.totalLessons > 0 && (

            <View style={{ marginTop: 14 }}>

              <View style={styles.progressTrack}>

                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        `${Math.min(
                          100,
                          Math.max(
                            0,
                            courseProgress.percent
                          )
                        )}%`,

                      backgroundColor:
                        color,
                    },
                  ]}
                />

              </View>


              <Text style={styles.progressText}>

                {courseProgress.percent}%
                {' '}complete

              </Text>

            </View>

          )}


          <View style={styles.courseFooter}>

            <Text style={styles.viewCourse}>
              {courseProgress.status === 'mastered' ? 'Mastered' : courseProgress.status === 'completed' ? 'Completed' : courseProgress.percent > 0 ? 'Continue' : 'Start Course'}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#22D3EE"
            />

          </View>

        </View>

      </TouchableOpacity>

    );

  };


  /*
   * ---------------------------------------------------------
   * LEARNING PATHS
   * ---------------------------------------------------------
 */

  const LearningPaths = () => courses.length > 0 ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Courses in this subject</Text>
      <Text style={styles.sectionSubtitle}>
        Published courses from the selected curriculum category, in curriculum order.
      </Text>
      {courses.map((course, index) => (
        <TouchableOpacity
          key={`sequence-${course.id}`}
          style={styles.pathCard}
          onPress={() => openCourse(course)}
          accessibilityRole="button"
          accessibilityLabel={`Open course ${course.title}`}
        >
          <View style={styles.sequenceNumber}><Text style={styles.sequenceNumberText}>{index + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pathTitle}>{course.title}</Text>
            {course.description ? <Text style={styles.pathText} numberOfLines={2}>{course.description}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#22D3EE" />
        </TouchableOpacity>
      ))}
    </View>
  ) : null;


  /*
   * ---------------------------------------------------------
   * CERTIFICATES
   * ---------------------------------------------------------
 */

  const Certificates = () => (

    <View style={styles.section}>

      <Text style={styles.sectionTitle}>
        Certificates
      </Text>

      <Text style={styles.sectionSubtitle}>
        Certificates are issued after completing
        the required course learning activities
        and assessments.
      </Text>


      {certificates.length === 0 ? (

        <View style={styles.empty}>

          <Ionicons
            name="ribbon-outline"
            size={52}
            color="#22D3EE"
          />

          <Text style={styles.emptyTitle}>
            Your certificates will appear here
          </Text>

          <Text style={styles.emptyText}>
            Complete a course and satisfy its
            assessment requirements to earn a
            certificate.
          </Text>

        </View>

      ) : (

        certificates.map(
          (certificate, index) => (

            <View
              key={
                certificate.moduleId ||
                index
              }
              style={styles.certificate}
            >

              <Ionicons
                name="ribbon"
                size={36}
                color="#F59E0B"
              />

              <View style={{ flex: 1 }}>

                <Text
                  style={
                    styles.certificateTitle
                  }
                >

                  {certificate.title}

                </Text>

                <Text
                  style={
                    styles.certificateText
                  }
                >

                  {certificate.totalLessons}
                  {' '}lessons completed

                </Text>

              </View>

            </View>

          )
        )

      )}

    </View>

  );


  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
 */

  if (loading) {

    return (

      <SafeAreaView
        style={styles.loadingContainer}
      >

        <ActivityIndicator
          size="large"
          color="#22D3EE"
        />

        <Text style={styles.loadingText}>
          Building your learning environment...
        </Text>

      </SafeAreaView>

    );

  }


  /*
   * ---------------------------------------------------------
   * MAIN UI
   * ---------------------------------------------------------
 */

  return (

    <SafeAreaView style={styles.container}>

      <LinearGradient
        colors={[
          '#050816',
          '#080E1D',
          '#0A1020',
        ]}
        style={styles.background}
      >


        <View style={styles.header}>

          <TouchableOpacity
            onPress={() =>
              navigation
                .getParent?.()
                ?.openDrawer?.()
            }
            style={styles.menuButton}
          >

            <Ionicons
              name="menu"
              size={25}
              color="#38BDF8"
            />

          </TouchableOpacity>


          <NeonHeader
            title="Learn"
            subtitle="AI • Science • Bioinformatics"
          />

        </View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >


          <LearningStats />


          <View style={styles.tabs}>

            <TouchableOpacity
              onPress={() =>
                setActiveTab('courses')
              }
              style={[
                styles.tab,
                activeTab === 'courses' &&
                  styles.activeTab,
              ]}
            >

              <Text
                style={[
                  styles.tabText,
                  activeTab === 'courses' &&
                    styles.activeTabText,
                ]}
              >
                Explore
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              onPress={() =>
                setActiveTab('progress')
              }
              style={[
                styles.tab,
                activeTab === 'progress' &&
                  styles.activeTab,
              ]}
            >

              <Text
                style={[
                  styles.tabText,
                  activeTab === 'progress' &&
                    styles.activeTabText,
                ]}
              >
                My Learning
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              onPress={() =>
                setActiveTab('certificates')
              }
              style={[
                styles.tab,
                activeTab === 'certificates' &&
                  styles.activeTab,
              ]}
            >

              <Text
                style={[
                  styles.tabText,
                  activeTab === 'certificates' &&
                    styles.activeTabText,
                ]}
              >
                Certificates
              </Text>

            </TouchableOpacity>

          </View>


          {activeTab === 'courses' && (

            <>

              <ContinueLearning />


              <View style={styles.section}>

                <Text style={styles.sectionTitle}>
                  Explore courses
                </Text>

                <Text style={styles.sectionSubtitle}>
                  University-style learning designed
                  for biomedical science, AI and
                  computational research.
                </Text>

              </View>


              <CategorySelector />


              <View style={styles.courseList}>

                {courses.length > 0 ? (

                  courses.map(course => (

                    <CourseCard
                      key={course.id}
                      course={course}
                    />

                  ))

                ) : (

                  <View style={styles.empty}>

                    <Ionicons
                      name="book-outline"
                      size={50}
                      color="#22D3EE"
                    />

                    <Text
                      style={styles.emptyTitle}
                    >
                      No courses available
                    </Text>

                    <Text
                      style={styles.emptyText}
                    >
                      New scientific courses will
                      appear here as they are added
                      to the COLI curriculum.
                    </Text>

                  </View>

                )}

              </View>


              <LearningPaths />

            </>

          )}


          {activeTab === 'progress' && (

            <View style={styles.section}>

              <Text style={styles.sectionTitle}>
                My learning
              </Text>

              <Text style={styles.sectionSubtitle}>
                Track your knowledge development,
                course completion and mastery.
              </Text>


              <LearningStats />


              <View style={styles.progressPanel}>

                <Text style={styles.panelTitle}>
                  Overall progress
                </Text>

                <Text style={styles.bigNumber}>
                  {progressCourseSections.find((section) => section.id === 'completed')?.rows.length || 0}
                </Text>

                <Text style={styles.panelText}>
                  completed courses
                </Text>

              </View>


              <View style={styles.progressPanel}>

                <Text style={styles.panelTitle}>
                  Knowledge mastery
                </Text>

                <Text style={styles.bigNumber}>
                  {progressCourseSections.find((section) => section.id === 'mastered')?.rows.length || 0}
                </Text>

                <Text style={styles.panelText}>
                  mastered courses
                </Text>

              </View>

              {progressCourseSections.map((section) => (
                <View key={section.id} style={styles.progressCourseSection}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.rows.length === 0 ? (
                    <Text style={styles.sectionSubtitle}>No courses in this section yet.</Text>
                  ) : section.rows.map((course) => (
                    <TouchableOpacity key={course.id} style={styles.progressCourseRow} onPress={() => openCourse({ id: course.id, title: course.title, category: course.category })}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.progressCourseTitle}>{course.title}</Text>
                        {course.progress ? <Text style={styles.courseMeta}>{course.progress.completedLessons || 0}/{course.progress.totalLessons || 0} lessons · {course.progress.percent || 0}%</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#22D3EE" />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

            </View>

          )}


          {activeTab === 'certificates' && (
            <Certificates />
          )}

        </ScrollView>

      </LinearGradient>

    </SafeAreaView>

  );

};


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050816',
  },

  background: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
  },

  menuButton: {
    padding: 8,
    marginRight: 8,
  },

  statsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  stat: {
    alignItems: 'center',
    minWidth: 65,
  },

  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },

  statLabel: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '700',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  activeTab: {
    borderBottomColor: '#22D3EE',
  },

  tabText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },

  activeTabText: {
    color: '#22D3EE',
  },

  continueCard: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 18,
    overflow: 'hidden',
  },

  continueGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  eyebrow: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  continueTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },

  continueMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
  },

  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },

  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#22D3EE',
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 22,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  categoryButtonActive: {
    backgroundColor: 'rgba(34,211,238,0.12)',
  },

  categoryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  courseList: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  courseCard: {
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.10)',
    flexDirection: 'row',
  },

  courseAccent: {
    width: 4,
  },

  courseContent: {
    flex: 1,
    padding: 17,
  },

  courseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryPill: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  categoryPillText: {
    fontSize: 10,
    fontWeight: '900',
  },

  courseTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: 12,
  },

  courseDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },

  courseMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },

  courseMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  courseVersion: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },

  progressText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 5,
  },

  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 15,
    gap: 7,
  },

  viewCourse: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '900',
  },

  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.10)',
  },
  sequenceNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,211,238,0.14)',
  },
  sequenceNumberText: { color: '#22D3EE', fontSize: 13, fontWeight: '900' },

  pathTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },

  pathText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  progressPanel: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.10)',
  },
  progressCourseSection: { marginTop: 22 },
  progressCourseRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.12)',
  },
  progressCourseTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },

  panelTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  bigNumber: {
    color: '#22D3EE',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 10,
  },

  panelText: {
    color: '#64748B',
    fontSize: 12,
  },

  certificate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: 17,
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
  },

  certificateTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  certificateText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },

  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#050816',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#22D3EE',
    marginTop: 12,
    fontWeight: '700',
  },

});

export default LearnScreen;