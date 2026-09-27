/**
 * AntibioticLikenessScorer
 * Scores compounds for antibiotic-likeness based on physicochemical space
 */

const { safeMin, safeMax, safeNumber } = require('../utils/safeMath');

class AntibioticLikenessScorer {
  constructor() {
    this.rules = {
      proteinTargeting: {
        mw: { min: 150, max: 550, weight: 0.15 },
        tpsa: { min: 20, max: 130, weight: 0.15 },
        logp: { min: -1, max: 5, weight: 0.15 },
        hbd: { min: 0, max: 5, weight: 0.1 },
        hba: { min: 2, max: 10, weight: 0.1 },
        ro5: { maxViolations: 1, weight: 0.2 },
        aromaticRings: { min: 0, max: 4, weight: 0.1 },
        rotBonds: { min: 0, max: 10, weight: 0.05 },
      },
      ribosomeTargeting: {
        mw: { min: 400, max: 900, weight: 0.15 },
        tpsa: { min: 100, max: 250, weight: 0.2 },
        logp: { min: 0, max: 5, weight: 0.12 },
        hbd: { min: 2, max: 8, weight: 0.15 },
        hba: { min: 4, max: 15, weight: 0.15 },
        ro5: { maxViolations: 2, weight: 0.1 },
        aromaticRings: { min: 0, max: 3, weight: 0.08 },
      },
      membraneTargeting: {
        mw: { min: 100, max: 400, weight: 0.12 },
        tpsa: { min: 0, max: 60, weight: 0.2 },
        logp: { min: 2, max: 7, weight: 0.25 },
        hbd: { min: 0, max: 3, weight: 0.1 },
        hba: { min: 0, max: 5, weight: 0.1 },
        ro5: { maxViolations: 0, weight: 0.13 },
      },
    };
  }

  /**
   * Score antibiotic-likeness for a specific target class
   * @param {Object} descriptors - Molecular descriptors
   * @param {string} targetClass - Target class (protein, ribosome, membrane)
   * @returns {Object} Score details with rationale
   */
  scoreAntibioticLikeness(descriptors, targetClass = 'proteinTargeting') {
    if (!this.rules?.[targetClass]) {
      console.log('[AntibioticLikenessScorer] Undefined target class rules:', { targetClass, available: Object.keys(this.rules || {}) });
      return {
        error: `Unknown target class: ${targetClass}`,
        score: 0,
        confidence: 0,
      };
    }

    const rules = this.rules[targetClass];
    const { mw, tpsa, logp, hbd, hba, rotBonds, aromaticRings } = descriptors || {};

    let totalScore = 0;
    let weightSum = 0;
    const details = {};

    // Score each property with safe access
    const propertyScores = {
      mw: this.scoreProperty(mw, rules.mw?.min ?? 0, rules.mw?.max ?? 1000, rules.mw?.weight ?? 0, 'MW'),
      tpsa: this.scoreProperty(tpsa, rules.tpsa?.min ?? 0, rules.tpsa?.max ?? 200, rules.tpsa?.weight ?? 0, 'TPSA'),
      logp: this.scoreProperty(logp, rules.logp?.min ?? -5, rules.logp?.max ?? 10, rules.logp?.weight ?? 0, 'LogP'),
      hbd: this.scoreProperty(hbd, rules.hbd?.min ?? 0, rules.hbd?.max ?? 10, rules.hbd?.weight ?? 0, 'HBD'),
      hba: this.scoreProperty(hba, rules.hba?.min ?? 0, rules.hba?.max ?? 20, rules.hba?.weight ?? 0, 'HBA'),
      aromaticRings: this.scoreProperty(
        aromaticRings,
        rules.aromaticRings?.min ?? 0,
        rules.aromaticRings?.max ?? 5,
        rules.aromaticRings?.weight ?? 0,
        'Aromatic Rings'
      ),
    };

    if (rules.rotBonds && rotBonds !== undefined) {
      propertyScores.rotBonds = this.scoreProperty(
        rotBonds,
        rules.rotBonds?.min ?? 0,
        rules.rotBonds?.max ?? 15,
        rules.rotBonds?.weight ?? 0,
        'Rotatable Bonds'
      );
    }

    // Ro5 scoring
    const ro5Score = this.scoreRo5(descriptors, rules.ro5.maxViolations, rules.ro5.weight);
    propertyScores.ro5 = ro5Score;

    // Calculate weighted score
    for (const [prop, score] of Object.entries(propertyScores)) {
      totalScore += score.score * score.weight;
      weightSum += score.weight;
      details[prop] = score;
    }

    const normalizedScore = weightSum > 0 ? totalScore / weightSum : 0;

    return {
      targetClass,
      score: Math.round(normalizedScore * 100) / 100,
      confidence: Math.min(1, Math.max(0, normalizedScore)),
      passed: normalizedScore >= 0.65,
      details,
      rationale: this.generateRationale(targetClass, normalizedScore, details),
    };
  }

  /**
   * Score a single property against range
   */
  scoreProperty(value, min, max, weight, label) {
    const safeValue = safeNumber(value, 0);
    const safeMin = safeNumber(min, 0);
    const safeMax = safeNumber(max, 1000);
    const safeWeight = safeNumber(weight, 0);

    let score = 0;

    if (safeValue >= safeMin && safeValue <= safeMax) {
      // In range: score based on distance from center
      const center = (safeMin + safeMax) / 2;
      const maxDistance = Math.max(center - safeMin, safeMax - center);
      const distance = Math.abs(safeValue - center);
      score = maxDistance > 0 ? 1 - distance / maxDistance : 1;
    } else if (safeValue < safeMin) {
      // Below range
      const range = safeMin * 0.5 || 1;
      score = Math.max(0, 1 - (safeMin - safeValue) / range);
    } else {
      // Above range
      const range = safeMax * 0.5 || 1;
      score = Math.max(0, 1 - (safeValue - safeMax) / range);
    }

    return {
      label,
      value: safeValue,
      range: { min: safeMin, max: safeMax },
      score: Math.max(0, Math.min(1, score)),
      weight: safeWeight,
      inRange: safeValue >= safeMin && safeValue <= safeMax,
    };
  }

  /**
   * Score Ro5 compliance
   */
  scoreRo5(descriptors, maxViolations, weight) {
    const { mw, logp, hbd, hba } = descriptors || {};
    const safeMw = safeNumber(mw, 0);
    const safeLogp = safeNumber(logp, 0);
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);
    const safeMaxViolations = safeNumber(maxViolations, 1);
    const safeWeight = safeNumber(weight, 0);

    let violations = 0;
    if (safeMw > 500) violations++;
    if (safeLogp > 5) violations++;
    if (safeHbd > 5) violations++;
    if (safeHba > 10) violations++;

    const compliant = violations <= safeMaxViolations;
    const score = compliant ? 1 - violations / (safeMaxViolations + 1) : 0.3;

    return {
      label: 'Ro5 Compliance',
      violations,
      maxAllowed: safeMaxViolations,
      compliant,
      score: Math.max(0, Math.min(1, score)),
      weight: safeWeight,
    };
  }

  /**
   * Generate human-readable rationale
   */
  generateRationale(targetClass, score, details) {
    const passFailColor = score >= 0.65 ? 'PASS' : 'FAIL';

    const lines = [
      `Antibiotic-likeness for ${this.humanize(targetClass)}: ${passFailColor}`,
      `Overall Score: ${Math.round(score * 100)}%`,
      '',
      'Property Assessment:',
    ];

    const sortedDetails = Object.entries(details)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5);

    sortedDetails.forEach(([key, detail]) => {
      const status = detail.inRange ? '✓' : '✗';
      const value =
        typeof detail.value === 'number' ? `${Math.round(detail.value * 100) / 100}` : detail.value;
      const range = `[${detail.range?.min ?? 0}-${detail.range?.max ?? 100}]`;
      lines.push(`${status} ${detail.label}: ${value} ${range}`);
    });

    if (details.ro5?.violations > 0) {
      lines.push(`\nRo5 Violations: ${details.ro5.violations} (max allowed: ${details.ro5.maxAllowed})`);
    }

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

module.exports = new AntibioticLikenessScorer();
