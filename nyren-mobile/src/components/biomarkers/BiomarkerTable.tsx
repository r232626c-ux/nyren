import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function BiomarkerTable({ biomarkers = [] }) {
  if (!Array.isArray(biomarkers) || biomarkers.length === 0) {
    return <Text style={styles.emptyText}>No biomarker rankings are available for this job.</Text>;
  }

  const head = ['Gene', 'Score', 'LogFC', 'p-value', 'Consistency'];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          {head.map((label) => (
            <Text key={label} style={[styles.cell, styles.headerCell]}>{label}</Text>
          ))}
        </View>
        {biomarkers.slice(0, 15).map((item, idx) => {
          const significant = Number(item.pValue ?? item.p_value) < 0.05;
          return (
            <View key={`${item.gene}-${idx}`} style={[styles.row, idx % 2 === 0 ? styles.evenRow : null]}>
              <Text style={[styles.cell, significant && styles.highlightText]}>{item.gene}</Text>
              <Text style={styles.cell}>{item.score?.toFixed?.(2) ?? item.score ?? '—'}</Text>
              <Text style={styles.cell}>{item.logFoldChange ?? item.log_fold_change ?? '—'}</Text>
              <Text style={[styles.cell, significant && styles.highlightText]}>{item.pValue ?? item.p_value ?? '—'}</Text>
              <Text style={styles.cell}>{item.consistency ?? '—'}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    minWidth: 520,
    borderBottomWidth: 1,
    borderColor: '#1F2E4B',
  },
  headerRow: {
    backgroundColor: '#13213D',
  },
  cell: {
    minWidth: 100,
    color: '#DDE8FF',
    fontSize: 12,
    marginRight: 18,
  },
  headerCell: {
    color: '#94B6FF',
    fontWeight: '700',
  },
  evenRow: {
    backgroundColor: '#0A162C',
  },
  highlightText: {
    color: '#8DF2B3',
    fontWeight: '700',
  },
  emptyText: {
    color: '#8B9AC9',
    fontSize: 13,
  },
});