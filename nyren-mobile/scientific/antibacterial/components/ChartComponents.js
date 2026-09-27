import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * ChemicalSpaceChart - Simplified stub for web compatibility
 */
export function ChemicalSpaceChart({ mw, tpsa, showRegions = true }) {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Chemical Space Analysis</Text>
      <Text style={styles.chartText}>
        MW: {mw?.toFixed(1) || 'N/A'} Da, TPSA: {tpsa?.toFixed(1) || 'N/A'} Å²
      </Text>
      <Text style={styles.chartNote}>Interactive chart visualization available in native app</Text>
    </View>
  );
}

/**
 * DescriptorRangeVisualization - Simplified stub
 */
export function DescriptorRangeVisualization({ descriptors }) {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Molecular Descriptors</Text>
      <View style={styles.descriptorGrid}>
        {Object.entries(descriptors || {}).map(([key, value]) => (
          <Text key={key} style={styles.descriptorText}>
            {key}: {value || 'N/A'}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * MultiObjectiveChart - Simplified stub
 */
export function MultiObjectiveChart({ objectives }) {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Multi-Objective Optimization</Text>
      <Text style={styles.chartNote}>Chart visualization available in native app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8,
  },
  chartText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  chartNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  descriptorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  descriptorText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginRight: 12,
    marginBottom: 4,
  },
});
