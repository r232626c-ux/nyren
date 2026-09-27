/**
 * 🔍 Enhanced Search Display Component
 * Shows research results with:
 * - AI summaries
 * - Categorized sources
 * - Citation counts
 * - Confidence scores
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';

export const SourcesDisplay = ({ sources, answer, categories, confidence }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const groupedSources = sources.reduce((acc, source) => {
    const category = source.category || '📚 General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(source);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Main Answer */}
      {answer && (
        <View style={styles.answerSection}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}

      {/* Confidence Score */}
      {confidence !== undefined && (
        <View style={styles.confidenceBar}>
          <Text style={styles.confidenceLabel}>Research Confidence:</Text>
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
      <View style={styles.sourcesSection}>
        <Text style={styles.sourcesHeader}>📊 Sources ({sources.length})</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
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
                <Text style={styles.expandIcon}>
                  {expandedCategory === category ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedCategory === category && (
                <View style={styles.categoryItems}>
                  {categorySource.map((source, idx) => (
                    <SourceItem key={idx} source={source} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const SourceItem = ({ source }) => {
  return (
    <TouchableOpacity
      style={styles.sourceItem}
      onPress={() => {
        if (source.url && source.url !== '#') {
          Linking.openURL(source.url).catch((err) =>
            console.error('Could not open URL:', err)
          );
        }
      }}
    >
      <View style={styles.sourceContent}>
        <Text style={styles.sourceTitle} numberOfLines={2}>
          {source.title}
        </Text>

        {source.snippet && (
          <Text style={styles.sourceSnippet} numberOfLines={2}>
            {source.snippet}
          </Text>
        )}

        <View style={styles.sourceMeta}>
          {source.year && <Text style={styles.metaTag}>📅 {source.year}</Text>}
          {source.citations !== undefined && source.citations > 0 && (
            <Text style={styles.metaTag}>📈 {source.citations} citations</Text>
          )}
          {source.authors && <Text style={styles.metaTag}>✍️ {source.authors}</Text>}
        </View>

        {source.url && source.url !== '#' && (
          <Text style={styles.sourceUrl} numberOfLines={1}>
            🔗 {source.url}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },

  answerSection: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1f2937',
  },

  confidenceBar: {
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },

  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },

  confidenceIndicator: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },

  confidenceFill: {
    height: '100%',
  },

  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  sourcesSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },

  sourcesHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  categoryGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
  },

  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    flex: 1,
  },

  expandIcon: {
    fontSize: 12,
    color: '#9ca3af',
  },

  categoryItems: {
    backgroundColor: '#fff',
  },

  sourceItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  sourceContent: {},

  sourceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },

  sourceSnippet: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 16,
  },

  sourceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },

  metaTag: {
    fontSize: 11,
    color: '#7c3aed',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },

  sourceUrl: {
    fontSize: 11,
    color: '#666',
  },
});

export default SourcesDisplay;
