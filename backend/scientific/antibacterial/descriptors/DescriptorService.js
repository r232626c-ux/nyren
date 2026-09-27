/**
 * DescriptorService
 * Calculates physicochemical descriptors for molecules
 * RDKit-compatible descriptor calculations
 */

class DescriptorService {
  /**
   * Calculate molecular descriptors from SMILES
   * @param {string} smiles - SMILES string
   * @returns {Promise<Object>} Descriptors object
   */
  async calculateDescriptors(smiles) {
    if (!smiles?.trim()) {
      throw new Error('Invalid SMILES string');
    }

    try {
      const descriptors = await this.calculateWithRdkit(smiles);
      return descriptors;
    } catch (error) {
      console.warn('[RDKit Fallback]', error.message || error);
      return this.mockDescriptorFallback(smiles);
    }
  }

  async calculateWithRdkit(smiles) {
    // RDKit integration is optional; fallback is provided when not available.
    throw new Error('RDKit integration not available in current runtime');
  }

  mockDescriptorFallback(smiles) {
    const descriptors = this.calculateHeuristics(smiles);
    return {
      ...descriptors,
      fallback: true,
      fallbackReason: 'rdkit-not-available',
      fallbackAt: new Date().toISOString(),
    };
  }

  /**
   * Heuristic-based descriptor calculation (non-RDKit fallback)
   * @param {string} smiles - SMILES string
   * @returns {Object} Calculated descriptors
   */
  calculateHeuristics(smiles) {
    // Basic heuristic calculations based on SMILES patterns
    const mw = this.estimateMW(smiles);
    const logp = this.estimateLogP(smiles);
    const hbd = this.countHydrogenBondDonors(smiles);
    const hba = this.countHydrogenBondAcceptors(smiles);
    const tpsa = this.estimateTPSA(smiles, hbd, hba);
    const rotBonds = this.countRotatableBonds(smiles);
    const aromaticRings = this.countAromaticRings(smiles);
    const formalCharge = this.estimateFormalCharge(smiles);
    const rings = this.countRings(smiles);
    const atoms = smiles.length * 0.4; // rough estimate

    return {
      mw,
      logp,
      hbd,
      hba,
      tpsa,
      rotBonds,
      aromaticRings,
      formalCharge,
      rings,
      atomCount: Math.round(atoms),
      smiles,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Estimate molecular weight from SMILES
   */
  estimateMW(smiles) {
    const atomicWeights = {
      H: 1.008,
      C: 12.01,
      N: 14.01,
      O: 16.0,
      S: 32.07,
      P: 30.97,
      F: 19.0,
      Cl: 35.45,
      Br: 79.9,
      I: 126.9,
    };

    let mw = 0;
    let i = 0;
    while (i < smiles.length) {
      const char = smiles[i];
      if (char === 'C') mw += atomicWeights.C;
      else if (char === 'N') mw += atomicWeights.N;
      else if (char === 'O') mw += atomicWeights.O;
      else if (char === 'S') mw += atomicWeights.S;
      else if (char === 'P') mw += atomicWeights.P;
      else if (char === 'F') mw += atomicWeights.F;
      else if (char === 'B' && smiles[i + 1] === 'r') {
        mw += atomicWeights.Br;
        i++;
      } else if (char === 'C' && smiles[i + 1] === 'l') {
        mw += atomicWeights.Cl;
        i++;
      } else if (char === 'I') mw += atomicWeights.I;
      else if (char === 'H') mw += atomicWeights.H;
      i++;
    }

    return Math.round(mw * 100) / 100;
  }

  /**
   * Estimate LogP (lipophilicity)
   */
  estimateLogP(smiles) {
    // Simplified Wildman-Crippen LogP estimation
    const carbonCount = (smiles.match(/C/g) || []).length;
    const nitrogenCount = (smiles.match(/N/g) || []).length;
    const oxygenCount = (smiles.match(/O/g) || []).length;
    const sulfurCount = (smiles.match(/S/g) || []).length;
    const aromaticCount = (smiles.match(/c/g) || []).length;

    let logp =
      carbonCount * 0.5 +
      nitrogenCount * (-0.7) +
      oxygenCount * (-1.0) +
      sulfurCount * 0.36 +
      aromaticCount * 0.24;

    // Adjust for halides
    const fluorineCount = (smiles.match(/F/g) || []).length;
    const chlorineCount = (smiles.match(/Cl/g) || []).length;
    const bromineCount = (smiles.match(/Br/g) || []).length;
    const iodineCount = (smiles.match(/I/g) || []).length;

    logp += fluorineCount * 0.76 + chlorineCount * 0.39 + bromineCount * 0.2 + iodineCount * -0.16;

    return Math.round(logp * 100) / 100;
  }

  /**
   * Count hydrogen bond donors
   */
  countHydrogenBondDonors(smiles) {
    const oh = (smiles.match(/O/g) || []).length;
    const nh = (smiles.match(/N/g) || []).length;
    return oh + Math.floor(nh * 0.5);
  }

  /**
   * Count hydrogen bond acceptors
   */
  countHydrogenBondAcceptors(smiles) {
    const nitrogen = (smiles.match(/N/g) || []).length;
    const oxygen = (smiles.match(/O/g) || []).length;
    const sulfur = (smiles.match(/S/g) || []).length;
    return nitrogen + oxygen + sulfur;
  }

  /**
   * Estimate topological polar surface area
   */
  estimateTPSA(smiles, hbd, hba) {
    // Simplified TPSA: based on polar atoms
    const OH = (smiles.match(/O/g) || []).length * 20.23;
    const NH = (smiles.match(/N/g) || []).length * 12.03;
    const S = (smiles.match(/S/g) || []).length * 7.59;
    const P = (smiles.match(/P/g) || []).length * 6.24;

    const tpsa = OH + NH + S + P;
    return Math.round(tpsa * 100) / 100;
  }

  /**
   * Count rotatable bonds
   */
  countRotatableBonds(smiles) {
    // Count single bonds not in rings (simplified)
    const matches = smiles.match(/[^#=-](-|cc)/g) || [];
    return Math.max(0, matches.length - 1);
  }

  /**
   * Count aromatic rings
   */
  countAromaticRings(smiles) {
    const matches = smiles.match(/c1[c|n|o|s]/g) || [];
    return Math.floor(matches.length / 6);
  }

  /**
   * Count all rings
   */
  countRings(smiles) {
    const cyclicPattern = /[0-9]/g;
    const rings = smiles.match(cyclicPattern) || [];
    return Math.floor(rings.length / 2);
  }

  /**
   * Estimate formal charge
   */
  estimateFormalCharge(smiles) {
    const plusCount = (smiles.match(/\+/g) || []).length;
    const minusCount = (smiles.match(/-/g) || []).length;
    return plusCount - minusCount;
  }

  /**
   * Get antibiotic-region classification based on descriptors
   */
  getAntibioticRegion(descriptors) {
    const { mw, tpsa, logp } = descriptors;

    const regions = [];

    // Protein-targeting region (drug-like, moderate MW)
    if (mw < 550 && tpsa > 20 && tpsa < 130 && logp < 5) {
      regions.push({
        name: 'protein-targeting-compatible',
        score: 0.8,
        rationale: 'Moderate MW, balanced polarity, typical Ro5 profile',
      });
    }

    // Ribosomal region (larger, polar)
    if (mw > 500 && tpsa > 100 && logp > 2) {
      regions.push({
        name: 'ribosomal-targeting-compatible',
        score: 0.8,
        rationale: 'Higher MW, significant polarity, ribosome-binding potential',
      });
    }

    // Membrane-targeting region (lipophilic)
    if (logp > 4 && mw < 400) {
      regions.push({
        name: 'membrane-targeting-compatible',
        score: 0.7,
        rationale: 'High lipophilicity, small size, membrane permeability',
      });
    }

    // DNA/RNA-targeting region (high charge, polar)
    if (tpsa > 150 && descriptors.formalCharge > 0) {
      regions.push({
        name: 'dna-rna-targeting-compatible',
        score: 0.7,
        rationale: 'High polarity, positive charge, nucleic acid binding',
      });
    }

    return regions.length > 0
      ? regions
      : [{ name: 'unknown', score: 0.3, rationale: 'Descriptors outside typical antibacterial regions' }];
  }

  /**
   * Check Ro5 compliance
   */
  checkRo5(descriptors) {
    const { mw, logp, hbd, hba } = descriptors;

    const violations = [];

    if (mw > 500) violations.push('MW > 500');
    if (logp > 5) violations.push('LogP > 5');
    if (hbd > 5) violations.push('HBD > 5');
    if (hba > 10) violations.push('HBA > 10');

    return {
      compliant: violations.length <= 1,
      violations,
      violationCount: violations.length,
    };
  }
}

module.exports = new DescriptorService();
