/**
 * RibosomeBindingProfiler
 * Analyzes ribosome-binding potential and macrolide/tetracycline signatures
 */

const { safeMin, safeMax, safeNumber } = require('../utils/safeMath');

class RibosomeBindingProfiler {
  /**
   * Analyze ribosomal targeting potential
   * @param {Object} descriptors - Molecular descriptors
   * @returns {Object} Ribosomal binding profile
   */
  analyzeRibosomalProfile(descriptors, smiles) {
    if (!descriptors) {
      console.log('[RibosomeBindingProfiler] Undefined descriptors in analyzeRibosomalProfile');
      return { error: 'Invalid descriptors' };
    }

    const { mw, tpsa, logp, hbd, hba, formalCharge, rings, aromaticRings, rotBonds } = descriptors;
    const safeMw = safeNumber(mw, 0);
    const safeTpsa = safeNumber(tpsa, 0);
    const safeLogp = safeNumber(logp, 0);
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);
    const safeFormalCharge = safeNumber(formalCharge, 0);
    const safeRings = safeNumber(rings, 0);
    const safeAromaticRings = safeNumber(aromaticRings, 0);
    const safeRotBonds = safeNumber(rotBonds, 0);

    const profile = {
      rnaBindingPotential: this.scoreRNABinding(descriptors),
      polarInteractionDensity: this.calculatePolarDensity(descriptors),
      magnesiumCoordinationTendency: this.estimateMgCoordination(descriptors),
      macrolideLikeness: this.scoreMacrolideLikeness(descriptors, smiles),
      tetracyclineLikeness: this.scoreTetracyclineLikeness(descriptors, smiles),
      ribosomeCompartmentAccess: this.estimateRibosomeAccess(descriptors),
      overallRibosomeScore: 0,
      rationale: [],
    };

    // Calculate overall ribosome score
    const riboScores = [
      safeNumber(profile.rnaBindingPotential?.score, 0),
      safeNumber(profile.polarInteractionDensity?.score, 0),
      safeNumber(profile.magnesiumCoordinationTendency?.score, 0),
      Math.max(safeNumber(profile.macrolideLikeness?.score, 0), safeNumber(profile.tetracyclineLikeness?.score, 0)),
      safeNumber(profile.ribosomeCompartmentAccess?.score, 0),
    ];

    profile.overallRibosomeScore = Math.round((riboScores.reduce((a, b) => a + b, 0) / Math.max(riboScores.length, 1)) * 100) / 100;

    // Generate rationale
    profile.rationale = this.generateRibosomeRationale(profile, descriptors);

    return profile;
  }

  /**
   * Score RNA binding potential
   */
  scoreRNABinding(descriptors) {
    const { tpsa, hbd, hba, logp, mw, formalCharge } = descriptors || {};
    const safeTpsa = safeNumber(tpsa, 0);
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);
    const safeLogp = safeNumber(logp, 0);
    const safeMw = safeNumber(mw, 0);
    const safeFormalCharge = safeNumber(formalCharge, 0);

    let score = 0;

    // High polarity (TPSA > 100) is favorable
    if (safeTpsa > 100) score += 0.3;
    else if (safeTpsa > 80) score += 0.2;

    // High H-bonding capacity
    const hbpotential = (safeHbd + safeHba) / 2;
    if (hbpotential > 6) score += 0.25;
    else if (hbpotential > 4) score += 0.15;

    // Positive charge favorable for RNA
    if (safeFormalCharge > 0) score += 0.2;
    else if (safeFormalCharge === 0) score += 0.1;

    // Moderate LogP
    if (safeLogp > 0 && safeLogp < 3) score += 0.15;

    // Moderate MW (ribosomal binders typically 400-900 Da)
    if (safeMw > 400 && safeMw < 900) score += 0.1;

    return {
      score: Math.min(1, score),
      factors: {
        polarity: safeTpsa,
        hbonding: hbpotential,
        charge: safeFormalCharge,
        lipophilicity: safeLogp,
        size: safeMw,
      },
    };
  }

  /**
   * Calculate polar interaction density
   */
  calculatePolarDensity(descriptors) {
    const { hbd, hba, tpsa, atomCount, mw } = descriptors || {};
    const safeHbd = safeNumber(hbd, 0);
    const safeHba = safeNumber(hba, 0);
    const safeMw = safeNumber(mw, 100);

    // Polar atoms per 100 amu
    const polarAtoms = safeHbd + safeHba;
    const density = (polarAtoms / safeMw) * 100;

    let score = 0;
    if (density > 5) score = 0.9; // very dense
    else if (density > 3.5) score = 0.8;
    else if (density > 2) score = 0.6;
    else score = 0.3;

    return {
      score: Math.min(1, score),
      polarAtomDensity: Math.round(density * 100) / 100,
      totalPolarAtoms: polarAtoms,
      expectedInteractions: Math.round((polarAtoms * 10 + tpsa * 0.5) / 10),
    };
  }

  /**
   * Estimate magnesium coordination tendency
   */
  estimateMgCoordination(descriptors) {
    const { hba, hbd, formalCharge } = descriptors;

    // Mg2+ prefers oxygen and nitrogen donors
    // Estimate based on HBA and charge distribution

    let score = 0;

    if (hba > 4) score += 0.3;
    if (hbd > 2) score += 0.2;
    if (formalCharge < -1) score += 0.25; // negative charge attracts Mg2+
    if (formalCharge > 0) score += 0.05; // positive less favorable

    return {
      score: Math.min(1, score),
      acceptorCount: hba,
      donorCount: hbd,
      electrostaticProfile: formalCharge,
      likelyCoordination: formalCharge < -1 ? 'High' : formalCharge < 0 ? 'Moderate' : 'Low',
    };
  }

  /**
   * Score macrolide-likeness
   */
  scoreMacrolideLikeness(descriptors, smiles) {
    const { mw, tpsa, hbd, hba, rings, logp, formalCharge } = descriptors;

    // Macrolides: 600-900 Da, high polarity, multiple H-bond donors
    let score = 0;

    if (mw > 500 && mw < 900) score += 0.25; // MW range
    if (rings >= 1) score += 0.15; // typically have rings (lactone)
    if (tpsa > 120 && tpsa < 200) score += 0.25; // characteristic polarity
    if (hbd > 2 && hba > 5) score += 0.2; // many H-bond sites
    if (logp > 0 && logp < 3) score += 0.15; // moderate lipophilicity

    // Check for macrolide-typical structures (O-rich)
    const oxygenCount = (smiles?.match(/O/g) || []).length || 0;
    if (oxygenCount > 4) score += 0.1;

    return {
      score: Math.min(1, score),
      mwMatch: mw > 500 && mw < 900,
      polarityMatch: tpsa > 120 && tpsa < 200,
      hbondingMatch: hbd > 2 && hba > 5,
      oxygenRich: oxygenCount > 4,
      activeMass: mw,
    };
  }

  /**
   * Score tetracycline-likeness
   */
  scoreTetracyclineLikeness(descriptors, smiles) {
    const { mw, tpsa, hbd, hba, aromaticRings, logp, formalCharge } = descriptors;

    // Tetracyclines: 400-500 Da, aromatic core, high polarity, moderate MW
    let score = 0;

    if (mw > 350 && mw < 550) score += 0.25;
    if (aromaticRings >= 3) score += 0.25; // characteristic fused rings
    if (tpsa > 100 && tpsa < 180) score += 0.2;
    if (logp > 0 && logp < 3) score += 0.15;
    if (hba > 6) score += 0.1; // oxygen-rich

    // Check for chelation potential (Mg2+)
    if (formalCharge <= 0) score += 0.05;

    return {
      score: Math.min(1, score),
      mwMatch: mw > 350 && mw < 550,
      aromaticityMatch: aromaticRings >= 3,
      polarityMatch: tpsa > 100 && tpsa < 180,
      chelationPotential: formalCharge <= 0,
      fusedrings: aromaticRings,
    };
  }

  /**
   * Estimate ribosome compartment access
   */
  estimateRibosomeAccess(descriptors) {
    const { mw, tpsa, logp } = descriptors;

    // Small compounds can access; moderate polarity helps; lipophilic can cross membranes
    let score = 0;

    if (mw < 800) score += 0.3; // size favorable
    if (tpsa > 80) score += 0.2; // polar enough to dissolve
    if (tpsa < 200) score += 0.15; // not too polar (can cross membranes)
    if (logp > -2 && logp < 5) score += 0.25; // balanced permeability
    if (tpsa > 130 && tpsa < 180) score += 0.1; // ribosome-characteristic region

    return {
      score: Math.min(1, score),
      sizeAcceptable: mw < 800,
      solubilityProfile: tpsa,
      membranePermeability: logp,
      likelyAccess: score > 0.65 ? 'Good' : score > 0.35 ? 'Moderate' : 'Poor',
    };
  }

  /**
   * Generate ribosomal profile rationale
   */
  generateRibosomeRationale(profile, descriptors) {
    const lines = [
      `Ribosomal Targeting Profile: ${Math.round(profile.overallRibosomeScore * 100)}%`,
      '',
      'Key Indicators:',
    ];

    if (profile.rnaBindingPotential.score > 0.65) {
      lines.push('✓ Strong RNA-binding potential');
    }

    if (profile.polarInteractionDensity.score > 0.6) {
      lines.push(`✓ High polar interaction density: ${profile.polarInteractionDensity.polarAtomDensity} atoms/100amu`);
    }

    const riboScore = Math.max(profile.macrolideLikeness.score, profile.tetracyclineLikeness.score);
    if (profile.macrolideLikeness.score > profile.tetracyclineLikeness.score) {
      lines.push(`✓ Macrolide-like profile: ${Math.round(profile.macrolideLikeness.score * 100)}%`);
    } else {
      lines.push(`✓ Tetracycline-like profile: ${Math.round(profile.tetracyclineLikeness.score * 100)}%`);
    }

    if (profile.ribosomeCompartmentAccess.score > 0.6) {
      lines.push(`✓ Ribosome access: ${profile.ribosomeCompartmentAccess.likelyAccess}`);
    }

    return lines.join('\n');
  }
}

module.exports = new RibosomeBindingProfiler();
