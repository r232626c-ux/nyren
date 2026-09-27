import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

import DatasetUploader from "../components/upload/DatasetUploader";
import JobTracker from "../components/jobs/JobTracker";
import ResultsViewer from "../components/results/ResultsViewer";
import AIInterpretationPanel from "../components/ai/AIInterpretationPanel";
import apiService, { getUserId } from "../../services/apiService";
import { AntibacterialAPI } from "../../scientific/antibacterial/services/AntibacterialAPI";

import NeonHeader from '../components/NeonHeader';

import {
  ChemicalSpaceChart,
  DescriptorRangeVisualization,
  MultiObjectiveChart,
} from "../../scientific/antibacterial/components/ChartComponents";

/* =========================
   TYPES (UNCHANGED)
========================= */
type DatasetInfo = { datasetId: string; datasetName: string; raw_payload?: any };
type Job = { id: string; status?: string; name?: string };
type AnalysisOption = { key: string; label: string };
type CollapsedState = { phys: boolean; target: boolean; resist: boolean };

type MetricCardProps = { label: string; value: unknown };
type SectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
};

/* =========================
   CONSTANTS
========================= */
const analysisOptions: AnalysisOption[] = [
  { key: "qc_pipeline", label: "QC Report" },
  { key: "differential_expression_pipeline", label: "Differential Expression" },
  { key: "biomarker_pipeline", label: "Biomarker Discovery" },
  { key: "descriptive_stats_pipeline", label: "Descriptive Statistics" },
  { key: "correlation_pipeline", label: "Correlation Analysis" },
];

const exampleMolecules = [
  { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
  { name: "Ibuprofen", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O" },
];

/* =========================
   HELPERS (CLEANED)
========================= */
const safeError = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

const format = (v: any) => {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

/* =========================
   SMALL UI COMPONENTS
========================= */
const MetricCard = ({ label, value }: MetricCardProps) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{format(value)}</Text>
  </View>
);

const Section = ({ title, open, onToggle, children }: SectionProps) => (
  <View style={styles.sectionBox}>
    <TouchableOpacity onPress={onToggle} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text>{open ? "−" : "+"}</Text>
    </TouchableOpacity>
    {open && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

/* =========================
   MAIN COMPONENT
========================= */
export default function ScientificDashboard({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [smiles, setSmiles] = useState("");
  const [ai, setAi] = useState({ status: "idle", processing: false });

  const [collapsed, setCollapsed] = useState<CollapsedState>({
    phys: true,
    target: true,
    resist: true,
  });

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 2800, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, [pulse]);

  const analysis = result?.analysis || result;
  const phys = analysis?.descriptors?.physicochemical || {};
  const targetPrediction = analysis?.targetClassification?.topPrediction || analysis?.targetPrediction || {};
  const antibioticLikeness = analysis?.antibioticLikeness || {};
  const resistanceAnalysis = analysis?.resistanceAnalysis || {};
  const leadOptimization = analysis?.leadOptimization || {};
  const summary = result?.summary || {};

  const sampleMolecules = exampleMolecules;

  const pickExample = (exampleSmiles: string) => {
    setSmiles(exampleSmiles);
    setResult(null);
    setAi({ status: "idle", processing: false });
  };

  /* =========================
     INIT USER
  ========================= */
  useEffect(() => {
    getUserId()
      .then(setUserId)
      .catch((e) => console.warn("User error", safeError(e)));
  }, []);

  /* =========================
     JOBS
  ========================= */
  const normalizeJobs = (response: any): Job[] => {
    if (Array.isArray(response)) return response;
    if (response?.jobs && Array.isArray(response.jobs)) return response.jobs;
    if (response?.data?.jobs && Array.isArray(response.data.jobs)) return response.data.jobs;
    return [];
  };

  const refreshJobs = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiService.getJobs(userId);
      setJobs(normalizeJobs(res));
    } catch (e) {
      console.error("Jobs error", safeError(e));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) refreshJobs();
  }, [userId]);

  /* =========================
     RUN PIPELINE ANALYSIS
  ========================= */
  const [runningTask, setRunningTask] = useState<string | null>(null);

  const runAnalysis = async (taskType: string) => {
    if (!dataset) return Alert.alert("Upload a dataset first");

    setRunningTask(taskType);
    try {
      const payload = dataset.raw_payload || dataset;
      const res: any = await apiService.submitAnalysisJob(payload, taskType, {});
      if (res?.status === "failed" || res?.error) {
        Alert.alert("Could not start analysis", res?.error || "Unknown error");
      } else {
        Alert.alert("Analysis started", "Check the job list below for progress.");
        await refreshJobs();
      }
    } catch (e) {
      Alert.alert("Could not start analysis", safeError(e));
    } finally {
      setRunningTask(null);
    }
  };

  /* =========================
     ANALYZE MOLECULE
  ========================= */
  const analyze = async () => {
    if (!smiles.trim()) return Alert.alert("Enter SMILES");

    setAi({ status: "running", processing: true });

    try {
      const res = await AntibacterialAPI.analyzeCompound(smiles);
      setResult(res?.data || res);
      setAi({ status: "done", processing: false });
    } catch (e) {
      setAi({ status: "error", processing: false });
      console.error(e);
    }
  };

  /* =========================
     RENDER
  ========================= */
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <LinearGradient
        colors={["#080E1D", "#070A16"]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <Animated.View pointerEvents="none" style={[styles.heroGlow, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
      <Animated.View pointerEvents="none" style={[styles.heroGlowSecondary, { opacity: pulseOpacity }]} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation?.getParent?.()?.openDrawer?.()} style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#38bdf8" />
        </TouchableOpacity>
      </View>
      <NeonHeader title="Scientific Dashboard" subtitle="Antibacterial exploration" />

      {/* UPLOAD */}
      <DatasetUploader userId={userId} onUploadComplete={setDataset} />

      {/* RUN ANALYSIS: bioinformatics/biochemistry/physics-style pipelines over the uploaded matrix */}
      <View style={styles.aiBox}>
        <Text style={styles.aiTitle}>Run Analysis</Text>
        {!dataset ? (
          <Text style={styles.sectionText}>Upload a dataset above to enable these pipelines.</Text>
        ) : null}
        <View style={styles.exampleList}>
          {analysisOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.exampleButton, !dataset && { opacity: 0.4 }]}
              disabled={!dataset || runningTask === opt.key}
              onPress={() => runAnalysis(opt.key)}
            >
              <Text style={styles.exampleText}>
                {runningTask === opt.key ? `Starting ${opt.label}...` : opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* JOBS */}
      <JobTracker
        userId={userId}
        jobs={jobs}
        selectedJobId={selectedJob?.id}
        onJobSelected={setSelectedJob}
        onRefresh={refreshJobs}
      />

      {/* RESULTS */}
      <ResultsViewer result={result?.result || result} />

      {/* AI */}
      <AIInterpretationPanel interpretation={result?.interpretation} />

      {/* =======================
          ANTIBACTERIAL MODULE
      ======================= */}
      <View style={styles.aiBox}>
        <Text style={styles.aiTitle}>Antibacterial Intelligence</Text>

        <View style={styles.exampleList}>
          {sampleMolecules.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.exampleButton}
              onPress={() => pickExample(item.smiles)}
            >
              <Text style={styles.exampleText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Text style={styles.statusText}>AI Status: {ai.status}</Text>
        </Animated.View>

        <TextInput
          value={smiles}
          onChangeText={setSmiles}
          placeholder="Enter SMILES"
          placeholderTextColor="#718096"
          style={styles.input}
        />

        <TouchableOpacity onPress={analyze} style={styles.button}>
          <Text style={{ color: "#fff" }}>
            {ai.processing ? "Analyzing..." : "Analyze Compound"}
          </Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Analysis Summary</Text>
          <Text style={styles.summaryLine}>SMILES: {result?.smiles || smiles || 'N/A'}</Text>
          <Text style={styles.summaryLine}>Overall Score: {summary?.overallScore ?? 'N/A'}</Text>
          <Text style={styles.summaryLine}>Development: {summary?.developmentPotential ?? 'N/A'}</Text>
          <Text style={styles.summaryLine}>Primary Target: {summary?.primaryTarget ?? 'N/A'}</Text>
          <Text style={styles.summaryLine}>Resistance Risk: {summary?.resistanceRisk ?? 'N/A'}</Text>
        </View>

        <Section
          title="Physicochemical Profiles"
          open={!collapsed.phys}
          onToggle={() =>
            setCollapsed((p: CollapsedState) => ({ ...p, phys: !p.phys }))
          }
        >
          <MetricCard label="MW" value={phys?.mw || 'N/A'} />
          <MetricCard label="LogP" value={phys?.logp || 'N/A'} />
          <MetricCard label="TPSA" value={phys?.tpsa || 'N/A'} />
          <MetricCard label="HBD" value={phys?.hbd ?? 'N/A'} />
          <MetricCard label="HBA" value={phys?.hba ?? 'N/A'} />
          <MetricCard label="Rotatable Bonds" value={phys?.rotBonds ?? 'N/A'} />
          <MetricCard label="Rings" value={phys?.rings ?? 'N/A'} />
        </Section>

        <Section
          title="Target Prediction"
          open={!collapsed.target}
          onToggle={() =>
            setCollapsed((p: CollapsedState) => ({ ...p, target: !p.target }))
          }
        >
          <Text style={styles.sectionText}>Class: {targetPrediction?.targetClass || targetPrediction?.predictedClass || 'N/A'}</Text>
          <Text style={styles.sectionText}>Confidence: {targetPrediction?.confidence != null ? `${Math.round(targetPrediction.confidence * 100)}%` : 'N/A'}</Text>
          <Text style={styles.sectionText}>{targetPrediction?.description || targetPrediction?.notes || ''}</Text>
        </Section>

        <Section
          title="Antibiotic Likeness"
          open={!collapsed.resist}
          onToggle={() =>
            setCollapsed((p: CollapsedState) => ({ ...p, resist: !p.resist }))
          }
        >
          <Text style={styles.sectionText}>Score: {antibioticLikeness?.score ?? 'N/A'}</Text>
          <Text style={styles.sectionText}>Confidence: {antibioticLikeness?.confidence != null ? `${Math.round(antibioticLikeness.confidence * 100)}%` : 'N/A'}</Text>
          <Text style={styles.sectionText}>Passed: {antibioticLikeness?.passed != null ? String(antibioticLikeness.passed) : 'N/A'}</Text>
          {antibioticLikeness?.details && (
            <View style={styles.detailList}>
              {Object.entries(antibioticLikeness.details).map(([key, item]) => {
                const detail = item as any;
                return (
                  <Text key={key} style={styles.detailText}>
                    {detail?.label || key}: {detail?.value || 'N/A'}
                  </Text>
                );
              })}
            </View>
          )}
        </Section>

        <ChemicalSpaceChart mw={phys?.mw || 0} tpsa={phys?.tpsa || 0} />

        {leadOptimization?.recommendedOptimizations?.length > 0 && (
          <View style={styles.optimizationCard}>
            <Text style={styles.summaryTitle}>Lead Optimization</Text>
            {leadOptimization.recommendedOptimizations.slice(0, 3).map((item, index) => (
              <Text key={index} style={styles.summaryLine}>• {item.objective || item}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* =========================
   STYLES (SIMPLIFIED)
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#091222", padding: 16 },
  scrollContainer: { paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 10 },

  sectionBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },

  sectionHeader: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  sectionTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },

  sectionBody: { padding: 12 },

  metricCard: {
    backgroundColor: "#1A2B44",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
  },

  metricLabel: { color: "#9DB2CE", fontSize: 14 },
  metricValue: { color: "#fff", fontWeight: "700", fontSize: 16 },

  aiBox: {
    marginTop: 20,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
  },

  aiTitle: { color: "#7BE6FF", fontWeight: "800", marginBottom: 12, fontSize: 20 },

  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#00B2FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  exampleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  exampleButton: {
    backgroundColor: "#162A44",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  exampleText: {
    color: "#A5D8FF",
    fontSize: 14,
  },
  statusText: {
    color: "#D6E9FF",
    marginBottom: 10,
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  summaryTitle: {
    color: "#8DE0FF",
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 17,
  },
  summaryLine: {
    color: "#D8E6FF",
    fontSize: 14,
    marginBottom: 4,
  },
  sectionText: {
    color: "#E5F0FF",
    fontSize: 15,
    marginBottom: 6,
  },
  detailList: {
    marginTop: 8,
  },
  detailText: {
    color: "#C1D4F5",
    fontSize: 14,
    marginBottom: 4,
  },
  optimizationCard: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  menuBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroGlow: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(56,189,248,0.06)',
    top: -120,
    left: -40,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(139,92,246,0.04)',
    top: -40,
    right: -20,
  },

});