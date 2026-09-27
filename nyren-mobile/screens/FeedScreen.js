import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Image,
  Linking,
  Alert,
  Platform,
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
const BLUE = '#1185FE'; // Bluesky brand blue

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

const handleForName = (name) => {
  if (!name) return '@researcher';
  return `@${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
};

const formatTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
};

const absoluteUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  return `${getApiBaseUrl()}${relativeUrl}`;
};

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

const POST_TYPE_META = {
  post: { label: 'Post', icon: '📝' },
  abstract: { label: 'Abstract', icon: '📄' },
  meme: { label: 'Meme', icon: '😂' },
  image: { label: 'Figure', icon: '🖼️' },
};

const FILTERS = [
  { key: null, label: 'All' },
  { key: 'post', label: '📝 Posts' },
  { key: 'abstract', label: '📄 Abstracts' },
  { key: 'meme', label: '😂 Memes' },
  { key: 'image', label: '🖼️ Figures' },
];

const FeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);

  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState('post');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [posting, setPosting] = useState(false);

  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: true }
  const [commentsByPost, setCommentsByPost] = useState({}); // { [postId]: [] }
  const [commentDrafts, setCommentDrafts] = useState({}); // { [postId]: text }

  const loadFeed = useCallback(async (postType) => {
    try {
      const query = postType ? `?postType=${postType}` : '';
      const res = await apiService.get(`/api/feed/posts${query}`);
      const list = res?.data?.data || res?.data || [];
      setPosts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('[FeedScreen] Load error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFeed(filter).finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter])
  );

  const handlePickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.type === 'cancel') return;

      const file = result.assets ? result.assets[0] : result;
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
      const res = await apiService.post('/api/feed/upload', formData, { headers: uploadHeaders });
      const uploaded = res?.data?.data || res?.data;
      if (uploaded?.attachmentUrl) {
        setPendingAttachment({ url: uploaded.attachmentUrl, name: uploaded.attachmentName || fileName, type: uploaded.attachmentType || fileType });
        if (uploaded.attachmentType?.startsWith('image/') || uploaded.attachmentType?.startsWith('video/')) setDraftType('image');
      } else {
        Alert.alert('Upload failed', res?.data?.error || 'No file was returned by the server.');
      }
    } catch (e) {
      console.error('[FeedScreen] Attachment upload error:', e);
      Alert.alert('Upload failed', 'Try an image, video, or PDF under 50MB.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handlePost = async () => {
    const content = draft.trim();
    if (!content && !pendingAttachment) return;

    setPosting(true);
    try {
      const res = await apiService.post('/api/feed/posts', {
        content,
        postType: draftType,
        attachmentUrl: pendingAttachment?.url,
        attachmentName: pendingAttachment?.name,
        attachmentType: pendingAttachment?.type,
      });
      const created = res?.data?.data || res?.data;
      if (created) {
        setPosts((prev) => [created, ...prev]);
        setDraft('');
        setDraftType('post');
        setPendingAttachment(null);
      }
    } catch (e) {
      console.error('[FeedScreen] Post create error:', e);
      Alert.alert('Could not post', 'Try again in a moment.');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (post) => {
    // Optimistic update.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) } : p
      )
    );
    try {
      const res = await apiService.post(`/api/feed/posts/${post.id}/like`, {});
      const data = res?.data?.data || res?.data;
      if (data) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, likedByMe: data.liked, likeCount: data.likeCount } : p)));
      }
    } catch (e) {
      console.error('[FeedScreen] Like error:', e);
      // Revert on failure.
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) } : p
        )
      );
    }
  };

  const handleDeletePost = (postId) => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.delete(`/api/feed/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (e) {
            Alert.alert('Could not delete post', e?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  const toggleComments = async (postId) => {
    const nowExpanded = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nowExpanded }));
    if (nowExpanded && !commentsByPost[postId]) {
      try {
        const res = await apiService.get(`/api/feed/posts/${postId}/comments`);
        const list = res?.data?.data || res?.data || [];
        setCommentsByPost((prev) => ({ ...prev, [postId]: Array.isArray(list) ? list : [] }));
      } catch (e) {
        console.error('[FeedScreen] Comments load error:', e);
      }
    }
  };

  const handleSendComment = async (postId) => {
    const content = (commentDrafts[postId] || '').trim();
    if (!content) return;

    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    try {
      const res = await apiService.post(`/api/feed/posts/${postId}/comments`, { content });
      const created = res?.data?.data || res?.data;
      if (created) {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), created] }));
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p)));
      }
    } catch (e) {
      console.error('[FeedScreen] Comment send error:', e);
      setCommentDrafts((prev) => ({ ...prev, [postId]: content }));
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#000000', '#000000']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.getParent?.()?.openDrawer?.()}>
            <Ionicons name="menu" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <NeonHeader title="Science Feed" subtitle="Blog, share figures, abstracts & memes" />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* COMPOSE */}
          <View style={styles.composeBox}>
            <View style={styles.composeRow}>
              <View style={[styles.avatar, { backgroundColor: colorForName(user?.name) }]}>
                <Text style={styles.avatarText}>{initialsForName(user?.name)}</Text>
              </View>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What's up?"
                placeholderTextColor="rgba(229,231,235,0.4)"
                style={styles.composeInput}
                multiline
              />
            </View>

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
                    <Ionicons name="document-attach" size={26} color={BLUE} />
                  </View>
                )}
                <TouchableOpacity style={styles.pendingAttachmentRemove} onPress={() => setPendingAttachment(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.composeToolbar}>
              <View style={styles.typeSelector}>
                {Object.entries(POST_TYPE_META).map(([key, meta]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.typeChip, draftType === key && styles.typeChipActive]}
                    onPress={() => setDraftType(key)}
                  >
                    <Text style={styles.typeChipText}>{meta.icon}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.attachBtn} onPress={handlePickAttachment} disabled={uploadingAttachment}>
                  {uploadingAttachment ? <ActivityIndicator size="small" color={BLUE} /> : <Ionicons name="image-outline" size={18} color={BLUE} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.postBtn, (!draft.trim() && !pendingAttachment) || posting ? { opacity: 0.4 } : null]}
                onPress={handlePost}
                disabled={(!draft.trim() && !pendingAttachment) || posting}
              >
                <Text style={styles.postBtnText}>{posting ? 'Posting...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FILTERS (Twitter-style underline tabs) */}
          <View style={styles.filterTabBar}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FEED */}
          {loading ? (
            <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 40 }} />
          ) : posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={40} color={BLUE} />
              <Text style={styles.emptyStateText}>No posts yet. Be the first to share something!</Text>
            </View>
          ) : (
            posts.map((post) => {
              const isImage = post.attachmentType?.startsWith('image/');
              const isVideo = post.attachmentType?.startsWith('video/');
              const meta = POST_TYPE_META[post.postType] || POST_TYPE_META.post;
              return (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={[styles.avatar, { backgroundColor: colorForName(post.userName) }]}>
                      <Text style={styles.avatarText}>{initialsForName(post.userName)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <Text style={styles.postAuthor}>{post.userName}</Text>
                        <Text style={styles.postHandle}>{handleForName(post.userName)}</Text>
                        <Text style={styles.postTimeDot}>·</Text>
                        <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
                      </View>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{meta.icon} {meta.label}</Text>
                      </View>
                    </View>
                    {post.isMine ? (
                      <TouchableOpacity onPress={() => handleDeletePost(post.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={18} color="rgba(229,231,235,0.45)" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {post.content ? <Linkified text={post.content} style={styles.postContent} /> : null}

                  {post.attachmentUrl && isImage ? (
                    <Image source={{ uri: absoluteUrl(post.attachmentUrl) }} style={styles.postImage} />
                  ) : post.attachmentUrl && isVideo ? (
                    <Video
                      source={{ uri: absoluteUrl(post.attachmentUrl) }}
                      style={styles.postImage}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                    />
                  ) : post.attachmentUrl ? (
                    <TouchableOpacity style={styles.attachmentChip} onPress={() => Linking.openURL(absoluteUrl(post.attachmentUrl))}>
                      <Ionicons name="document-attach" size={16} color={BLUE} />
                      <Text style={styles.attachmentChipText} numberOfLines={1}>{post.attachmentName || 'Attachment'}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => toggleComments(post.id)}>
                      <Ionicons name="chatbubble-outline" size={18} color="rgba(229,231,235,0.55)" />
                      <Text style={styles.actionText}>{post.commentCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => handleToggleLike(post)}>
                      <Ionicons name={post.likedByMe ? 'heart' : 'heart-outline'} size={18} color={post.likedByMe ? '#f472b6' : 'rgba(229,231,235,0.55)'} />
                      <Text style={[styles.actionText, post.likedByMe && { color: '#f472b6' }]}>{post.likeCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      activeOpacity={0.6}
                      onPress={() => Linking.openURL(absoluteUrl(post.attachmentUrl) || 'https://')}
                      disabled={!post.attachmentUrl}
                    >
                      <Ionicons name="share-outline" size={18} color={post.attachmentUrl ? 'rgba(229,231,235,0.55)' : 'rgba(229,231,235,0.2)'} />
                    </TouchableOpacity>
                  </View>

                  {expandedComments[post.id] ? (
                    <View style={styles.commentsBox}>
                      {(commentsByPost[post.id] || []).map((c) => (
                        <View key={c.id} style={styles.commentRow}>
                          <View style={[styles.avatarSmall, { backgroundColor: colorForName(c.userName) }]}>
                            <Text style={styles.avatarTextSmall}>{initialsForName(c.userName)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.commentAuthor}>{c.userName}</Text>
                            <Text style={styles.commentContent}>{c.content}</Text>
                          </View>
                        </View>
                      ))}
                      <View style={styles.commentInputRow}>
                        <TextInput
                          value={commentDrafts[post.id] || ''}
                          onChangeText={(t) => setCommentDrafts((prev) => ({ ...prev, [post.id]: t }))}
                          placeholder="Write a comment..."
                          placeholderTextColor="rgba(229,231,235,0.4)"
                          style={styles.commentInput}
                        />
                        <TouchableOpacity onPress={() => handleSendComment(post.id)}>
                          <Ionicons name="send" size={16} color={BLUE} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1220' },
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, gap: 12 },
  menuBtn: { padding: 8, marginTop: 4 },
  composeBox: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 8,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  composeRow: { flexDirection: 'row', gap: 12 },
  composeInput: { flex: 1, color: '#fff', fontSize: 16, minHeight: 40, textAlignVertical: 'top', paddingTop: 6 },
  pendingAttachmentPreview: {
    marginTop: 8,
    marginLeft: 56,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  pendingAttachmentThumb: {
    width: 160,
    height: 160,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pendingAttachmentFileIcon: { alignItems: 'center', justifyContent: 'center' },
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
  composeToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginLeft: 56,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  typeSelector: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  typeChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: { backgroundColor: 'rgba(17,133,254,0.18)' },
  typeChipText: { fontSize: 15 },
  attachBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  postBtn: { backgroundColor: BLUE, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 7 },
  postBtnText: { color: '#05101f', fontWeight: '800', fontSize: 13 },
  filterTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: BLUE },
  filterTabText: { color: 'rgba(229,231,235,0.5)', fontSize: 12, fontWeight: '700' },
  filterTabTextActive: { color: '#fff' },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyStateText: { color: 'rgba(229,231,235,0.6)', textAlign: 'center' },
  postCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#05101f', fontWeight: '800', fontSize: 14 },
  postAuthor: { color: '#e5e7eb', fontWeight: '800', fontSize: 15 },
  postHandle: { color: 'rgba(229,231,235,0.45)', fontSize: 14 },
  postTimeDot: { color: 'rgba(229,231,235,0.35)', fontSize: 13 },
  postTime: { color: 'rgba(229,231,235,0.45)', fontSize: 13 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  typeBadgeText: { color: 'rgba(229,231,235,0.7)', fontSize: 10, fontWeight: '700' },
  postContent: { color: '#e5e7eb', fontSize: 15, lineHeight: 21, marginBottom: 10, marginLeft: 54 },
  link: { color: BLUE },
  postImage: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 54,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(17,133,254,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(17,133,254,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '90%',
  },
  attachmentChipText: { color: '#a5d8ff', fontSize: 12, flexShrink: 1 },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginLeft: 54,
    maxWidth: 260,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingRight: 12 },
  actionText: { color: 'rgba(229,231,235,0.55)', fontSize: 13, fontWeight: '600' },
  commentsBox: { marginTop: 12, marginLeft: 54, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  avatarSmall: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarTextSmall: { color: '#05101f', fontWeight: '800', fontSize: 10 },
  commentAuthor: { color: '#e5e7eb', fontWeight: '700', fontSize: 12 },
  commentContent: { color: 'rgba(229,231,235,0.8)', fontSize: 13, marginTop: 1 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
  },
});

export default FeedScreen;
