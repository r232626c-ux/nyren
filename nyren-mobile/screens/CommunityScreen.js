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
  Modal,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { getApiBaseUrl } from '../services/config';
import { useAuth } from '../src/contexts/AuthContext';
import NeonHeader from '../components/NeonHeader';

const AVATAR_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171'];
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

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

const absoluteUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  return `${getApiBaseUrl()}${relativeUrl}`;
};

// Renders message text with any http(s) links as tappable segments.
const Linkified = ({ text, style }) => {
  const parts = text.split(URL_REGEX);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <Text key={i} style={styles.link} onPress={() => Linking.openURL(part)}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

const POLL_INTERVAL_MS = 4000;

const CommunityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null); // { url, name, type }
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const scrollRef = useRef(null);
  const lastMessageAtRef = useRef(null);
  const pollRef = useRef(null);

  const loadChannels = useCallback(async () => {
    try {
      const res = await apiService.get('/api/community/channels');
      const list = res?.data?.data || res?.data || [];
      setChannels(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        setActiveChannelId((prev) => prev || list[0].id);
      }
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('[CommunityScreen] Channels load error:', e);
      return [];
    }
  }, []);

  const loadMessages = useCallback(async (channelId, { append = false } = {}) => {
    if (!channelId) return;
    try {
      const after = append ? lastMessageAtRef.current : null;
      const query = after ? `?after=${encodeURIComponent(after)}` : '';
      const res = await apiService.get(`/api/community/channels/${channelId}/messages${query}`);
      const list = res?.data?.data || res?.data || [];
      const newMessages = Array.isArray(list) ? list : [];

      if (newMessages.length === 0) return;

      lastMessageAtRef.current = newMessages[newMessages.length - 1].createdAt;
      setMessages((prev) => (append ? [...prev, ...newMessages] : newMessages));
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: append }));
    } catch (e) {
      console.error('[CommunityScreen] Messages load error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChannels();
    }, [loadChannels])
  );

  useEffect(() => {
    if (!activeChannelId) return;

    setLoading(true);
    lastMessageAtRef.current = null;
    setMessages([]);
    loadMessages(activeChannelId).finally(() => setLoading(false));

    pollRef.current = setInterval(() => {
      loadMessages(activeChannelId, { append: true });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeChannelId, loadMessages]);

  const handleSend = async () => {
    const content = draft.trim();
    if ((!content && !pendingAttachment) || !activeChannelId) return;

    setSending(true);
    setDraft('');
    const attachment = pendingAttachment;
    setPendingAttachment(null);
    try {
      const res = await apiService.post(`/api/community/channels/${activeChannelId}/messages`, {
        content,
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        attachmentType: attachment?.type,
      });
      const created = res?.data?.data || res?.data;
      if (created) {
        setMessages((prev) => [...prev, created]);
        lastMessageAtRef.current = created.createdAt;
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      }
    } catch (e) {
      console.error('[CommunityScreen] Send message error:', e);
      setDraft(content); // restore so the user doesn't lose their text
      setPendingAttachment(attachment);
    } finally {
      setSending(false);
    }
  };

  const handlePickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || result.type === 'cancel') return;

      const file = result.assets ? result.assets[0] : result; // support both SDK response shapes
      if (!file?.uri) return;

      setUploadingAttachment(true);
      const fileName = file.name || 'attachment';
      const fileType = file.mimeType || 'application/octet-stream';

      const formData = new FormData();
      if (Platform.OS === 'web') {
        // React Native Web's FormData needs a real Blob/File, not the {uri,name,type} shape.
        const blob = await fetch(file.uri).then((resp) => resp.blob());
        formData.append('file', new File([blob], fileName, { type: fileType }));
      } else {
        formData.append('file', { uri: file.uri, name: fileName, type: fileType });
      }

      // On web, letting the browser set Content-Type itself is required so it
      // can compute the multipart boundary; overriding it corrupts the upload.
      // Native RN needs the header set explicitly (its bridge fills in the boundary).
      const uploadHeaders = Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' };
      const res = await apiService.post('/api/community/upload', formData, { headers: uploadHeaders });
      const uploaded = res?.data?.data || res?.data;
      if (uploaded?.attachmentUrl) {
        setPendingAttachment({
          url: uploaded.attachmentUrl,
          name: uploaded.attachmentName || fileName,
          type: uploaded.attachmentType || fileType,
        });
      } else {
        Alert.alert('Upload failed', res?.data?.error || 'No file was returned by the server.');
      }
    } catch (e) {
      console.error('[CommunityScreen] Attachment upload error:', e);
      Alert.alert('Upload failed', 'Could not share that file. Try an image, video, PDF, CSV, TXT, JSON, or ZIP under 10MB.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleCreateChannel = async () => {
    const name = newChannelName.trim();
    if (!name) return;

    setCreatingChannel(true);
    try {
      const res = await apiService.post('/api/community/channels', {
        name,
        description: newChannelDescription.trim() || undefined,
      });
      const created = res?.data?.data || res?.data;
      setShowCreateModal(false);
      setNewChannelName('');
      setNewChannelDescription('');
      const list = await loadChannels();
      const match = created?.id ? list.find((c) => c.id === created.id) : null;
      if (match) setActiveChannelId(match.id);
    } catch (e) {
      console.error('[CommunityScreen] Create channel error:', e);
      Alert.alert('Could not create channel', 'Try a different name.');
    } finally {
      setCreatingChannel(false);
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  const openMembers = async () => {
    setShowMembersModal(true);
    setLoadingMembers(true);
    try {
      const res = await apiService.get('/api/community/members');
      const list = res?.data?.data || res?.data || [];
      setMembers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('[CommunityScreen] Members load error:', e);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMessageMember = async (member) => {
    try {
      await apiService.post('/api/inbox/requests', { recipientId: member.uuid, message: `Hi ${member.name}, I'd like to connect!` });
      Alert.alert(
        'Request sent',
        `${member.name} will see your message request in their Inbox.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Open Inbox', onPress: () => { setShowMembersModal(false); navigation.navigate('Inbox'); } },
        ]
      );
    } catch (e) {
      console.error('[CommunityScreen] Message member error:', e);
      Alert.alert('Could not send request', 'Try again in a moment.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#070A16', '#080E1D']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation?.getParent?.()?.openDrawer?.()}
          >
            <Ionicons name="menu" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <NeonHeader title="Research Community" subtitle="Talk with other researchers" />
          <TouchableOpacity style={styles.membersBtn} onPress={openMembers}>
            <Ionicons name="people" size={20} color="#22D3EE" />
          </TouchableOpacity>
        </View>

        {/* CHANNEL LIST */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelScroll}>
          <View style={styles.channelRow}>
            {channels.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[styles.channelPill, activeChannelId === ch.id && styles.channelPillActive]}
                onPress={() => setActiveChannelId(ch.id)}
              >
                <Text style={styles.channelIcon}>{ch.icon || '💬'}</Text>
                <Text
                  style={[styles.channelPillText, activeChannelId === ch.id && styles.channelPillTextActive]}
                >
                  {ch.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.channelPill, styles.newChannelPill]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={16} color="#22D3EE" />
              <Text style={[styles.channelPillText, { color: '#22D3EE' }]}>New Channel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {activeChannel?.description ? (
          <Text style={styles.channelDescription}>{activeChannel.description}</Text>
        ) : null}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#22D3EE" />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#22D3EE" />
                  <Text style={styles.emptyStateText}>
                    No messages yet — be the first to say hello in #{activeChannel?.slug || 'this channel'}.
                  </Text>
                </View>
              ) : (
                messages.map((msg) => {
                  const mine = msg.userId === user?.uuid;
                  const isImage = msg.attachmentType?.startsWith('image/');
                  const isVideo = msg.attachmentType?.startsWith('video/');
                  return (
                    <View key={msg.id} style={styles.messageRow}>
                      <View style={[styles.avatar, { backgroundColor: colorForName(msg.userName) }]}>
                        <Text style={styles.avatarText}>{initialsForName(msg.userName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.messageMeta}>
                          <Text style={[styles.messageAuthor, mine && { color: '#22D3EE' }]}>
                            {msg.userName}{mine ? ' (you)' : ''}
                          </Text>
                          <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
                        </View>
                        {msg.content ? <Linkified text={msg.content} style={styles.messageContent} /> : null}
                        {msg.attachmentUrl && isImage ? (
                          <TouchableOpacity onPress={() => Linking.openURL(absoluteUrl(msg.attachmentUrl))}>
                            <Image source={{ uri: absoluteUrl(msg.attachmentUrl) }} style={styles.attachmentImage} />
                          </TouchableOpacity>
                        ) : msg.attachmentUrl && isVideo ? (
                          <Video
                            source={{ uri: absoluteUrl(msg.attachmentUrl) }}
                            style={styles.attachmentImage}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            isLooping={false}
                          />
                        ) : msg.attachmentUrl ? (
                          <TouchableOpacity
                            style={styles.attachmentChip}
                            onPress={() => Linking.openURL(absoluteUrl(msg.attachmentUrl))}
                          >
                            <Ionicons name="document-attach" size={16} color="#22D3EE" />
                            <Text style={styles.attachmentChipText} numberOfLines={1}>
                              {msg.attachmentName || 'Attachment'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {pendingAttachment ? (
            <View style={styles.pendingAttachmentPreview}>
              {pendingAttachment.type?.startsWith('image/') ? (
                <Image source={{ uri: absoluteUrl(pendingAttachment.url) }} style={styles.pendingAttachmentThumb} />
              ) : pendingAttachment.type?.startsWith('video/') ? (
                <Video
                  source={{ uri: absoluteUrl(pendingAttachment.url) }}
                  style={styles.pendingAttachmentThumb}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                />
              ) : (
                <View style={[styles.pendingAttachmentThumb, styles.pendingAttachmentFileIcon]}>
                  <Ionicons name="document-attach" size={22} color="#22D3EE" />
                  <Text style={styles.attachmentChipText} numberOfLines={1}>{pendingAttachment.name}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.pendingAttachmentRemove} onPress={() => setPendingAttachment(null)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handlePickAttachment}
              disabled={uploadingAttachment || !activeChannelId}
            >
              {uploadingAttachment ? (
                <ActivityIndicator size="small" color="#22D3EE" />
              ) : (
                <Ionicons name="attach" size={20} color="#22D3EE" />
              )}
            </TouchableOpacity>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={activeChannel ? `Message #${activeChannel.slug}` : 'Select a channel'}
              placeholderTextColor="rgba(229,231,235,0.45)"
              style={styles.input}
              multiline
              editable={!!activeChannelId}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!draft.trim() && !pendingAttachment) || sending ? { opacity: 0.5 } : null]}
              onPress={handleSend}
              disabled={(!draft.trim() && !pendingAttachment) || sending}
            >
              <Ionicons name="send" size={18} color="#05101f" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create a Channel</Text>
              <TextInput
                value={newChannelName}
                onChangeText={setNewChannelName}
                placeholder="Channel name (e.g. Genomics Tools)"
                placeholderTextColor="rgba(229,231,235,0.45)"
                style={styles.modalInput}
              />
              <TextInput
                value={newChannelDescription}
                onChangeText={setNewChannelDescription}
                placeholder="What's this channel about? (optional)"
                placeholderTextColor="rgba(229,231,235,0.45)"
                style={styles.modalInput}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCreateBtn, (!newChannelName.trim() || creatingChannel) && { opacity: 0.5 }]}
                  onPress={handleCreateChannel}
                  disabled={!newChannelName.trim() || creatingChannel}
                >
                  <Text style={styles.modalCreateText}>{creatingChannel ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showMembersModal} transparent animationType="fade" onRequestClose={() => setShowMembersModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalActions}>
                <Text style={styles.modalTitle}>Researchers on Coli ({members.length})</Text>
              </View>
              {loadingMembers ? (
                <ActivityIndicator size="small" color="#22D3EE" style={{ marginVertical: 20 }} />
              ) : (
                <ScrollView style={{ maxHeight: 320 }}>
                  {members.map((m) => (
                    <View key={m.uuid} style={styles.memberRow}>
                      <View style={[styles.avatar, { backgroundColor: colorForName(m.name) }]}>
                        <Text style={styles.avatarText}>{initialsForName(m.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Text style={styles.messageTime}>Joined {new Date(m.createdAt).toLocaleDateString()}</Text>
                      </View>
                      {m.uuid !== user?.uuid ? (
                        <TouchableOpacity style={styles.messageMemberBtn} onPress={() => handleMessageMember(m)}>
                          <Ionicons name="paper-plane-outline" size={16} color="#22D3EE" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowMembersModal(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  menuBtn: { padding: 8, marginTop: 4 },
  membersBtn: { padding: 8, marginTop: 4 },
  channelScroll: { maxHeight: 56, marginBottom: 4 },
  channelRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  channelPillActive: {
    backgroundColor: 'rgba(56,189,248,0.18)',
    borderColor: '#38bdf8',
  },
  newChannelPill: {
    borderStyle: 'dashed',
    borderColor: 'rgba(34,211,238,0.5)',
  },
  channelIcon: { fontSize: 14 },
  channelPillText: { color: 'rgba(229,231,235,0.7)', fontWeight: '600', fontSize: 13 },
  channelPillTextActive: { color: '#fff' },
  channelDescription: {
    color: 'rgba(229,231,235,0.5)',
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyStateText: { color: 'rgba(229,231,235,0.6)', textAlign: 'center' },
  messageRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#05101f', fontWeight: '800', fontSize: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  memberName: { color: '#e5e7eb', fontWeight: '700', fontSize: 14 },
  messageMemberBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  messageMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  messageAuthor: { color: '#e5e7eb', fontWeight: '700', fontSize: 13 },
  messageTime: { color: 'rgba(229,231,235,0.4)', fontSize: 11 },
  messageContent: { color: 'rgba(229,231,235,0.9)', marginTop: 2, lineHeight: 19 },
  link: { color: '#38bdf8', textDecorationLine: 'underline' },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  attachmentChipText: { color: '#a5d8ff', fontSize: 12, flexShrink: 1 },
  pendingAttachmentPreview: {
    marginHorizontal: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  pendingAttachmentThumb: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pendingAttachmentFileIcon: { alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6 },
  pendingAttachmentRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sendBtn: {
    backgroundColor: '#22D3EE',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0d213d',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
  },
  modalTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 14 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: 'rgba(229,231,235,0.7)', fontWeight: '600' },
  modalCreateBtn: {
    backgroundColor: '#22D3EE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalCreateText: { color: '#05101f', fontWeight: '800' },
});

export default CommunityScreen;
