import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BiomarkerTable from '../biomarkers/BiomarkerTable';

export default function ResultsViewer({ result }) {
  if (!result) {
    return <Text style={styles.emptyText}>Select a completed analysis job to view structured results.</Text>;
  }

  const qcReport = result.qc_report || result.qcReport || null;
  const deReport = result.differential_expression || result.differentialExpression || null;
  const biomarkers = result.biomarker_rankings || result.biomarkerRankings || [];

  return (
    <View>
      {qcReport ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>QC Report</Text>
          {qcReport.summary && <Text style={styles.bodyText}>{qcReport.summary}</Text>}
          {qcReport.scores && (
            <View style={styles.metricRow}>
              {Object.entries(qcReport.scores).map(([key, value]) => (
                <View key={key} style={styles.metricItem}>
                  <Text style={styles.metricKey}>{key}</Text>
                  <Text style={styles.metricValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}
          {qcReport.issues && qcReport.issues.length > 0 && (
            <View style={styles.issueList}>
              <Text style={styles.subtitle}>Issues</Text>
              {qcReport.issues.map((issue, index) => (
                <Text key={index} style={styles.issueItem}>• {issue}</Text>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {deReport && deReport.results && deReport.results.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Differential Expression</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
            <View>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.headerCell]}>Gene</Text>
                <Text style={[styles.tableCell, styles.headerCell]}>LogFC</Text>
                <Text style={[styles.tableCell, styles.headerCell]}>P-value</Text>
                <Text style={[styles.tableCell, styles.headerCell]}>Adj P</Text>
              </View>
              {deReport.results.slice(0, 12).map((row, idx) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 0 ? styles.tableEven : null]}>
                  <Text style={styles.tableCell}>{row.gene || row.name || '—'}</Text>
                  <Text style={styles.tableCell}>{row.log_fold_change ?? row.logFoldChange ?? '—'}</Text>
                  <Text style={styles.tableCell}>{row.p_value ?? row.pValue ?? '—'}</Text>
                  <Text style={styles.tableCell}>{row.adj_p_value ?? row.adjPValue ?? '—'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.smallText}>Showing top 12 rows from the backend result.</Text>
        </View>
      ) : null}

      {biomarkers.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Biomarker Rankings</Text>
          <BiomarkerTable biomarkers={biomarkers} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1B32',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2F52',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A6C5FF',
    marginBottom: 12,
  },
  bodyText: {
    color: '#DFE8FF',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    minWidth: 100,
    backgroundColor: '#122345',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  metricKey: {
    color: '#A8C0FF',
    fontSize: 11,
    marginBottom: 6,
  },
  metricValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  issueList: {
    marginTop: 10,
  },
  subtitle: {
    color: '#B0C7FF',
    fontSize: 13,
    marginBottom: 8,
  },
  issueItem: {
    color: '#CEDCFF',
    fontSize: 12,
    marginBottom: 4,
  },
  tableScroll: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderColor: '#29436B',
  },
  tableCell: {
    color: '#E9F1FF',
    fontSize: 12,
    minWidth: 120,
    marginRight: 14,
  },
  headerCell: {
    color: '#98B7FF',
    fontWeight: '700',
  },
  tableEven: {
    backgroundColor: '#0A162A',
  },
  smallText: {
    color: '#8EA7C7',
    fontSize: 11,
    marginTop: 10,
  },
  emptyText: {
    color: '#8B9AC9',
    fontSize: 13,
  },
});