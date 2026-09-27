import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AntibacterialAPI } from '../services/AntibacterialAPI';

export default function AntibacterialAnalysisScreen() {
  const [smiles, setSmiles] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyze = async () => {
    if (!smiles.trim()) {
      setError('Please enter a SMILES string');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AntibacterialAPI.analyzeCompound(smiles);
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!analysisResult?.summary) return null;

    const summary = analysisResult.summary;

    return (
      <View style={styles.section}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <Text style={styles.scoreValue}>{Math.round(summary.overallScore * 100)}%</Text>
          <Text style={styles.developmentPotential}>{summary.developmentPotential}</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Target</Text>
            <Text style={styles.metricValue}>{summary.primaryTarget?.split('Targeting')[0] || 'Unknown'}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Confidence</Text>
            <Text style={styles.metricValue}>{summary.targetConfidence}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Antibiotic-ness</Text>
            <Text style={styles.metricValue}>{summary.antibioticLikeness}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Resistance</Text>
            <Text style={[styles.metricValue, { color: summary.resistanceRisk === 'High' ? '#ef4444' : '#22c55e' }]}>
              {summary.resistanceRisk}
            </Text>
          </View>
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Key Recommendations</Text>
          {summary.keyRecommendations?.map((rec, i) => (
            <View key={i} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={16} color="#38bdf8" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDescriptors = () => {
    if (!analysisResult?.analysis?.descriptors?.physicochemical) return null;

    const desc = analysisResult.analysis.descriptors.physicochemical;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Physicochemical Properties</Text>

        <View style={styles.propertyGrid}>
          {[
            { label: 'MW', value: `${desc.mw} Da` },
            { label: 'LogP', value: `${desc.logp}` },
            { label: 'TPSA', value: `${desc.tpsa} Ų` },
            { label: 'HBD', value: desc.hbd },
            { label: 'HBA', value: desc.hba },
            { label: 'Rot. Bonds', value: desc.rotBonds },
            { label: 'Rings', value: desc.rings },
            { label: 'Aromatic', value: desc.aromaticRings },
          ].map((item, i) => (
            <View key={i} style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>{item.label}</Text>
              <Text style={styles.propertyValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ro5Card}>
          <Text style={styles.cardTitle}>Rule of Five</Text>
          <Text style={analysisResult.analysis.descriptors.ro5Compliance.compliant ? styles.compliant : styles.violation}>
            {analysisResult.analysis.descriptors.ro5Compliance.compliant ? '✓ Compliant' : '✗ Violations: ' + analysisResult.analysis.descriptors.ro5Compliance.violationCount}
          </Text>
        </View>
      </View>
    );
  };

  const renderTargetAnalysis = () => {
    if (!analysisResult?.analysis?.targetClassification) return null;

    const target = analysisResult.analysis.targetClassification;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target Classification</Text>

        <View style={styles.predictionCard}>
          <Text style={styles.predictionTitle}>Top Prediction</Text>
          <Text style={styles.predictionClass}>{target.topPrediction?.targetClass?.replace('Targeting', '')}</Text>
          <Text style={styles.predictionConfidence}>Confidence: {Math.round(target.confidence * 100)}%</Text>
        </View>

        <Text style={styles.explanationTitle}>Explanation</Text>
        <Text style={styles.explanationText}>{target.explanation}</Text>
      </View>
    );
  };

  const renderResistanceAnalysis = () => {
    if (!analysisResult?.analysis?.resistanceAnalysis) return null;

    const resistance = analysisResult.analysis.resistanceAnalysis;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resistance Analysis</Text>

        <View style={styles.riskCard}>
          <Text style={styles.riskLabel}>Overall Risk</Text>
          <Text style={[
            styles.riskLevel,
            { color: resistance.overallResistanceRisk.riskLevel === 'High' ? '#ef4444' : resistance.overallResistanceRisk.riskLevel === 'Moderate' ? '#f59e0b' : '#22c55e' }
          ]}>
            {resistance.overallResistanceRisk.riskLevel}
          </Text>
        </View>

        <View style={styles.factorsCard}>
          <Text style={styles.cardTitle}>Risk Factors</Text>
          <Text style={styles.factorItem}>Scaffold Novelty: {Math.round(resistance.scaffoldNovelty.score * 100)}%</Text>
          <Text style={styles.factorItem}>Structural Novelty: {Math.round(resistance.structuralNovelty.score * 100)}%</Text>
          <Text style={styles.factorItem}>Cross-Resistance Risk: {Math.round(resistance.crossResistanceRisk.score * 100)}%</Text>
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Recommendations</Text>
          {resistance.recommendations?.map((rec, i) => (
            <Text key={i} style={styles.recommendationText}>• {rec}</Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Antibacterial AI</Text>
        <Text style={styles.headerSubtitle}>Medicinal Chemistry Intelligence</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.smilesInput}
          placeholder="Enter SMILES string..."
          placeholderTextColor="#64748b"
          value={smiles}
          onChangeText={setSmiles}
          multiline
        />

        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <>
              <Ionicons name="flask" size={18} color="#020617" />
              <Text style={styles.analyzeBtnText}>Analyze</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {analysisResult && (
        <>
          <View style={styles.tabBar}>
            {['overview', 'descriptors', 'target', 'resistance'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'descriptors' && renderDescriptors()}
            {activeTab === 'target' && renderTargetAnalysis()}
            {activeTab === 'resistance' && renderResistanceAnalysis()}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  inputSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  smilesInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 12,
    padding: 12,
    color: '#e2e8f0',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  analyzeBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnText: {
    color: '#020617',
    fontWeight: '700',
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#38bdf8',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#38bdf8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  scoreCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#38bdf8',
    marginTop: 4,
  },
  developmentPotential: {
    color: '#22c55e',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
  },
  recommendationsCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  recommendationText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  propertyItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    padding: 10,
  },
  propertyLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
  },
  propertyValue: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  ro5Card: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  compliant: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  violation: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  predictionCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  predictionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 6,
  },
  predictionClass: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  predictionConfidence: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  explanationTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  explanationText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  riskCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  riskLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 6,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: '800',
  },
  factorsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  factorItem: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 6,
  },
});
