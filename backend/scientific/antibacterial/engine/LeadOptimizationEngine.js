/**
 * LeadOptimizationEngine
 * Multi-objective optimization for antibacterial compounds
 */

const { safeMin, safeMax, safeNumber } = require('../utils/safeMath');

class LeadOptimizationEngine {
  /**
   * Generate optimization recommendations
   */
  generateOptimizationPlan(descriptors, targetProfile, resistanceProfile) {
    if (!descriptors) {
      return { error: 'Invalid descriptors' };
    }

    const objectives = {
      activity: this.scoreActivityPotential(descriptors, targetProfile),
      permeability: this.scorePermeability(descriptors),
      toxicity: this.scoreToxicityRisk(descriptors),
      resistance: this.scoreResistanceAvoidance(resistanceProfile),
      synthesisability: this.scoreSynthesisability(descriptors),
    };

    const pareto = this.calculateParetoOptimality(objectives);

    return {
      objectives,
      paretoOptimality: pareto,
      recommendedOptimizations: this.generateOptimizationSteps(descriptors, objectives),
      priorityActions: this.prioritizeOptimizations(objectives, descriptors),
      rationale: this.generateOptimizationRationale(objectives),
    };
  }

  /**
   * Score activity potential
   */
  scoreActivityPotential(descriptors, targetProfile) {
    if (!targetProfile) {
      return { score: 0.5, factors: {} };
    }

    const { mw, tpsa, logp } = descriptors;
    let score = (targetProfile.confidence || 0.5) * 0.3;
    score += Math.min(1, Math.max(0, 1 - Math.abs(logp - 2.5) / 5)) * 0.2;
    score += Math.min(1, Math.max(0, 1 - Math.abs(mw - 350) / 250)) * 0.25;
    score += Math.min(1, Math.max(0, 1 - Math.abs(tpsa - 80) / 100)) * 0.25;

    return {
      score: Math.max(0, Math.min(1, score)),
      targetCompatibility: targetProfile.confidence || 0,
      descriptorMatch: Math.max(0, Math.min(1, score * 0.7)),
      factors: { mw: { value: mw, optimal: 350 }, tpsa: { value: tpsa, optimal: 80 }, logp: { value: logp, optimal: 2.5 } },
    };
  }

  /**
   * Score permeability
   */
  scorePermeability(descriptors) {
    const { mw, tpsa, logp, hbd, hba } = descriptors;
    let score = 0;
    if (mw < 500) score += 0.3;
    else if (mw < 600) score += 0.15;
    if (tpsa > 20 && tpsa < 130) score += 0.3;
    if (logp > 0 && logp < 5) score += 0.2;
    if (hbd < 5 && hba < 10) score += 0.2;

    return {
      score: Math.max(0, Math.min(1, score)),
      cellularPenetration: tpsa > 100 ? 'Moderate' : 'Good',
      membraneCrossing: logp > 0 && logp < 5 ? 'Favorable' : 'Challenging',
      factors: { size: mw, polarity: tpsa, lipophilicity: logp, hbonding: hbd + hba },
    };
  }

  /**
   * Score toxicity risk
   */
  scoreToxicityRisk(descriptors) {
    const { mw, logp, hbd, hba, formalCharge } = descriptors;
    let riskScore = 0;
    if (mw > 800) riskScore += 0.25;
    else if (mw > 600) riskScore += 0.1;
    if (logp > 5) riskScore += 0.25;
    if (hbd + hba > 12) riskScore += 0.15;
    if (hbd + hba < 2) riskScore += 0.1;
    if (Math.abs(formalCharge) > 2) riskScore += 0.15;

    const safetyScore = 1 - Math.min(1, riskScore);

    return {
      score: Math.max(0, safetyScore),
      toxicityLevel: safetyScore > 0.7 ? 'Low Risk' : safetyScore > 0.4 ? 'Moderate Risk' : 'High Risk',
      riskFactors: this.identifyToxicityRisks(descriptors),
    };
  }

  /**
   * Score resistance avoidance
   */
  scoreResistanceAvoidance(resistanceProfile) {
    if (!resistanceProfile) {
      return { score: 0.5 };
    }
    const avoidanceScore = 1 - resistanceProfile.overallResistanceRisk.score;
    return {
      score: Math.max(0, Math.min(1, avoidanceScore)),
      scaffoldNovelty: resistanceProfile.scaffoldNovelty.score,
      structuralNovelty: resistanceProfile.structuralNovelty.score,
      recommendation: resistanceProfile.overallResistanceRisk.recommendation,
    };
  }

  /**
   * Score synthesisability
   */
  scoreSynthesisability(descriptors) {
    const { rings, aromaticRings, rotBonds, mw, formalCharge } = descriptors;
    let score = 0.5;
    const totalComplexity = rings + aromaticRings * 2 + rotBonds;
    if (totalComplexity > 2 && totalComplexity < 8) score += 0.2;
    else if (totalComplexity > 1 && totalComplexity < 12) score += 0.1;
    if (aromaticRings > 0) score += 0.1;
    if (mw < 400) score += 0.15;
    else if (mw > 600) score -= 0.1;
    if (Math.abs(formalCharge) > 1) score -= 0.1;

    return {
      score: Math.max(0, Math.min(1, score)),
      complexity: totalComplexity,
      difficulty: totalComplexity > 10 ? 'Very Hard' : totalComplexity > 6 ? 'Hard' : 'Moderate',
      estimatedSteps: Math.ceil(3 + totalComplexity / 2),
      costEstimate: mw > 600 ? 'Expensive' : mw > 400 ? 'Medium' : 'Affordable',
    };
  }

  /**
   * Calculate Pareto optimality
   */
  calculateParetoOptimality(objectives) {
    const scores = [
      safeNumber(objectives?.activity?.score, 0),
      safeNumber(objectives?.permeability?.score, 0),
      safeNumber(objectives?.toxicity?.score, 0),
      safeNumber(objectives?.resistance?.score, 0),
      safeNumber(objectives?.synthesisability?.score, 0),
    ];
    const average = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
    const balanced = safeMin(scores) > 0.5;

    return {
      averageScore: Math.round(average * 100) / 100,
      balanced,
      weakestObjective: Object.entries(objectives || {}).reduce((min, [k, v]) =>
        safeNumber(v?.score, 0) < safeNumber(min.score, 1) ? { name: k, ...v } : min,
        { score: 1 }
      ),
      strongestObjective: Object.entries(objectives || {}).reduce((max, [k, v]) =>
        safeNumber(v?.score, 0) > safeNumber(max.score, 0) ? { name: k, ...v } : max,
        { score: 0 }
      ),
    };
  }

  /**
   * Generate optimization steps
   */
  generateOptimizationSteps(descriptors, objectives) {
    const steps = [];

    if (objectives.activity.score < 0.65) {
      steps.push({
        objective: 'Improve Target Compatibility',
        suggestions: [
          'Adjust molecular weight towards 350 Da',
          'Optimize TPSA for target interaction',
          'Fine-tune LogP to typical drug-like range (2-3)',
        ],
      });
    }

    if (objectives.permeability.score < 0.6) {
      steps.push({
        objective: 'Improve Cell Penetration',
        suggestions: [
          'Reduce molecular weight if > 500 Da',
          'Optimize TPSA (target: 20-130 Ų)',
          'Reduce polar functional groups if TPSA too high',
          'Consider prodrug approach',
        ],
      });
    }

    if (objectives.toxicity.score < 0.65) {
      steps.push({
        objective: 'Reduce Toxicity Risk',
        suggestions: this.identifyToxicityRisks(descriptors).map((r) => `Address: ${r}`),
      });
    }

    if (objectives.resistance.score < 0.6) {
      steps.push({
        objective: 'Increase Scaffold Novelty',
        suggestions: [
          'Introduce new ring systems',
          'Modify key functional groups',
          'Add stereochemical complexity',
          'Explore bioisosteric replacements',
        ],
      });
    }

    if (objectives.synthesisability.score < 0.55) {
      steps.push({
        objective: 'Improve Synthetic Accessibility',
        suggestions: [
          'Reduce ring connectivity complexity',
          'Utilize known synthetic routes',
          'Consider fragment-based assembly',
          'Remove unusual functional groups',
        ],
      });
    }

    return steps;
  }

  /**
   * Prioritize optimizations
   */
  prioritizeOptimizations(objectives, descriptors) {
    const priorities = [];
    const scoreCardinality = [
      { name: 'activity', score: objectives.activity.score, impact: 0.25 },
      { name: 'permeability', score: objectives.permeability.score, impact: 0.2 },
      { name: 'toxicity', score: objectives.toxicity.score, impact: 0.2 },
      { name: 'resistance', score: objectives.resistance.score, impact: 0.2 },
      { name: 'synthesisability', score: objectives.synthesisability.score, impact: 0.15 },
    ]
      .filter((o) => o.score < 0.7)
      .sort((a, b) => a.score - b.score);

    scoreCardinality.forEach((obj) => {
      priorities.push({
        priority: priorities.length + 1,
        objective: obj.name,
        currentScore: Math.round(obj.score * 100),
        estimatedImpact: `${Math.round(obj.impact * 100)}%`,
        effort: this.estimateOptimizationEffort(obj.name, descriptors),
      });
    });

    return priorities;
  }

  /**
   * Estimate optimization effort
   */
  estimateOptimizationEffort(objective, descriptors) {
    const effortMap = {
      activity: 'Medium - requires target validation',
      permeability: 'Low - structural modifications',
      toxicity: 'High - may require major redesign',
      resistance: 'High - scaffold redesign needed',
      synthesisability: 'Medium - route optimization',
    };
    return effortMap[objective] || 'Unknown';
  }

  /**
   * Identify toxicity risks
   */
  identifyToxicityRisks(descriptors) {
    const risks = [];
    const { mw, logp, hbd, hba, formalCharge } = descriptors;

    if (mw > 800) risks.push('High molecular weight may reduce metabolism');
    if (logp > 5) risks.push('Extreme lipophilicity may cause bioaccumulation');
    if (hbd + hba > 12) risks.push('Excessive polarity may indicate poor selectivity');
    if (Math.abs(formalCharge) > 2) risks.push('Extreme charge may indicate poor safety profile');

    return risks.length > 0 ? risks : ['Low toxicity risk profile'];
  }

  /**
   * Generate optimization rationale
   */
  generateOptimizationRationale(objectives) {
    const lines = ['Multi-Objective Optimization Assessment', '', 'Current Objective Scores:'];

    Object.entries(objectives).forEach(([key, obj]) => {
      const pct = Math.round(obj.score * 100);
      const status = pct > 70 ? '✓' : pct > 40 ? '~' : '✗';
      lines.push(`${status} ${this.humanizeKey(key)}: ${pct}%`);
    });

    lines.push('');
    lines.push('Optimization Strategy:');
    lines.push('Focus on weakest objectives first while maintaining balanced profile.');

    return lines.join('\n');
  }

  /**
   * Humanize objective names
   */
  humanizeKey(key) {
    const names = {
      activity: 'Target Activity',
      permeability: 'Cell Permeability',
      toxicity: 'Toxicity Safety',
      resistance: 'Resistance Avoidance',
      synthesisability: 'Synthetic Accessibility',
    };
    return names[key] || key;
  }
}

module.exports = new LeadOptimizationEngine();
