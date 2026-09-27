/**
 * ResistanceAnalysisService
 * Analyzes resistance potential and novelty scoring
 */

const { safeMin, safeMax, safeNumber } = require('../utils/safeMath');

class ResistanceAnalysisService {
  /**
   * Analyze resistance risk profile
   * @param {Object} descriptors - Molecular descriptors
   * @param {Object} targetProfile - Target classification
   * @returns {Object} Resistance analysis
   */
  analyzeResistanceRisk(descriptors, targetProfile, smiles) {
    if (!descriptors) {
      return { error: 'Invalid descriptors' };
    }

    const scaffoldNovelty = this.scoreScaffoldNovelty(smiles);
    const knownSimilarity = this.estimateKnownAntibioticSimilarity(descriptors, smiles);
    const crossResistanceRisk = this.estimateCrossResistanceRisk(descriptors, targetProfile);
    const structuralNovelty = this.estimateStructuralNovelty(descriptors, smiles);

    const overallResistanceRisk = this.calculateOverallRisk(
      scaffoldNovelty,
      knownSimilarity,
      crossResistanceRisk
    );

    return {
      scaffoldNovelty,
      knownSimilarity,
      crossResistanceRisk,
      structuralNovelty,
      overallResistanceRisk,
      rationale: this.generateResistanceRationale(
        scaffoldNovelty,
        knownSimilarity,
        crossResistanceRisk,
        overallResistanceRisk
      ),
      recommendations: this.generateResistanceRecommendations(overallResistanceRisk, knownSimilarity),
    };
  }

  /**
   * Score scaffold novelty
   */
  scoreScaffoldNovelty(smiles) {
    if (!smiles) {
      return {
        score: 0.5,
        noveltyLevel: 'Unknown',
        scaffoldComplexity: 0,
      };
    }

    // Heuristic-based novelty scoring
    const rings = this.countRings(smiles);
    const heteroatoms = this.countHeteroatoms(smiles);
    const functionalGroups = this.identifyFunctionalGroups(smiles);
    const complexity = (rings * 2 + heteroatoms * 1.5 + functionalGroups.length * 0.5) / 10;

    // Novel scaffolds tend to be more complex
    let noveltyScore = 0;
    if (complexity > 3) noveltyScore = 0.75; // High complexity = likely novel
    else if (complexity > 1.5) noveltyScore = 0.55;
    else noveltyScore = 0.35; // Simple scaffolds are well-known

    // Deduct if contains very common patterns
    if (this.isCommonScaffold(smiles)) {
      noveltyScore *= 0.7;
    }

    return {
      score: Math.min(1, noveltyScore),
      scaffoldComplexity: Math.round(complexity * 100) / 100,
      rings,
      heteroatoms,
      functionalGroupCount: functionalGroups.length,
      isCommonScaffold: this.isCommonScaffold(smiles),
      noveltyLevel: noveltyScore > 0.65 ? 'High' : noveltyScore > 0.35 ? 'Moderate' : 'Low',
    };
  }

  /**
   * Estimate similarity to known antibiotics
   */
  estimateKnownAntibioticSimilarity(descriptors, smiles) {
    // This would normally use ChEMBL similarity search or embedding comparison
    // For now, using heuristic based on descriptors

    const { mw, tpsa, logp, hbd, hba } = descriptors || {};
    const safeMw = safeNumber(mw, 0);
    const safeTpsa = safeNumber(tpsa, 0);
    const safeLogp = safeNumber(logp, 0);
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);

    // Compare to known antibiotic descriptor ranges
    const knownAntibcRanges = {
      mw: { min: 200, max: 700, typical: 400 },
      tpsa: { min: 40, max: 180, typical: 90 },
      logp: { min: 0, max: 4, typical: 2 },
    };

    let similarity = 0;
    let inRangeCount = 0;

    if (safeMw > (knownAntibcRanges.mw?.min ?? 0) && safeMw < (knownAntibcRanges.mw?.max ?? 1000)) {
      similarity += 0.25;
      inRangeCount++;
    }
    if (safeTpsa > (knownAntibcRanges.tpsa?.min ?? 0) && safeTpsa < (knownAntibcRanges.tpsa?.max ?? 200)) {
      similarity += 0.25;
      inRangeCount++;
    }
    if (safeLogp > (knownAntibcRanges.logp?.min ?? -5) && safeLogp < (knownAntibcRanges.logp?.max ?? 10)) {
      similarity += 0.25;
      inRangeCount++;
    }

    // H-bonding pattern
    if (safeHbd + safeHba > 4 && safeHbd + safeHba < 12) {
      similarity += 0.25;
    }

    return {
      score: Math.min(1, similarity),
      inTypicalRange: inRangeCount > 2,
      descriptorSimilarity: {
        mw: { value: safeMw, inRange: safeMw > 200 && safeMw < 700 },
        tpsa: { value: safeTpsa, inRange: safeTpsa > 40 && safeTpsa < 180 },
        logp: { value: safeLogp, inRange: safeLogp > 0 && safeLogp < 4 },
      },
      likelyKnown: similarity > 0.75,
    };
  }

  /**
   * Estimate cross-resistance risk
   */
  estimateCrossResistanceRisk(descriptors, targetProfile) {
    // Risk based on target class similarity to known resistant organisms

    let risk = 0.3; // baseline

    if (targetProfile?.topPrediction?.targetClass === 'ribosomeTargeting') {
      // Ribosomal resistance is very common
      risk = 0.8;
    } else if (targetProfile?.topPrediction?.targetClass === 'proteinTargeting') {
      // Protein-targeting compounds have variable resistance
      risk = 0.5;
    } else if (targetProfile?.topPrediction?.targetClass === 'membraneTargeting') {
      // Membrane disruptors have lower cross-resistance
      risk = 0.3;
    }

    // Adjust based on size
    if (descriptors.mw > 600) {
      risk += 0.1; // larger compounds more likely to resist
    }

    return {
      score: Math.max(0, Math.min(1, risk)),
      targetClassRisk: targetProfile?.topPrediction?.targetClass || 'unknown',
      molecularWeightFactor: descriptors.mw > 600 ? 'Increases Risk' : 'Neutral',
      riskLevel: risk > 0.65 ? 'High' : risk > 0.35 ? 'Moderate' : 'Low',
      mechanisms: this.suggestedResistanceMechanisms(targetProfile?.topPrediction?.targetClass),
    };
  }

  /**
   * Estimate structural novelty
   */
  estimateStructuralNovelty(descriptors, smiles) {
    const { mw, aromaticRings, rings } = descriptors;

    // Combine multiple novelty factors
    const scaffoldDiversity = this.scoreScaffoldNovelty(smiles).score;
    const ringDiversity = (rings * 0.2 + aromaticRings * 0.15) / 10;
    const sizeDiversity = mw > 500 ? 0.2 : 0.1;

    const overallNovelty = (scaffoldDiversity + ringDiversity + sizeDiversity) / 1.45;

    return {
      score: Math.min(1, overallNovelty),
      scaffoldDiversity,
      ringDiversity,
      sizeDiversity,
      noveltyClass: overallNovelty > 0.7 ? 'Highly Novel' : overallNovelty > 0.4 ? 'Moderately Novel' : 'Conventional',
    };
  }

  /**
   * Calculate overall resistance risk
   */
  calculateOverallRisk(scaffoldNovelty, knownSimilarity, crossResistance) {
    // Novel scaffolds (low similarity) with good target class = lower resistance risk
    const riskScore = knownSimilarity.score * 0.4 + crossResistance.score * 0.5 - scaffoldNovelty.score * 0.1;

    return {
      score: Math.max(0, Math.min(1, riskScore)),
      riskLevel: riskScore > 0.65 ? 'High' : riskScore > 0.35 ? 'Moderate' : 'Low',
      recommendation: this.getRiskRecommendation(riskScore),
    };
  }

  /**
   * Generate resistance rationale
   */
  generateResistanceRationale(scaffoldNovelty, knownSimilarity, crossResistance, overall) {
    const lines = [
      `Resistance Risk Assessment: ${overall.riskLevel}`,
      `Overall Score: ${Math.round(overall.score * 100)}%`,
      '',
      'Contributing Factors:',
      `- Scaffold Novelty: ${scaffoldNovelty.noveltyLevel} (${Math.round(scaffoldNovelty.score * 100)}%)`,
      `- Known Antibiotic Similarity: ${knownSimilarity.likelyKnown ? 'High' : 'Low'} (${Math.round(knownSimilarity.score * 100)}%)`,
      `- Cross-Resistance Risk: ${crossResistance.riskLevel} (${Math.round(crossResistance.score * 100)}%)`,
    ];

    if (scaffoldNovelty.score > 0.65) {
      lines.push('');
      lines.push('✓ Novel scaffold may evade existing resistance mechanisms');
    }

    if (knownSimilarity.score < 0.5) {
      lines.push('✓ Structurally distinct from well-characterized antibiotics');
    }

    return lines.join('\n');
  }

  /**
   * Generate resistance recommendations
   */
  generateResistanceRecommendations(overallRisk, knownSimilarity) {
    const recommendations = [];

    if (overallRisk.score < 0.35) {
      recommendations.push('Low resistance risk - prioritize for development');
      recommendations.push('Consider for clinical trials');
    } else if (overallRisk.score < 0.65) {
      recommendations.push('Moderate resistance risk - monitor for resistance patterns');
      recommendations.push('Consider combination therapy strategies');
    } else {
      recommendations.push('High resistance risk - design for resistance avoidance');
      recommendations.push('Increase structural novelty');
      recommendations.push('Consider targeting conserved sequences');
    }

    if (knownSimilarity.likelyKnown) {
      recommendations.push('May have known resistance mechanisms - research literature');
    }

    return recommendations;
  }

  /**
   * Suggested resistance mechanisms
   */
  suggestedResistanceMechanisms(targetClass) {
    const mechanisms = {
      ribosomeTargeting: [
        'Ribosomal RNA mutations',
        'Erm methyltransferases',
        'Ribosomal protein modifications',
      ],
      proteinTargeting: ['PBP mutations', 'Target mutations', 'Structural isomerization'],
      membraneTargeting: ['Lipopolysaccharide modifications', 'Membrane thickening'],
      dnaRnaTargeting: ['Topoisomerase mutations', 'DNA damage repair upregulation'],
    };

    return mechanisms[targetClass] || ['Unknown resistance mechanism'];
  }

  /**
   * Helper: count rings in SMILES
   */
  countRings(smiles) {
    const matches = smiles?.match(/[0-9]/g) || [];
    return Math.floor(matches.length / 2);
  }

  /**
   * Helper: count heteroatoms
   */
  countHeteroatoms(smiles) {
    const n = (smiles?.match(/N/g) || []).length;
    const o = (smiles?.match(/O/g) || []).length;
    const s = (smiles?.match(/S/g) || []).length;
    const p = (smiles?.match(/P/g) || []).length;
    return n + o + s + p;
  }

  /**
   * Helper: identify functional groups
   */
  identifyFunctionalGroups(smiles) {
    const groups = [];
    if (smiles?.includes('O=')) groups.push('carbonyl');
    if (smiles?.includes('N')) groups.push('amine');
    if (smiles?.includes('S')) groups.push('sulfur');
    if (smiles?.includes('C(=O)O')) groups.push('carboxylic_acid');
    if (smiles?.includes('C(=O)N')) groups.push('amide');
    return groups;
  }

  /**
   * Helper: check common scaffold
   */
  isCommonScaffold(smiles) {
    const commonPatterns = ['c1ccccc1', 'C1CCCCC1', 'N1CCOCC1'];
    return commonPatterns.some((p) => smiles?.includes(p));
  }

  /**
   * Helper: get risk recommendation
   */
  getRiskRecommendation(score) {
    if (score > 0.65) return 'High risk - increase novelty or consider alternative targets';
    if (score > 0.35) return 'Moderate risk - optimize target selectivity';
    return 'Low risk - strong candidate for development';
  }
}

module.exports = new ResistanceAnalysisService();
