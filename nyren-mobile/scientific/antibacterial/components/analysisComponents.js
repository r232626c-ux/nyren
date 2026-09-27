import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function DescriptorCard({ label, value, unit, min, max, ideal, status }) {
  const getStatusColor = () => {
    if (!status) return '#38bdf8';
    switch (status) {
      case 'good':
        return '#22c55e';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#38bdf8';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return 'checkmark-circle';
      case 'warning':
        return 'alert-circle';
      case 'critical':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name={statusIcon} size={16} color={statusColor} />
      </View>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: statusColor }]}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {(min !== undefined || max !== undefined || ideal !== undefined) && (
        <View style={styles.ranges}>
          {ideal !== undefined && (
            <Text style={styles.range}>Ideal: {ideal}</Text>
          )}
          {min !== undefined && max !== undefined && (
            <Text style={styles.range}>Range: {min} - {max}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export function TargetPredictionCard({ targetClass, confidence, explanation }) {
  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return '#22c55e';
    if (conf >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const confColor = getConfidenceColor(confidence);

  return (
    <View style={styles.predictionCard}>
      <View style={styles.predictionHeader}>
        <Text style={styles.predictionLabel}>Target Classification</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: `${confColor}20` }]}>
          <Text style={[styles.confidenceText, { color: confColor }]}>
            {Math.round(confidence * 100)}%
          </Text>
        </View>
      </View>

      <Text style={styles.predictionClass}>{targetClass}</Text>

      <View style={styles.explanationBox}>
        <Ionicons name="lightbulb" size={14} color="#38bdf8" />
        <Text style={styles.explanationText}>{explanation}</Text>
      </View>
    </View>
  );
}

export function OptimizationPanel({ objectives, recommendations }) {
  return (
    <View style={styles.optimizationCard}>
      <Text style={styles.panelTitle}>Optimization Recommendations</Text>

      {Array.isArray(objectives) && objectives.length > 0 && (
        <View style={styles.objectivesSection}>
          <Text style={styles.sectionLabel}>Multi-Objective Scores</Text>
          {objectives.map((obj, i) => (
            <View key={i} style={styles.objectiveItem}>
              <View style={styles.objectiveBar}>
                <View style={[
                  styles.objectiveProgress,
                  { width: `${(obj.score || 0) * 100}%` }
                ]} />
              </View>
              <View style={styles.objectiveInfo}>
                <Text style={styles.objectiveName}>{obj.objective}</Text>
                <Text style={styles.objectiveScore}>{Math.round((obj.score || 0) * 100)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {recommendations && recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionLabel}>Action Items</Text>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.recommendationItem}>
              <Ionicons name="arrow-forward" size={12} color="#38bdf8" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ResistanceRiskCard({ riskLevel, factors, mechanisms }) {
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'moderate':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#38bdf8';
    }
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'alert';
      case 'moderate':
        return 'warning';
      case 'low':
        return 'shield-checkmark';
      default:
        return 'information';
    }
  };

  const riskColor = getRiskColor(riskLevel);
  const riskIcon = getRiskIcon(riskLevel);

  return (
    <View style={styles.resistanceCard}>
      <View style={styles.riskHeader}>
        <Ionicons name={riskIcon} size={20} color={riskColor} />
        <View style={styles.riskInfo}>
          <Text style={styles.riskLabel}>Resistance Risk</Text>
          <Text style={[styles.riskValue, { color: riskColor }]}>{riskLevel}</Text>
        </View>
      </View>

      {factors && factors.length > 0 && (
        <View style={styles.factorsSection}>
          <Text style={styles.factorsLabel}>Contributing Factors</Text>
          {factors.map((factor, i) => (
            <View key={i} style={styles.factorItem}>
              <View style={styles.factorBar}>
                <View style={[
                  styles.factorProgress,
                  { width: `${(factor.score || 0) * 100}%` }
                ]} />
              </View>
              <Text style={styles.factorName}>{factor.name}</Text>
              <Text style={styles.factorScore}>{Math.round((factor.score || 0) * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {mechanisms && mechanisms.length > 0 && (
        <View style={styles.mechanismsSection}>
          <Text style={styles.mechanismsLabel}>Expected Resistance Mechanisms</Text>
          {mechanisms.map((mech, i) => (
            <Text key={i} style={styles.mechanismItem}>
              • {mech}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
  },
  unit: {
    color: '#64748b',
    fontSize: 10,
  },
  ranges: {
    marginTop: 8,
  },
  range: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  predictionCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  predictionClass: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  explanationBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderRadius: 8,
    padding: 10,
  },
  explanationText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  optimizationCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  panelTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  objectivesSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  objectiveItem: {
    marginBottom: 10,
  },
  objectiveBar: {
    height: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  objectiveProgress: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  objectiveInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  objectiveName: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  objectiveScore: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  recommendationsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.1)',
    paddingTop: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  recommendationText: {
    color: '#cbd5e1',
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  resistanceCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  riskHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  riskInfo: {
    flex: 1,
  },
  riskLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2,
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  factorsSection: {
    marginBottom: 14,
  },
  factorsLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  factorItem: {
    marginBottom: 10,
  },
  factorBar: {
    height: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  factorProgress: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  factorName: {
    color: '#cbd5e1',
    fontSize: 11,
    marginBottom: 2,
  },
  factorScore: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  mechanismsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.1)',
    paddingTop: 12,
  },
  mechanismsLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  mechanismItem: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
});
