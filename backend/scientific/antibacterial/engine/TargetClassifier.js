/**
 * TargetClassifier
 * Predicts likely antibacterial target class from molecular descriptors
 * Uses weighted heuristic model (ML-ready architecture)
 */

const { safeMin, safeMax, safeNumber } = require('../utils/safeMath');

class TargetClassifier {
  constructor() {
    this.models = {
      proteinTargeting: {
        weights: {
          mw: { coeff: 0.001, optimal: 350 }, // optimal around 350 Da
          tpsa: { coeff: 0.008, optimal: 75 },
          logp: { coeff: -0.15, optimal: 2.5 },
          hbd: { coeff: 0.05, optimal: 2 },
          hba: { coeff: 0.04, optimal: 3 },
        },
        threshold: 0.6,
      },
      ribosomeTargeting: {
        weights: {
          mw: { coeff: -0.001, optimal: 650 }, // higher MW preferred
          tpsa: { coeff: 0.01, optimal: 150 }, // high polarity
          logp: { coeff: 0.1, optimal: 3 },
          hbd: { coeff: 0.06, optimal: 4 },
          hba: { coeff: 0.08, optimal: 5 },
        },
        threshold: 0.6,
      },
      membraneTargeting: {
        weights: {
          mw: { coeff: 0.0008, optimal: 300 },
          tpsa: { coeff: -0.005, optimal: 40 }, // low polarity
          logp: { coeff: 0.3, optimal: 4.5 }, // high lipophilicity
          hbd: { coeff: -0.02, optimal: 1 },
          hba: { coeff: -0.03, optimal: 2 },
        },
        threshold: 0.55,
      },
      dnaRnaTargeting: {
        weights: {
          mw: { coeff: -0.0005, optimal: 400 },
          tpsa: { coeff: 0.015, optimal: 160 }, // very polar
          logp: { coeff: -0.2, optimal: 1 },
          hbd: { coeff: 0.1, optimal: 5 }, // many H-bond donors
          hba: { coeff: 0.1, optimal: 6 }, // many H-bond acceptors
        },
        threshold: 0.55,
      },
    };
  }

  /**
   * Predict target class from descriptors
   * @param {Object} descriptors - Molecular descriptors
   * @returns {Object} Prediction with confidence and rationale
   */
  predictTargetClass(descriptors) {
    if (!descriptors || Object.keys(descriptors).length === 0) {
      console.log('[TargetClassifier] Invalid or empty descriptors in predictTargetClass');
      return {
        predictions: [],
        topPrediction: null,
        confidence: 0,
        error: 'Invalid descriptors',
      };
    }

    const { mw, tpsa, logp, hbd, hba, formalCharge, aromaticRings } = descriptors;
    const safeMw = safeNumber(mw, 0);
    const safeTpsa = safeNumber(tpsa, 0);
    const safeLogp = safeNumber(logp, 0);
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);
    const safeFormalCharge = safeNumber(formalCharge, 0);
    const safeAromaticRings = safeNumber(aromaticRings, 0);

    const scores = {};

    // Calculate scores for each target class
    for (const [className, model] of Object.entries(this.models || {})) {
      const score = this.calculateClassScore(
        className,
        model,
        { mw: safeMw, tpsa: safeTpsa, logp: safeLogp, hbd: safeHbd, hba: safeHba },
        { formalCharge: safeFormalCharge, aromaticRings: safeAromaticRings }
      );
      scores[className] = score;
    }

    // Rank predictions
    const predictions = Object.entries(scores)
      .map(([className, score]) => ({
        targetClass: className,
        score: Math.min(1, Math.max(0, score)), // clamp 0-1
        confidence: Math.min(1, Math.max(0, score)),
        passed: score >= (this.models?.[className]?.threshold ?? 0.5),
      }))
      .sort((a, b) => b.score - a.score);

    const topPrediction = predictions[0];

    // Generate explanation
    const explanation = this.generateExplanation(
      topPrediction,
      predictions,
      { mw: safeMw, tpsa: safeTpsa, logp: safeLogp, hbd: safeHbd, hba: safeHba, formalCharge: safeFormalCharge, aromaticRings: safeAromaticRings },
      descriptors.smiles
    );

    return {
      predictions,
      topPrediction,
      confidence: topPrediction.confidence,
      explanation,
      descriptors: { mw, tpsa, logp, hbd, hba },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate score for a single target class
   */
  calculateClassScore(className, model, descriptors, extra) {
    const { mw, tpsa, logp, hbd, hba } = descriptors || {};
    const { formalCharge, aromaticRings } = extra || {};
    const safeMw = safeNumber(mw, 0);
    const safeTpsa = safeNumber(tpsa, 0);
    const safeLogp = safeNumber(logp, 0);
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);
    const safeFormalCharge = safeNumber(formalCharge, 0);
    const safeAromaticRings = safeNumber(aromaticRings, 0);

    let score = 0.5; // baseline

    // Distance-based scoring (lower is better)
    for (const [prop, weightConfig] of Object.entries(model?.weights || {})) {
      const value = descriptors?.[prop];
      const coeff = safeNumber(weightConfig?.coeff, 0);
      const optimal = safeNumber(weightConfig?.optimal, 0);
      if (typeof value === 'number' && !isNaN(value)) {
        const distance = Math.abs(value - optimal);
        const penalty = coeff * distance;
        score -= penalty;
      }
    }

    // Penalize very high cLogP (drug-likeness)
    if (safeLogp > 6) {
      score -= 0.1;
    }

    // Bonus for positive charge in DNA/RNA targeting
    if (className === 'dnaRnaTargeting' && safeFormalCharge > 0) {
      score += 0.15;
    }

    // Bonus for aromaticity in membrane/ribosomal targeting
    if ((className === 'membraneTargeting' || className === 'ribosomeTargeting') && safeAromaticRings > 1) {
      score += 0.1;
    }

    // Ensure score stays in reasonable range
    return Math.max(0, Math.min(1.5, score));
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(topPrediction, allPredictions, descriptors, smiles) {
    const { mw, tpsa, logp, hbd, hba, formalCharge, aromaticRings } = descriptors;

    const lines = [
      `Predicted target class: ${this.humanize(topPrediction.targetClass)}`,
      `Confidence: ${Math.round(topPrediction.confidence * 100)}%`,
      '',
      'Contributing factors:',
    ];

    if (topPrediction.targetClass === 'proteinTargeting') {
      lines.push(`- Molecular weight ${mw} Da (optimal ~350 Da for protein binding)`);
      lines.push(`- TPSA ${tpsa} Ų (balanced polarity for cell penetration)`);
      lines.push(`- LogP ${logp} (moderate lipophilicity)`);
      lines.push(`- Typical Ro5-compliant profile`);
    } else if (topPrediction.targetClass === 'ribosomeTargeting') {
      lines.push(`- Molecular weight ${mw} Da (larger, consistent with macrolides)`);
      lines.push(`- TPSA ${tpsa} Ų (high polarity for ribosomal binding)`);
      lines.push(`- Multiple hydrogen bond donors/acceptors (${hbd}/${hba})`);
      lines.push(`- Ribosome-like physicochemical profile`);
    } else if (topPrediction.targetClass === 'membraneTargeting') {
      lines.push(`- High lipophilicity (LogP ${logp})`);
      lines.push(`- Lower molecular weight (${mw} Da) for membrane penetration`);
      lines.push(`- Low polar surface area (${tpsa} Ų)`);
      lines.push(`- Consistent with membrane disruptors`);
    } else if (topPrediction.targetClass === 'dnaRnaTargeting') {
      lines.push(`- High polarity (TPSA ${tpsa} Ų)`);
      lines.push(`- Positive charge (formal charge ${formalCharge})`);
      lines.push(`- Strong hydrogen bonding capacity`);
      lines.push(`- Nucleic acid intercalation profile`);
    }

    lines.push('');
    lines.push('Alternative predictions:');
    allPredictions.slice(1, 3).forEach((p) => {
      lines.push(`- ${this.humanize(p.targetClass)}: ${Math.round(p.confidence * 100)}%`);
    });

    return lines.join('\n');
  }

  /**
   * Humanize class names
   */
  humanize(className) {
    const names = {
      proteinTargeting: 'Protein Targeting',
      ribosomeTargeting: 'Ribosome Targeting',
      membraneTargeting: 'Membrane Targeting',
      dnaRnaTargeting: 'DNA/RNA Targeting',
    };
    return names[className] || className;
  }
}

module.exports = new TargetClassifier();
