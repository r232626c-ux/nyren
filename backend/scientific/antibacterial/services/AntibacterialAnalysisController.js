/**
 * AntibacterialAnalysisController
 * Central controller orchestrating all antibacterial analysis services
 */

const DescriptorService = require('../descriptors/DescriptorService');
const TargetClassifier = require('../engine/TargetClassifier');
const AntibioticLikenessScorer = require('../engine/AntibioticLikenessScorer');
const RibosomeBindingProfiler = require('../engine/RibosomeBindingProfiler');
const ResistanceAnalysisService = require('../resistance/ResistanceAnalysisService');
const LeadOptimizationEngine = require('../engine/LeadOptimizationEngine');

class AntibacterialAnalysisController {
  /**
   * Complete antibacterial analysis workflow
   */
  async analyzeCompound(smiles) {
    try {
      // Step 1: Calculate descriptors
      const descriptors = await DescriptorService.calculateDescriptors(smiles);

      // Step 2: Predict target class
      const targetProfile = TargetClassifier.predictTargetClass(descriptors);

      // Step 3: Score antibiotic-likeness
      const antibioticLikeness = AntibioticLikenessScorer.scoreAntibioticLikeness(
        descriptors,
        targetProfile.topPrediction?.targetClass || 'proteinTargeting'
      );

      // Step 4: Analyze ribosomal profile
      const ribosomeProfile = RibosomeBindingProfiler.analyzeRibosomalProfile(descriptors, smiles);

      // Step 5: Resistance analysis
      const resistanceProfile = ResistanceAnalysisService.analyzeResistanceRisk(descriptors, targetProfile, smiles);

      // Step 6: Lead optimization
      const optimizationPlan = LeadOptimizationEngine.generateOptimizationPlan(
        descriptors,
        targetProfile,
        resistanceProfile
      );

      // Compile comprehensive report
      const report = {
        smiles,
        timestamp: new Date().toISOString(),
        analysis: {
          descriptors: {
            physicochemical: descriptors,
            antiioticRegion: DescriptorService.getAntibioticRegion(descriptors),
            ro5Compliance: DescriptorService.checkRo5(descriptors),
          },
          targetClassification: targetProfile,
          antibioticLikeness,
          ribosomeBinding: ribosomeProfile,
          resistanceAnalysis: resistanceProfile,
          leadOptimization: optimizationPlan,
        },
        summary: this.generateExecutiveSummary({
          descriptors,
          targetProfile,
          antibioticLikeness,
          ribosomeProfile,
          resistanceProfile,
          optimizationPlan,
        }),
      };

      return report;
    } catch (error) {
      console.error('[AntibacterialAnalysisController] Error:', error);
      throw new Error(`Antibacterial analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(data) {
    const {
      descriptors,
      targetProfile,
      antibioticLikeness,
      ribosomeProfile,
      resistanceProfile,
      optimizationPlan,
    } = data;

    const overallScore = (antibioticLikeness.confidence +
      (1 - resistanceProfile.overallResistanceRisk.score) +
      optimizationPlan.paretoOptimality.averageScore) / 3;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      developmentPotential: overallScore > 0.65 ? 'High' : overallScore > 0.35 ? 'Moderate' : 'Low',
      primaryTarget: targetProfile.topPrediction?.targetClass,
      targetConfidence: Math.round(targetProfile.topPrediction?.confidence * 100) || 0,
      antibioticLikeness: Math.round(antibioticLikeness.confidence * 100) || 0,
      resistanceRisk: resistanceProfile.overallResistanceRisk.riskLevel,
      keyRecommendations: [
        targetProfile.topPrediction?.targetClass
          ? `Primary target: ${this.humanizeTargetClass(targetProfile.topPrediction.targetClass)}`
          : 'Determine target class',
        antibioticLikeness.passed
          ? 'Compound meets antibiotic-likeness criteria'
          : 'Optimize for antibiotic-likeness',
        resistanceProfile.overallResistanceRisk.recommendation,
        ...optimizationPlan.priorityActions.slice(0, 2).map((p) => `Prioritize: ${p.objective}`),
      ],
      nextSteps: [
        'Validate target binding experimentally',
        'Conduct resistance profiling studies',
        'Perform permeability testing',
        ...optimizationPlan.recommendedOptimizations.slice(0, 2).map((o) => `${o.objective}`),
      ],
    };
  }

  /**
   * Humanize target class
   */
  humanizeTargetClass(className) {
    const names = {
      proteinTargeting: 'Protein Targeting',
      ribosomeTargeting: 'Ribosome Targeting',
      membraneTargeting: 'Membrane Targeting',
      dnaRnaTargeting: 'DNA/RNA Targeting',
    };
    return names[className] || className;
  }

  /**
   * Predict target class only (lightweight)
   */
  async predictTargetClass(smiles) {
    try {
      const descriptors = await DescriptorService.calculateDescriptors(smiles);
      return TargetClassifier.predictTargetClass(descriptors);
    } catch (error) {
      throw new Error(`Target prediction failed: ${error.message}`);
    }
  }

  /**
   * Score antibiotic-likeness only
   */
  async scoreAntibioticLikeness(smiles, targetClass = 'proteinTargeting') {
    try {
      const descriptors = await DescriptorService.calculateDescriptors(smiles);
      return AntibioticLikenessScorer.scoreAntibioticLikeness(descriptors, targetClass);
    } catch (error) {
      throw new Error(`Antibiotic-likeness scoring failed: ${error.message}`);
    }
  }

  /**
   * Analyze resistance only
   */
  async analyzeResistance(smiles) {
    try {
      const descriptors = await DescriptorService.calculateDescriptors(smiles);
      const targetProfile = TargetClassifier.predictTargetClass(descriptors);
      return ResistanceAnalysisService.analyzeResistanceRisk(descriptors, targetProfile, smiles);
    } catch (error) {
      throw new Error(`Resistance analysis failed: ${error.message}`);
    }
  }

  /**
   * Optimize compound profile
   */
  async optimizeCompound(smiles) {
    try {
      const descriptors = await DescriptorService.calculateDescriptors(smiles);
      const targetProfile = TargetClassifier.predictTargetClass(descriptors);
      const resistanceProfile = ResistanceAnalysisService.analyzeResistanceRisk(descriptors, targetProfile, smiles);

      return LeadOptimizationEngine.generateOptimizationPlan(descriptors, targetProfile, resistanceProfile);
    } catch (error) {
      throw new Error(`Optimization failed: ${error.message}`);
    }
  }
}

module.exports = new AntibacterialAnalysisController();
