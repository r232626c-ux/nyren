import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NeonHeader from '../components/NeonHeader';
import { useAuth } from '../src/contexts/AuthContext';
import { apiService, getUserId } from "../services/apiService";

export default function MemoryScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [researchMemories, setResearchMemories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bondLevel, setBondLevel] = useState(0);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [tabUsage, setTabUsage] = useState({ chat: 0, companion: 0, scientific: 0, research: 0, files: 0 });
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { refreshUser } = useAuth();

  /* ---------------- LOAD ---------------- */

  const loadMemoryData = useCallback(async () => {
    setLoading(true);

    try {
      // ensure auth info is fresh
      await refreshUser?.();

      const data = await apiService.getMemories();

      // Backend returns records scoped to the current account.
      const conv = Array.isArray(data?.conversations) ? data.conversations : [];
      const emo = Array.isArray(data?.emotionalMemories) ? data.emotionalMemories : [];
      const bond = typeof data?.bondLevel === "number" ? data.bondLevel : 0;
      const research = Array.isArray(data?.researchMemories) ? data.researchMemories : (data?.researchMemories || []);
      const savedDocuments = Array.isArray(data?.documents) ? data.documents : [];
      setConversations(conv);
      setEmotions(emo);
      setBondLevel(bond);
      setResearchMemories(research);
      setDocuments(savedDocuments);

      // Build simple profile from research ideas + conversation text
      const textPool = [];
      research.forEach(r => {
        if (Array.isArray(r.ideas)) textPool.push(...r.ideas.map((idea) => typeof idea === 'string' ? idea : idea?.title || idea?.abstract || '').filter(Boolean));
        if (r.notes) textPool.push(r.notes);
      });
      conv.forEach(c => {
        if (c?.userInput) textPool.push(c.userInput);
        if (c?.coliResponse) textPool.push(c.coliResponse);
      });

      const joined = textPool.join(' ').toLowerCase();
      const words = joined.match(/\b[a-z]{3,}\b/g) || [];
      const stopwords = new Set(['the','and','for','with','that','this','from','your','are','have','but','not','was','were','will','can']);
      const freq = {};
      words.forEach(w => {
        if (stopwords.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });

      const keywords = Object.entries(freq)
        .sort((a,b) => b[1] - a[1])
        .slice(0,6)
        .map(x => x[0]);

      setProfile({
        topKeywords: keywords,
        searchesCount: research.length,
        conversations: conv.length,
      });

    } catch (err) {
      console.log("Memory load error:", err);
      setConversations([]);
      setEmotions([]);
      setBondLevel(0);
      setProfile(null);
    }

    setLoading(false);
  }, [refreshUser]);

  const loadTabState = useCallback(async () => {
    try {
      const userId = await getUserId();
      const raw = await AsyncStorage.getItem(`MemoryScreenTabState:${userId}`);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.activeTab) {
        setActiveTab(saved.activeTab);
      }
      if (saved?.tabUsage) {
        setTabUsage((prev) => ({ ...prev, ...saved.tabUsage }));
      }
    } catch (error) {
      console.log("MemoryScreen tab state load failed", error);
    }
  }, []);

  const buildMemoryProfile = useCallback(() => {
    const textPool = [];
    researchMemories.forEach((r) => {
      if (Array.isArray(r.ideas)) textPool.push(...r.ideas.map((idea) => typeof idea === 'string' ? idea : idea?.title || idea?.abstract || '').filter(Boolean));
      if (r.notes) textPool.push(r.notes);
    });
    conversations.forEach((c) => {
      if (c?.userInput) textPool.push(c.userInput);
      if (c?.coliResponse) textPool.push(c.coliResponse);
    });

    const joined = textPool.join(" ").toLowerCase();
    const words = joined.match(/\b[a-z]{3,}\b/g) || [];
    const stopwords = new Set(['the','and','for','with','that','this','from','your','are','have','but','not','was','were','will','can']);
    const freq = {};
    words.forEach((w) => {
      if (stopwords.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });

    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map((x) => x[0]);

    const favoriteTab = Object.entries(tabUsage)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'chat';
    const favoriteTabLabel = {
      chat: 'Chat',
      companion: 'Companion',
      scientific: 'Scientific',
      research: 'Research',
      files: 'Files',
    }[favoriteTab];

    const summary = `You are most engaged with ${favoriteTabLabel}, and your memory flow is built around ${favoriteTabLabel.toLowerCase()} tracking.`;

    setProfile({
      topKeywords,
      searchesCount: researchMemories.length,
      conversations: conversations.length,
      favoriteTab: favoriteTabLabel,
      favoriteTabCount: tabUsage[favoriteTab] || 0,
      summary,
    });
  }, [conversations, researchMemories, tabUsage]);

  useEffect(() => {
    buildMemoryProfile();
  }, [buildMemoryProfile]);

  useEffect(() => {
    loadMemoryData();
    loadTabState();
  }, [loadMemoryData, loadTabState]);

  useEffect(() => {
    animateTabTransition();
  }, [activeTab]);

  const animateTabTransition = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  const handleTabPress = useCallback(async (tabId) => {
    setActiveTab(tabId);
    const userId = await getUserId();
    setTabUsage((prev) => {
      const next = { ...prev, [tabId]: (prev[tabId] || 0) + 1 };
      AsyncStorage.setItem(`MemoryScreenTabState:${userId}`, JSON.stringify({ activeTab: tabId, tabUsage: next })).catch((err) => {
        console.log("Failed to persist MemoryScreen tab state", err);
      });
      return next;
    });
  }, []);

  /* ---------------- HELPERS ---------------- */

  const getEmotionColor = (mood) => {
    const map = {
      happy: "#22c55e",
      sad: "#3b82f6",
      angry: "#ef4444",
      excited: "#f59e0b",
      anxious: "#eab308",
      calm: "#38bdf8",
      neutral: "#64748b",
    };
    return map[mood] || map.neutral;
  };

  const bondPercent = Math.min(Math.max(bondLevel * 10, 0), 100);

  const tabs = [
    { id: 'chat', label: 'Chat', description: 'Review your latest conversations, messaging style, and how the assistant has been responding.' },
    { id: 'companion', label: 'Companion', description: 'Track your bond strength, emotional timeline, and the sense of connection over time.' },
    { id: 'scientific', label: 'Scientific', description: 'See your research profile, top keywords, and the science-focused notes you have collected.' },
    { id: 'research', label: 'Research', description: 'Browse saved research memories, recent searches, and your evolving investigation topics.' },
    { id: 'files', label: 'Files', description: 'Open your saved documents and continue working with their contents.' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'companion':
        return (
          <>
            <View style={[styles.card, styles.bondCard]}>
              <View style={styles.bondInner}>
                <View style={styles.bondCircle}>
                  <Text style={styles.bondCircleValue}>{bondPercent}%</Text>
                  <Text style={styles.bondCircleLabel}>Bond</Text>
                </View>

                <View style={styles.bondInfo}>
                  <Text style={styles.cardTitle}>Companion Intelligence</Text>
                  <Text style={styles.bondDesc}>A reflection of your shared context, emotional safety, and the assistant's adaptive memory.</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="happy" size={16} color="#fbbf24" />
                <Text style={styles.cardTitle}>Emotional Timeline</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {emotions.length === 0 ? (
                  <Text style={styles.empty}>No emotional data yet</Text>
                ) : (
                  emotions.slice(0, 12).map((e, i) => (
                    <View key={i} style={[styles.emotionChip, { borderColor: getEmotionColor(e?.mood) }]}> 
                      <View style={[styles.emotionChipDot, { backgroundColor: getEmotionColor(e?.mood) }]} />
                      <Text style={styles.emotionChipText}>{(e?.mood || 'unknown').toUpperCase()}</Text>
                      <Text style={styles.emotionChipWhen}>{e?.timestamp ? new Date(e.timestamp).toLocaleDateString() : ''}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </>
        );

      case 'scientific':
        return (
          <>
            <View style={[styles.card, styles.profileCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="flask" size={16} color="#38bdf8" />
                <Text style={styles.cardTitle}>Scientific Snapshot</Text>
              </View>
              {profile ? (
                <>
                  <Text style={styles.profileText}>Top keywords: {profile.topKeywords.join(', ') || '—'}</Text>
                  <Text style={styles.profileMeta}>Searches: {profile.searchesCount} • Conversations: {profile.conversations}</Text>
                  <Text style={styles.profileSummary}>{profile.summary}</Text>
                  <Text style={styles.profileMeta}>Favorite section: {profile.favoriteTab} ({profile.favoriteTabCount})</Text>
                </>
              ) : (
                <Text style={styles.empty}>Profile not available</Text>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="book" size={16} color="#c084fc" />
                <Text style={styles.cardTitle}>Research memory</Text>
              </View>
              {researchMemories.length === 0 ? (
                <Text style={styles.empty}>No research memory saved yet</Text>
              ) : (
                researchMemories.map((item, idx) => (
                  <View key={idx} style={styles.researchItem}>
                    <Text style={styles.researchLabel}>Ideas</Text>
                    <Text style={styles.researchText}>{(item.ideas || []).slice(0, 3).map((idea) => typeof idea === 'string' ? idea : idea?.title || 'Saved paper').join(', ') || '—'}</Text>
                    <Text style={styles.researchLabel}>Notes</Text>
                    <Text style={styles.researchText}>{item.notes || '—'}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        );

      case 'research':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bookmarks" size={16} color="#22c55e" />
              <Text style={styles.cardTitle}>Research Memory</Text>
            </View>
            {researchMemories.length === 0 ? (
              <Text style={styles.empty}>No saved research entries yet.</Text>
            ) : (
              researchMemories.map((item, idx) => (
                <View key={idx} style={styles.memoryEntry}>
                  <Text style={styles.memoryTitle}>Entry {idx + 1}</Text>
                    <Text style={styles.memoryText}>Ideas: {(item.ideas || []).slice(0, 3).map((idea) => typeof idea === 'string' ? idea : idea?.title || idea?.abstract || 'Saved paper').join(', ') || '—'}</Text>
                  <Text style={styles.memoryText}>Notes: {item.notes || '—'}</Text>
                </View>
              ))
            )}
          </View>
        );

      case 'files':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="documents" size={16} color="#38bdf8" />
              <Text style={styles.cardTitle}>Your Documents</Text>
            </View>
            {documents.length === 0 ? (
              <Text style={styles.empty}>Documents you upload for analysis will be kept here.</Text>
            ) : documents.map((document) => (
              <TouchableOpacity
                key={document.id}
                style={styles.documentRow}
                onPress={() => navigation.navigate('Chat', { presetDocId: document.id, presetDocName: document.name })}
              >
                <Ionicons name="document-text-outline" size={20} color="#38bdf8" />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName} numberOfLines={2}>{document.name}</Text>
                  <Text style={styles.documentDate}>{new Date(document.createdAt).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'chat':
      default:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubbles" size={16} color="#fef3c7" />
              <Text style={styles.cardTitle}>Chat Overview</Text>
            </View>
            <Text style={styles.profileText}>Your latest conversations are stored here so the assistant can stay aligned with your requests.</Text>
            {conversations.length === 0 ? (
              <Text style={styles.empty}>No conversations stored</Text>
            ) : (
              conversations.map((c, i) => (
                <View key={i} style={styles.convoRow}>
                  <View style={[styles.convoLeftAccent, c?.isImportant && styles.convoImportantAccent]} />
                  <View style={styles.convoBody}>
                    <Text style={styles.convoUser}>You</Text>
                    <Text style={styles.convoUserText}>{c?.userInput || '—'}</Text>
                    <Text style={styles.convoBot}>Coli</Text>
                    <Text style={styles.convoBotText}>{c?.coliResponse || '—'}</Text>
                  </View>
                  <View style={styles.convoMeta}>
                    {c?.isImportant ? <Ionicons name="star" size={14} color="#fbbf24" /> : null}
                    <Text style={styles.convoTime}>{c?.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        );
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* LUXURY HEADER */}
      <LinearGradient
        colors={["rgba(56,189,248,0.06)", "rgba(251,191,36,0.06)"]}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.headerGradient}
      >
        <View style={styles.headerRowTop}>
          <TouchableOpacity onPress={() => navigation.getParent?.()?.openDrawer?.()} style={styles.menuBtn}>
            <Ionicons name="menu" size={22} color="#fde68a" />
          </TouchableOpacity>
          <NeonHeader title="Memory Core" subtitle="Cognitive archive — emotional intelligence" />
          <Pressable onPress={loadMemoryData} style={styles.headerAction}>
            <Ionicons name="refresh" size={18} color="#fef3c7" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={[styles.card, styles.tabCard]}>
        <View style={styles.cardHeader}>
          <Ionicons name="layers" size={16} color="#60a5fa" />
          <Text style={styles.cardTitle}>Memory Tabs</Text>
        </View>
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.tabDescription}>{tabs.find((t) => t.id === activeTab)?.description || ''}</Text>
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
      >
        {renderTabContent()}
      </Animated.View>

      {/* Floating action */}
      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <LinearGradient colors={["#fbbf24", "#fde68a"]} style={styles.fabGradient}>
          <Ionicons name="add" size={22} color="#020617" />
        </LinearGradient>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.18)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 16,
  },
  bondValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  caption: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748b',
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 18,
    padding: 16,
  },
  emotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
    backgroundColor: '#38bdf8',
  },
  emotionContent: {
    flex: 1,
  },
  emotionMood: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 15,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  emotionTrigger: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  emotionTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  chatItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  userText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  coliText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 10,
    textAlign: 'right',
  },
  refreshBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 18,
    marginTop: 14,
    ...Platform.select({
      web: {
        boxShadow: '0px 14px 28px rgba(56, 189, 248, 0.22)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.28,
        shadowOffset: { width: 0, height: 14 },
        shadowRadius: 18,
        elevation: 6,
      },
    }),
  },
  refreshIcon: {
    marginRight: 8,
  },
  documentRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  documentDate: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 12,
  },
  refreshText: {
    color: '#020617',
    fontWeight: '700',
    fontSize: 15,
  },
  empty: {
    color: '#64748b',
    ...Platform.select({
      web: {
        boxShadow: '0px 14px 28px rgba(56, 189, 248, 0.22)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.28,
        shadowOffset: { width: 0, height: 14 },
        shadowRadius: 18,
        elevation: 6,
      },
    }),
    backgroundColor: 'rgba(8,12,24,0.9)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.08)',
  },
  profileText: {
    color: '#e6eef9',
    fontWeight: '700',
    marginBottom: 6,
  },
  profileSummary: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20,
  },
  profileMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  tabCard: {
    paddingBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: 10,
    marginBottom: 10,
  },
  tabItemActive: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderColor: 'rgba(96,165,250,0.28)',
  },
  tabLabel: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#f8fafc',
  },
  tabDescription: {
    color: '#cbd5e1',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  researchItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
  },
  researchLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '700',
  },
  researchText: {
    color: '#e2e8f0',
    marginBottom: 10,
    lineHeight: 20,
  },
  memoryEntry: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
  },
  memoryTitle: {
    color: '#fef3c7',
    fontWeight: '800',
    marginBottom: 6,
  },
  memoryText: {
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  menuBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  headerGradient: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },
  headerRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.12)'
  },
  bondCard: {
    borderLeftWidth: 0,
    backgroundColor: 'linear-gradient(180deg, rgba(6,8,18,0.95), rgba(12,8,36,0.98))',
  },
  bondInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bondCircle: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#071024',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fbbf24',
    marginRight: 18,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(251, 191, 36, 0.18)',
      },
      default: {
        shadowColor: '#fbbf24',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
      },
    }),
  },
  bondCircleValue: {
    color: '#fde68a',
    fontSize: 22,
    fontWeight: '900',
  },
  bondCircleLabel: {
    color: '#fef3c7',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(251, 191, 36, 0.18)',
      },
      default: {
        shadowColor: '#fbbf24',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
      },
    }),
  },
  bondDesc: {
    color: '#94a3b8',
    marginTop: 6,
    marginBottom: 12,
  },
  viewDeepBtn: {
    backgroundColor: 'rgba(251,191,36,0.14)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  viewDeepText: {
    color: '#fde68a',
    fontWeight: '800',
  },
  chipsRow: {
    marginTop: 8,
  },
  emotionChip: {
    minWidth: 120,
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  emotionChipDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  emotionChipText: {
    color: '#fef3c7',
    fontWeight: '800',
    fontSize: 12,
  },
  emotionChipWhen: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  convoLeftAccent: {
    width: 6,
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 6,
    marginRight: 12,
  },
  convoImportantAccent: {
    backgroundColor: '#f472b6',
  },
  convoBody: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 12,
  },
  convoUser: {
    color: '#fde68a',
    fontWeight: '900',
    fontSize: 12,
  },
  convoUserText: {
    color: '#e6eef9',
    marginTop: 6,
    marginBottom: 8,
  },
  convoBot: {
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 12,
  },
  convoBotText: {
    color: '#e6eef9',
    marginTop: 6,
  },
  convoTime: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 10,
  },
  convoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 62,
    height: 62,
    borderRadius: 32,
    elevation: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});