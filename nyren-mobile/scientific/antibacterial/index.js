/**
 * Antibacterial Medicine AI - Main Export Index
 * Provides centralized access to all scientific modules
 */

// ========== SCREENS ==========
export { default as AntibacterialAnalysisScreen } from './screens/AntibacterialAnalysisScreen';

// ========== COMPONENTS ==========
export {
  DescriptorCard,
  TargetPredictionCard,
  OptimizationPanel,
  ResistanceRiskCard
} from './components/analysisComponents';

export {
  ChemicalSpaceChart,
  DescriptorRangeVisualization,
  MultiObjectiveChart
} from './components/ChartComponents';

// ========== SERVICES ==========
export { AntibacterialAPI } from './services/AntibacterialAPI';

// ========== HOOKS ==========
export {
  useAntibacterialAnalysis,
  useTargetPrediction,
  useAntibioticLikenessScore,
  useResistanceAnalysis,
  useOptimizationEngine,
  useServiceHealth,
  useCompoundComparison,
  useDescriptorValidation,
  useSmilesParser,
  useAnalysisCache
} from './hooks/useAntibacterialHooks';

// ========== UTILITIES ==========
export {
  DescriptorFormatters,
  Classifications,
  ScoringUtils,
  ReportGenerators,
  ErrorHandling,
  Validators,
  DataAggregation
} from './utils/analysisUtils';

// ========== TYPE DEFINITIONS ==========
/**
 * @typedef {Object} AnalysisResult
 * @property {Object} summary - High-level analysis summary
 * @property {number} summary.overallScore - Composite score (0-1)
 * @property {string} summary.developmentPotential - Qualitative potential
 * @property {string} summary.primaryTarget - Target class
 * @property {number} summary.targetConfidence - Confidence in target prediction
 * @property {number} summary.antibioticLikeness - Antibiotic-likeness score
 * @property {string} summary.resistanceRisk - Risk level (Low/Moderate/High)
 * @property {Array<string>} summary.keyRecommendations - Key recommendations
 * 
 * @property {Object} analysis - Detailed analysis data
 * @property {Object} analysis.descriptors - Physicochemical descriptors
 * @property {number} analysis.descriptors.physicochemical.mw - Molecular weight
 * @property {number} analysis.descriptors.physicochemical.logp - Lipophilicity
 * @property {number} analysis.descriptors.physicochemical.tpsa - Topological polar surface area
 * @property {number} analysis.descriptors.physicochemical.hbd - H-bond donors
 * @property {number} analysis.descriptors.physicochemical.hba - H-bond acceptors
 * @property {Object} analysis.descriptors.ro5Compliance - Rule of Five compliance
 * @property {Array<string>} analysis.antibiotiRegions - Antibiotic region classifications
 * 
 * @property {Object} analysis.targetClassification - Target prediction details
 * @property {string} analysis.targetClassification.topPrediction.targetClass - Top predicted target
 * @property {number} analysis.targetClassification.confidence - Prediction confidence
 * @property {string} analysis.targetClassification.explanation - Reasoning for prediction
 * 
 * @property {Object} analysis.antibioticLikeness - Antibiotic-likeness analysis
 * @property {number} analysis.antibioticLikeness.score - Overall likeness score
 * @property {Array<string>} analysis.antibioticLikeness.details - Detailed breakdown
 * @property {string} analysis.antibioticLikeness.rationale - Scoring rationale
 * 
 * @property {Object} analysis.ribosomeProfile - Ribosomal target analysis (if applicable)
 * @property {number} analysis.ribosomeProfile.rnaBindingPotential - RNA binding capability
 * @property {string} analysis.ribosomeProfile.estimatedTargetClass - Estimated ribosomal target
 * @property {string} analysis.ribosomeProfile.macrolideLikeness - Similarity to macrolides
 * @property {string} analysis.ribosomeProfile.tetracyclineLikeness - Similarity to tetracyclines
 * 
 * @property {Object} analysis.resistanceAnalysis - Resistance risk quantification
 * @property {number} analysis.resistanceAnalysis.scaffoldNovelty.score - Structural novelty score
 * @property {number} analysis.resistanceAnalysis.structuralNovelty.score - Overall novelty
 * @property {number} analysis.resistanceAnalysis.crossResistanceRisk.score - Cross-resistance likelihood
 * @property {string} analysis.resistanceAnalysis.overallResistanceRisk.riskLevel - Risk classification
 * @property {Array<string>} analysis.resistanceAnalysis.recommendations - Risk mitigation recommendations
 * 
 * @property {Object} analysis.optimization - Lead optimization recommendations
 * @property {Array<Object>} analysis.optimization.objectives - Multi-objective scores
 * @property {string} analysis.optimization.objectives[].objective - Objective name
 * @property {number} analysis.optimization.objectives[].score - Objective score (0-1)
 * @property {Array<string>} analysis.optimization.recommendations - Optimization recommendations
 */

/**
 * @typedef {Object} Compound
 * @property {string} id - Unique identifier
 * @property {string} smiles - SMILES string representation
 * @property {string} label - Display name/label
 * @property {AnalysisResult} result - Analysis result (cached)
 * @property {Date} timestamp - When analysis was performed
 */

/**
 * @typedef {Object} ValidationError
 * @property {boolean} valid - Whether validation passed
 * @property {string} error - Error message if invalid
 * @property {Array<string>} details - Detailed error information
 */

// ========== CONSTANTS ==========
export const ANTIBACTERIAL_CONFIG = {
  // Molecular weight ranges (Da)
  MW_RANGE: {
    min: 150,
    max: 800,
    optimal: { min: 200, max: 600 }
  },

  // LogP ranges
  LOGP_RANGE: {
    min: -3,
    max: 6,
    optimal: { min: -1, max: 4 }
  },

  // TPSA ranges (Ų)
  TPSA_RANGE: {
    min: 0,
    max: 200,
    optimal: { min: 20, max: 130 }
  },

  // H-bond range limits
  HBD_RANGE: { min: 0, max: 8, optimal: { min: 0, max: 5 } },
  HBA_RANGE: { min: 0, max: 15, optimal: { min: 2, max: 10 } },

  // Target classes
  TARGET_CLASSES: [
    'protein-targeting',
    'ribosome-targeting',
    'membrane-targeting',
    'dna-targeting'
  ],

  // Risk levels
  RISK_LEVELS: ['Low', 'Moderate', 'High'],

  // API endpoints
  API_ENDPOINTS: {
    analyze: '/api/scientific/antibacterial/analyze',
    predictTarget: '/api/scientific/antibacterial/predict-target',
    scoreLikeness: '/api/scientific/antibacterial/score-likeness',
    analyzeResistance: '/api/scientific/antibacterial/analyze-resistance',
    optimize: '/api/scientific/antibacterial/optimize',
    health: '/api/scientific/antibacterial/health'
  },

  // Timeout values (ms)
  TIMEOUTS: {
    analyze: 30000,
    predictTarget: 10000,
    scoreLikeness: 10000,
    analyzeResistance: 15000,
    optimize: 20000,
    health: 5000
  }
};

/**
 * Initialize antibacterial system
 * Checks backend health and readiness
 */
export async function initializeAntibacterialSystem() {
  try {
    const response = await AntibacterialAPI.healthCheck();
    console.log('[Antibacterial System] Initialized successfully');
    return { success: true, status: response.status };
  } catch (error) {
    console.warn('[Antibacterial System] Initialization warning:', error.message);
    return { success: false, status: 'unavailable' };
  }
}

/**
 * Example usage documentation
 */
export const USAGE_EXAMPLES = {
  basicAnalysis: `
    import { AntibacterialAnalysisScreen, useAntibacterialAnalysis } from '@scientific/antibacterial';
    
    // In your screen component:
    const YourScreen = () => {
      const { smiles, analysisResult, loading, analyze } = useAntibacterialAnalysis();
      
      const handleAnalyze = async () => {
        await analyze('CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O'); // Ibuprofen
      };
      
      return <AntibacterialAnalysisScreen />;
    };
  `,

  advancedComparison: `
    import { useCompoundComparison } from '@scientific/antibacterial';
    
    const { compounds, addCompound, removeCompound } = useCompoundComparison();
    
    // Add compounds to compare
    await addCompound('CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O', 'Ibuprofen');
    await addCompound('CC(=O)Oc1ccccc1C(=O)O', 'Aspirin');
  `,

  customVisualization: `
    import { ChemicalSpaceChart, DescriptorCard } from '@scientific/antibacterial';
    
    const CustomDashboard = ({ analysis }) => {
      const descriptors = analysis.descriptors.physicochemical;
      
      return (
        <>
          <ChemicalSpaceChart mw={descriptors.mw} tpsa={descriptors.tpsa} />
          <DescriptorCard 
            label="MW" 
            value={descriptors.mw} 
            unit="Da"
            ideal="250-600"
          />
        </>
      );
    };
  `
};

export default {
  AntibacterialAnalysisScreen,
  DescriptorCard,
  TargetPredictionCard,
  OptimizationPanel,
  ResistanceRiskCard,
  ChemicalSpaceChart,
  DescriptorRangeVisualization,
  MultiObjectiveChart,
  AntibacterialAPI,
  useAntibacterialAnalysis,
  useTargetPrediction,
  useAntibioticLikenessScore,
  useResistanceAnalysis,
  useOptimizationEngine,
  ANTIBACTERIAL_CONFIG,
  initializeAntibacterialSystem,
  DescriptorFormatters,
  Classifications,
  ScoringUtils,
  ReportGenerators,
  ErrorHandling,
  Validators,
  DataAggregation
};
