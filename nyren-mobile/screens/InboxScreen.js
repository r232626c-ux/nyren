import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { useAuth } from '../src/contexts/AuthContext';
import NeonHeader from '../components/NeonHeader';

const AVATAR_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171'];

const colorForName = (name) => {
  const str = name || '?';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsForName = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
};

const formatTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const POLL_INTERVAL_MS = 4000;

const InboxScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState('messages'); // messages | requests
  const [requestsSubTab, setRequestsSubTab] = useState('incoming'); // incoming | sent
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const [activeConversation, setActiveConversation] = useState(null); // { id, otherUser }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const lastMessageAtRef = useRef(null);
  const pollRef = useRef(null);

  const loadInbox = useCallback(async () => {
    try {
      const [convosRes, reqRes, sentRes] = await Promise.all([
        apiService.get('/api/inbox/conversations'),
        apiService.get('/api/inbox/requests'),
        apiService.get('/api/inbox/sent'),
      ]);
      setConversations(convosRes?.data?.data || convosRes?.data || []);
      setRequests(reqRes?.data?.data || reqRes?.data || []);
      setSentRequests(sentRes?.data?.data || sentRes?.data || []);
    } catch (e) {
      console.error('[InboxScreen] Load error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadInbox().finally(() => setLoading(false));
    }, [loadInbox])
  );

  const loadMessages = useCallback(async (connectionId, { append = false } = {}) => {
    try {
      const after = append ? lastMessageAtRef.current : null;
      const query = after ? `?after=${encodeURIComponent(after)}` : '';
      const res = await apiService.get(`/api/inbox/conversations/${connectionId}/messages${query}`);
      const list = res?.data?.data || res?.data || [];
      if (list.length === 0) return;
      lastMessageAtRef.current = list[list.length - 1].createdAt;
      setMessages((prev) => (append ? [...prev, ...list] : list));
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: append }));
    } catch (e) {
      console.error('[InboxScreen] Messages load error:', e);
    }
  }, []);

  useEffect(() => {
    if (!activeConversation) return;

    lastMessageAtRef.current = null;
    setMessages([]);
    loadMessages(activeConversation.id);

    pollRef.current = setInterval(() => loadMessages(activeConversation.id, { append: true }), POLL_INTERVAL_MS);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [activeConversation, loadMessages]);

  const handleAccept = async (requestId) => {
    setRespondingId(requestId);
    try {
      await apiService.post(`/api/inbox/requests/${requestId}/accept`, {});
      await loadInbox();
      setTab('messages');
    } catch (e) {
      Alert.alert('Could not accept request', e?.message || 'Try again.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeleteRequest = (requestId) => {
    Alert.alert('Delete request?', 'This removes the request (and any chat history) for both people.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setRespondingId(requestId);
          try {
            await apiService.delete(`/api/inbox/requests/${requestId}`);
            await loadInbox();
          } catch (e) {
            Alert.alert('Could not delete request', e?.message || 'Try again.');
          } finally {
            setRespondingId(null);
          }
        },
      },
    ]);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !activeConversation) return;

    setSending(true);
    setDraft('');
    try {
      const res = await apiService.post(`/api/inbox/conversations/${activeConversation.id}/messages`, { content });
      const created = res?.data?.data || res?.data;
      if (created) {
        setMessages((prev) => [...prev, created]);
        lastMessageAtRef.current = created.createdAt;
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      }
    } catch (e) {
      console.error('[InboxScreen] Send error:', e);
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  // ---- Conversation thread view ----
  if (activeConversation) {
    return (
      <SafeAreaView style={styles.screen}>
        <LinearGradient colors={['#070A16', '#080E1D']} style={styles.background}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setActiveConversation(null)}>
              <Ionicons name="arrow-back" size={24} color="#38bdf8" />
            </TouchableOpacity>
            <NeonHeader title={activeConversation.otherUser?.name || 'Conversation'} subtitle="Direct message" />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.map((msg) => {
                const mine = msg.senderId === user?.uuid;
                return (
                  <View key={msg.id} style={[styles.messageBubbleRow, mine && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.avatar, { backgroundColor: colorForName(msg.senderName) }]}>
                      <Text style={styles.avatarText}>{initialsForName(msg.senderName)}</Text>
                    </View>
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={styles.messageContent}>{msg.content}</Text>
                      <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.inputBar}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message..."
                placeholderTextColor="rgba(229,231,235,0.45)"
                style={styles.input}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
                onPress={handleSend}
                disabled={!draft.trim() || sending}
              >
                <Ionicons name="send" size={18} color="#05101f" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ---- Inbox list view ----
  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#070A16', '#080E1D']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.getParent?.()?.openDrawer?.()}>
            <Ionicons name="menu" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <NeonHeader title="Inbox" subtitle="Direct messages with other researchers" />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, tab === 'messages' && styles.tabActive]} onPress={() => setTab('messages')}>
            <Text style={[styles.tabText, tab === 'messages' && styles.tabTextActive]}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'requests' && styles.tabActive]} onPress={() => setTab('requests')}>
            <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
              Requests{requests.length > 0 ? ` (${requests.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#22D3EE" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {tab === 'messages' &&
              (conversations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="mail-outline" size={40} color="#22D3EE" />
                  <Text style={styles.emptyStateText}>
                    No conversations yet. Message someone from the Community members list to get started.
                  </Text>
                </View>
              ) : (
                conversations.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.conversationRow}
                    onPress={() => setActiveConversation({ id: c.id, otherUser: c.otherUser })}
                  >
                    <View style={[styles.avatar, { backgroundColor: colorForName(c.otherUser?.name) }]}>
                      <Text style={styles.avatarText}>{initialsForName(c.otherUser?.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.conversationName}>{c.otherUser?.name}</Text>
                      <Text style={styles.conversationPreview} numberOfLines={1}>
                        {c.lastMessage?.content || 'Say hello!'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(229,231,235,0.4)" />
                  </TouchableOpacity>
                ))
              ))}

            {tab === 'requests' && (
              <>
                <View style={styles.subTabBar}>
                  <TouchableOpacity
                    style={[styles.subTab, requestsSubTab === 'incoming' && styles.subTabActive]}
                    onPress={() => setRequestsSubTab('incoming')}
                  >
                    <Text style={[styles.subTabText, requestsSubTab === 'incoming' && styles.subTabTextActive]}>
                      Incoming{requests.length > 0 ? ` (${requests.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.subTab, requestsSubTab === 'sent' && styles.subTabActive]}
                    onPress={() => setRequestsSubTab('sent')}
                  >
                    <Text style={[styles.subTabText, requestsSubTab === 'sent' && styles.subTabTextActive]}>
                      Sent{sentRequests.length > 0 ? ` (${sentRequests.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>

                {requestsSubTab === 'incoming' &&
                  (requests.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="person-add-outline" size={40} color="#22D3EE" />
                      <Text style={styles.emptyStateText}>No pending requests.</Text>
                    </View>
                  ) : (
                    requests.map((r) => (
                      <View key={r.id} style={styles.requestCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.avatar, { backgroundColor: colorForName(r.Requester?.name) }]}>
                            <Text style={styles.avatarText}>{initialsForName(r.Requester?.name)}</Text>
                          </View>
                          <Text style={styles.conversationName}>{r.Requester?.name}</Text>
                        </View>
                        {r.requestMessage ? <Text style={styles.requestMessage}>{r.requestMessage}</Text> : null}
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.declineBtn}
                            onPress={() => handleDeleteRequest(r.id)}
                            disabled={respondingId === r.id}
                          >
                            <Text style={styles.declineBtnText}>Delete</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => handleAccept(r.id)}
                            disabled={respondingId === r.id}
                          >
                            <Text style={styles.acceptBtnText}>{respondingId === r.id ? 'Working...' : 'Accept'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ))}

                {requestsSubTab === 'sent' &&
                  (sentRequests.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="paper-plane-outline" size={40} color="#22D3EE" />
                      <Text style={styles.emptyStateText}>
                        You haven't sent any message requests yet. Find someone in Community \u2192 Members.
                      </Text>
                    </View>
                  ) : (
                    sentRequests.map((r) => (
                      <View key={r.id} style={styles.requestCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.avatar, { backgroundColor: colorForName(r.Recipient?.name) }]}>
                            <Text style={styles.avatarText}>{initialsForName(r.Recipient?.name)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.conversationName}>{r.Recipient?.name}</Text>
                          </View>
                          <View style={[styles.statusPill, styles[`statusPill_${r.status}`]]}>
                            <Text style={styles.statusPillText}>{r.status}</Text>
                          </View>
                        </View>
                        {r.requestMessage ? <Text style={styles.requestMessage}>{r.requestMessage}</Text> : null}
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.declineBtn}
                            onPress={() => handleDeleteRequest(r.id)}
                            disabled={respondingId === r.id}
                          >
                            <Text style={styles.declineBtnText}>{respondingId === r.id ? 'Working...' : 'Delete'}</Text>
                          </TouchableOpacity>
                          {r.status === 'accepted' ? (
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => {
                                setTab('messages');
                                setActiveConversation({ id: r.id, otherUser: r.Recipient });
                              }}
                            >
                              <Text style={styles.acceptBtnText}>Open Chat</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    ))
                  ))}
              </>
            )}
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1220' },
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  menuBtn: { padding: 8, marginTop: 4 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: {
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: 'rgba(56,189,248,0.18)', borderColor: '#38bdf8' },
  tabText: { color: 'rgba(229,231,235,0.7)', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  subTabBar: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  subTab: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subTabActive: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.25)' },
  subTabText: { color: 'rgba(229,231,235,0.55)', fontWeight: '600', fontSize: 12 },
  subTabTextActive: { color: '#e5e7eb' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPill_pending: { backgroundColor: 'rgba(245,158,11,0.18)' },
  statusPill_accepted: { backgroundColor: 'rgba(16,185,129,0.18)' },
  statusPill_declined: { backgroundColor: 'rgba(239,68,68,0.18)' },
  statusPillText: { color: '#e5e7eb', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyStateText: { color: 'rgba(229,231,235,0.6)', textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#05101f', fontWeight: '800', fontSize: 13 },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  conversationName: { color: '#e5e7eb', fontWeight: '700', fontSize: 15 },
  conversationPreview: { color: 'rgba(229,231,235,0.55)', fontSize: 13, marginTop: 2 },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 12,
  },
  requestMessage: { color: 'rgba(229,231,235,0.75)', marginTop: 10, lineHeight: 19 },
  requestActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  declineBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  declineBtnText: { color: 'rgba(229,231,235,0.6)', fontWeight: '600' },
  acceptBtn: { backgroundColor: '#22D3EE', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  acceptBtnText: { color: '#05101f', fontWeight: '800' },
  messagesContent: { padding: 16 },
  messageBubbleRow: { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: 'rgba(34,211,238,0.18)', borderTopRightRadius: 2 },
  bubbleTheirs: { backgroundColor: 'rgba(255,255,255,0.06)', borderTopLeftRadius: 2 },
  messageContent: { color: '#e5e7eb', lineHeight: 19 },
  messageTime: { color: 'rgba(229,231,235,0.4)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#22D3EE',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InboxScreen;
