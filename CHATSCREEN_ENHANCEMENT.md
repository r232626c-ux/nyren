/**
 * 🔍 ENHANCED SEARCH MODES for ChatScreen
 * 
 * This file shows how to UPDATE ChatScreen.js to support:
 * - Standard Search (default)
 * - Consensus Mode (research agreement analysis)
 * - Scholar Mode (academic papers focus)
 * - Web Mode (news & web articles focus)
 * 
 * Location: Replace the search mode handler in ChatScreen.js sendMessage()
 */

// ============================================================
// 📍 LOCATION: In ChatScreen.js sendMessage() function
// REPLACE: This existing code block (around line 120-130)
// ============================================================

// OLD CODE (BEFORE):
/*
if (mode === 'search') {
  response = await apiService.search(text, userId, 'search');
  console.log('[SEARCH] API Response:', response);

  const aiMessage = {
    id: Date.now().toString() + Math.random().toString(),
    text: response.answer || 'Unable to process search query.',
    sender: 'ai',
    timestamp: new Date(),
    type: 'search',
    sources: response.sources || [],
    confidence: response.confidence || 0,
    showReasoning: false,
  };

  setMessages((prev) => [...prev, aiMessage]);
  speakResponse(response.answer);
}
*/

// NEW CODE (AFTER):
// ============================================================

if (mode === 'search') {
  // ✨ ENHANCED MULTI-MODE SEARCH
  // Call backend with search mode (default)
  response = await apiService.search(text, userId, 'search');
  console.log('[SEARCH] API Response:', response);

  // Format response with enhanced data
  const aiMessage = {
    id: Date.now().toString() + Math.random().toString(),
    text: response.answer || 'Unable to process search query.',
    sender: 'ai',
    timestamp: new Date(),
    type: 'search',
    sources: response.sources || [],
    categories: response.metadata?.categories || [],
    confidence: response.metadata?.confidence || 0,
    totalSources: response.metadata?.totalSources || 0,
    queriedAPIs: response.metadata?.queriedAPIs || [],
    showSources: true, // Auto-show sources for search mode
    showReasoning: false,
  };

  setMessages((prev) => [...prev, aiMessage]);
  speakResponse(response.answer);
}

// ============================================================
// 📍 LOCATION: In ChatScreen.js - UPDATE handleModeToggle()
// REPLACE the old mode toggle logic (around line 280)
// ============================================================

// NEW handleModeToggle with ENHANCED SEARCH MODES:
const handleModeToggle = () => {
  let newMode;
  if (mode === 'chat') {
    newMode = 'search';
  } else if (mode === 'search') {
    // Show search mode submenu instead of just cycling
    showSearchModeMenu();
    return;
  } else if (mode === 'reason') {
    newMode = 'doc';
  } else {
    newMode = 'chat';
  }
  setMode(newMode);
  console.log(`[Mode] Changed to: ${newMode}`);
};

// NEW: Add search mode selector menu
const showSearchModeMenu = () => {
  Alert.alert(
    'Search Modes',
    'Choose a search approach:',
    [
      {
        text: '🔍 Standard Search',
        onPress: () => {
          setSearchMode('search');
          Alert.alert('Search Mode', 'Using combined multi-source search');
        },
      },
      {
        text: '📊 Consensus',
        onPress: () => {
          setSearchMode('consensus');
          Alert.alert('Consensus Mode', 'Analyzing agreement across sources');
        },
      },
      {
        text: '📖 Scholar',
        onPress: () => {
          setSearchMode('scholar');
          Alert.alert('Scholar Mode', 'Focusing on academic papers');
        },
      },
      {
        text: '🌐 Web',
        onPress: () => {
          setSearchMode('web');
          Alert.alert('Web Mode', 'Focusing on web articles & news');
        },
      },
      {
        text: '🧠 Reasoning',
        onPress: () => setMode('reason'),
      },
      {
        text: '📄 Documents',
        onPress: () => setMode('doc'),
      },
      {
        text: 'Cancel',
        onPress: () => console.log('Menu cancelled'),
        style: 'cancel',
      },
    ]
  );
};

// ============================================================
// 🆕 NEW STATE VARIABLE for Search Modes
// Add this to ChatScreen's useState hooks (around line 25):
// ============================================================

// NEW: Add after other useState hooks:
const [searchMode, setSearchMode] = useState('search'); // 'search', 'consensus', 'scholar', 'web'

// ============================================================
// 📍 UPDATE: Backend call to use searchMode
// In sendMessage() function, update the search API call:
// ============================================================

if (mode === 'search') {
  // Use the selected search mode
  response = await apiService.search(text, userId, searchMode);
  
  // ... rest of message creation code
}

// ============================================================
// 🎨 NEW: Enhanced SearchMessage Component
// Replace the existing SearchMessage component (around line 600)
// ============================================================

const SearchMessage = ({ text, sources, categories, confidence, totalSources, queriedAPIs }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Group sources by category
  const groupedSources = sources.reduce((acc, source) => {
    const cat = source.category || '📚 General';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(source);
    return acc;
  }, {});

  return (
    <View style={styles.messageRow}>
      <View style={styles.searchMessage}>
        {/* Main Answer */}
        <Text style={styles.searchAnswer}>{text}</Text>

        {/* Research Metadata */}
        <View style={styles.metadataBar}>
          <Text style={styles.metadataText}>
            {totalSources} sources • {categories?.length || 0} categories
          </Text>
        </View>

        {/* Confidence Score */}
        {confidence > 0 && (
          <View style={styles.confidenceBar}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <View style={styles.confidenceIndicator}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${Math.round(confidence * 100)}%`,
                    backgroundColor:
                      confidence > 0.7 ? '#10b981' : confidence > 0.4 ? '#f59e0b' : '#ef4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.confidenceValue}>{Math.round(confidence * 100)}%</Text>
          </View>
        )}

        {/* Categorized Sources */}
        <View style={styles.sourcesContainer}>
          <Text style={styles.sourcesTitle}>📊 Sources</Text>

          {Object.entries(groupedSources).map(([category, categorySource]) => (
            <View key={category} style={styles.categoryGroup}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() =>
                  setExpandedCategory(expandedCategory === category ? null : category)
                }
              >
                <Text style={styles.categoryTitle}>
                  {category} ({categorySource.length})
                </Text>
                <Text style={styles.categoryIcon}>
                  {expandedCategory === category ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedCategory === category && (
                <View style={styles.sourcesList}>
                  {categorySource.slice(0, 3).map((source, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.sourceItem}
                      onPress={() => {
                        if (source.url && source.url !== '#') {
                          Linking.openURL(source.url).catch((err) =>
                            console.error('URL Error:', err)
                          );
                        }
                      }}
                    >
                      <Text style={styles.sourceTitle} numberOfLines={2}>
                        {source.title}
                      </Text>

                      <View style={styles.sourceMeta}>
                        {source.year && (
                          <Text style={styles.metaTag}>📅 {source.year}</Text>
                        )}
                        {source.citations > 0 && (
                          <Text style={styles.metaTag}>📈 {source.citations}</Text>
                        )}
                      </View>

                      {source.url && source.url !== '#' && (
                        <Text style={styles.sourceUrl} numberOfLines={1}>
                          {source.url}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Queried APIs Info */}
        {queriedAPIs && queriedAPIs.length > 0 && (
          <View style={styles.apisInfo}>
            <Text style={styles.apisLabel}>Searched via: {queriedAPIs.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================================
// 🎨 NEW STYLES for Enhanced Search Display
// Add these to the StyleSheet at the bottom of ChatScreen.js
// ============================================================

searchMessage: {
  flex: 1,
  backgroundColor: '#1a3a52', // Deep blue for search mode
  borderRadius: 12,
  padding: 12,
  marginRight: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#3b82f6',
},

searchAnswer: {
  color: '#E8EAED',
  fontSize: 14,
  lineHeight: 20,
  marginBottom: 10,
},

metadataBar: {
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  marginBottom: 8,
},

metadataText: {
  color: '#93c5fd',
  fontSize: 11,
  fontWeight: '500',
},

confidenceBar: {
  marginBottom: 10,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#2a3d5a',
},

confidenceLabel: {
  color: '#A3B1D3',
  fontSize: 11,
  marginBottom: 4,
},

confidenceIndicator: {
  height: 6,
  backgroundColor: '#2a3d5a',
  borderRadius: 3,
  overflow: 'hidden',
  marginBottom: 4,
},

confidenceFill: {
  height: '100%',
},

confidenceValue: {
  color: '#93c5fd',
  fontSize: 11,
  fontWeight: '600',
},

sourcesContainer: {
  marginTop: 8,
},

sourcesTitle: {
  color: '#A3B1D3',
  fontSize: 12,
  fontWeight: '600',
  marginBottom: 8,
},

categoryGroup: {
  marginBottom: 6,
  borderRadius: 6,
  overflow: 'hidden',
},

categoryHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 10,
  paddingVertical: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
},

categoryTitle: {
  fontSize: 12,
  fontWeight: '600',
  color: '#93c5fd',
  flex: 1,
},

categoryIcon: {
  color: '#6b7280',
  fontSize: 11,
},

sourcesList: {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
},

sourceItem: {
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.05)',
},

sourceTitle: {
  fontSize: 12,
  fontWeight: '500',
  color: '#60a5fa',
  marginBottom: 4,
  lineHeight: 16,
},

sourceMeta: {
  flexDirection: 'row',
  marginBottom: 4,
},

metaTag: {
  fontSize: 10,
  color: '#9ca3af',
  marginRight: 6,
},

sourceUrl: {
  fontSize: 10,
  color: '#6b7280',
},

apisInfo: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#2a3d5a',
},

apisLabel: {
  fontSize: 11,
  color: '#9CA3AF',
  fontStyle: 'italic',
},

// ============================================================
// 🔗 Add Linking import if not already present:
// ============================================================

// At top of ChatScreen.js file:
import { Linking } from 'react-native';

// ============================================================
// COMPLETE! Your ChatScreen now supports:
// ✅ Enhanced search modes (standard, consensus, scholar, web)
// ✅ Beautiful source display with categories
// ✅ Confidence scoring
// ✅ Source expandable groups
// ✅ API attribution
// ============================================================
