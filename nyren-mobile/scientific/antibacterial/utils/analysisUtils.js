/**
 * Formatting utilities for antibacterial analysis display
 */

export const DescriptorFormatters = {
  /**
   * Format molecular weight with appropriate precision and unit
   */
  formatMW: (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(1)} Da`;
  },

  /**
   * Format LogP (lipophilicity) with appropriate precision
   */
  formatLogP: (value) => {
    if (typeof value !== 'number') return 'N/A';
    return value.toFixed(2);
  },

  /**
   * Format TPSA (topological polar surface area)
   */
  formatTPSA: (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(1)} Ų`;
  },

  /**
   * Format hydrogen bond donors
   */
  formatHBD: (value) => {
    if (typeof value !== 'number') return 'N/A';
    return Math.round(value).toString();
  },

  /**
   * Format hydrogen bond acceptors
   */
  formatHBA: (value) => {
    if (typeof value !== 'number') return 'N/A';
    return Math.round(value).toString();
  },

  /**
   * Format score as percentage
   */
  formatScore: (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${Math.round(value * 100)}%`;
  },

  /**
   * Format confidence as percentage
   */
  formatConfidence: (value) => {
    if (typeof value !== 'number') return 'N/A';
    const pct = Math.round(value * 100);
    return `${pct}%`;
  }
};

/**
 * Classification utilities
 */
export const Classifications = {
  /**
   * Get target class display name and description
   */
  getTargetInfo: (targetClass) => {
    const info = {
      'protein-targeting': {
        name: 'Protein Targeting',
        color: '#38bdf8',
        icon: 'git-branch',
        description: 'Inhibits bacterial protein synthesis through protease inhibition'
      },
      'ribosome-targeting': {
        name: 'Ribosome Targeting',
        color: '#a855f7',
        icon: 'nuclear',
        description: 'Binds to bacterial ribosomal subunits to inhibit translation'
      },
      'membrane-targeting': {
        name: 'Membrane Targeting',
        color: '#f59e0b',
        icon: 'shield',
        description: 'Disrupts bacterial cell membrane integrity'
      },
      'dna-targeting': {
        name: 'DNA/RNA Targeting',
        color: '#ec4899',
        icon: 'link',
        description: 'Interferes with DNA replication or transcription'
      }
    };
    return info[targetClass] || {
      name: 'Unknown',
      color: '#64748b',
      icon: 'help-circle',
      description: 'Target class unidentified'
    };
  },

  /**
   * Get risk level information with color coding
   */
  getRiskInfo: (riskLevel) => {
    const info = {
      'high': {
        color: '#ef4444',
        icon: 'alert-circle',
        description: 'High probability of resistance development - requires optimization'
      },
      'moderate': {
        color: '#f59e0b',
        icon: 'alert',
        description: 'Moderate resistance risk - monitor carefully during development'
      },
      'low': {
        color: '#22c55e',
        icon: 'checkmark-circle',
        description: 'Low resistance risk - compound is resistant-friendly'
      }
    };
    return info[riskLevel?.toLowerCase()] || {
      color: '#64748b',
      icon: 'help-circle',
      description: 'Risk level unknown'
    };
  },

  /**
   * Get Ro5 compliance status
   */
  getRo5Status: (violations) => {
    if (violations === 0) return { status: 'compliant', color: '#22c55e', icon: 'checkmark-circle' };
    if (violations === 1) return { status: 'warning', color: '#f59e0b', icon: 'alert' };
    return { status: 'failed', color: '#ef4444', icon: 'close-circle' };
  }
};

/**
 * Scoring utilities
 */
export const ScoringUtils = {
  /**
   * Interpret antibiotic-likeness score
   */
  interpretAntibioticScore: (score) => {
    if (score >= 0.8) return { level: 'Excellent', color: '#22c55e' };
    if (score >= 0.6) return { level: 'Good', color: '#84cc16' };
    if (score >= 0.4) return { level: 'Moderate', color: '#f59e0b' };
    if (score >= 0.2) return { level: 'Poor', color: '#f97316' };
    return { level: 'Very Poor', color: '#ef4444' };
  },

  /**
   * Calculate development potential based on multiple factors
   */
  calculateDevelopmentPotential: (overallScore, resistanceRisk, antibioticLikeness) => {
    const scoreWeight = 0.4;
    const resistanceWeight = 0.3;
    const antibiotiWeight = 0.3;

    // Normalize resistance risk (invert so low risk is better)
    let resistanceScore = 0.5;
    if (resistanceRisk === 'Low') resistanceScore = 1.0;
    else if (resistanceRisk === 'Moderate') resistanceScore = 0.6;

    const potential = (overallScore * scoreWeight) +
                     (resistanceScore * resistanceWeight) +
                     (antibioticLikeness * antibiotiWeight);

    if (potential >= 0.75) return 'Excellent';
    if (potential >= 0.6) return 'Good';
    if (potential >= 0.45) return 'Promising';
    if (potential >= 0.3) return 'Concerning';
    return 'Poor';
  },

  /**
   * Generate optimization priority level
   */
  getOptimizationPriority: (objectives) => {
    if (!Array.isArray(objectives) || objectives.length === 0) return 'minimal';
    
    const avgScore = objectives.reduce((sum, obj) => sum + (obj.score || 0), 0) / objectives.length;
    const failedCount = objectives.filter(obj => (obj.score || 0) < 0.5).length;

    if (failedCount >= 3) return 'critical';
    if (failedCount >= 2) return 'high';
    if (avgScore < 0.6) return 'medium';
    return 'low';
  }
};

/**
 * Analysis report generators
 */
export const ReportGenerators = {
  /**
   * Generate short summary line for compound
   */
  generateSummary: (analysis) => {
    const target = analysis?.summary?.primaryTarget || 'Unknown target';
    const score = analysis?.summary?.overallScore || 0;
    const risk = analysis?.summary?.resistanceRisk || 'Unknown';

    return `${(score * 100).toFixed(0)}% likely ${target} with ${risk} resistance risk`;
  },

  /**
   * Generate export-friendly report
   */
  generateReport: (smiles, analysis) => {
    const timestamp = new Date().toISOString();
    const report = {
      metadata: {
        smiles,
        timestamp,
        version: '1.0'
      },
      summary: analysis?.summary,
      descriptors: analysis?.analysis?.descriptors,
      targetClassification: analysis?.analysis?.targetClassification,
      antibioticLikeness: analysis?.analysis?.antibioticLikeness,
      ribosomeProfile: analysis?.analysis?.ribosomeProfile,
      resistanceAnalysis: analysis?.analysis?.resistanceAnalysis,
      optimization: analysis?.analysis?.optimization
    };

    return report;
  },

  /**
   * Generate CSV-formatted export
   */
  exportAsCSV: (compounds) => {
    if (!compounds || compounds.length === 0) return '';

    const headers = [
      'SMILES',
      'Overall Score',
      'Target Class',
      'Target Confidence',
      'Antibiotic Likeness',
      'Resistance Risk',
      'MW',
      'LogP',
      'TPSA',
      'HBD',
      'HBA',
      'Ro5 Compliant'
    ];
    if (!Array.isArray(compounds)) return headers.join(',');
    const rows = compounds.map(compound => {
      const analysis = compound.analysis || compound.result?.analysis || {};
      const summary = compound.result?.summary || {};
      const descriptors = analysis.descriptors?.physicochemical || {};
      const ro5 = analysis.descriptors?.ro5Compliance || {};

      return [
        `"${compound.smiles}"`,
        (summary.overallScore * 100).toFixed(1),
        summary.primaryTarget?.split('Targeting')[0] || '',
        `${(summary.targetConfidence || 0)}%`,
        `${(summary.antibioticLikeness || 0)}%`,
        summary.resistanceRisk || '',
        descriptors.mw?.toFixed(1) || '',
        descriptors.logp?.toFixed(2) || '',
        descriptors.tpsa?.toFixed(1) || '',
        descriptors.hbd || '',
        descriptors.hba || '',
        ro5.compliant ? 'Yes' : 'No'
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};

/**
 * Error handling utilities
 */
export const ErrorHandling = {
  /**
   * Get user-friendly error message
   */
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.message) return error.message;
    return 'An unknown error occurred. Please try again.';
  },

  /**
   * Map error codes to actionable messages
   */
  getErrorAction: (errorCode) => {
    const actions = {
      'INVALID_SMILES': 'Please check your SMILES string format. Ensure parentheses and brackets are balanced.',
      'SERVICE_UNAVAILABLE': 'The analysis service is currently unavailable. Please try again in a moment.',
      'TIMEOUT': 'The analysis took too long. Try with a simpler structure or check your connection.',
      'INVALID_COMPOUND': 'The compound cannot be analyzed. Ensure the SMILES represents a valid molecule.',
      'SERVER_ERROR': 'A server error occurred. Contact support if this persists.',
      'NETWORK_ERROR': 'Network connection failed. Check your internet connection and try again.'
    };

    return actions[errorCode] || 'Please try again or contact support.';
  }
};

/**
 * Validation utilities
 */
export const Validators = {
  /**
   * Validate SMILES string
   */
  isValidSmiles: (smiles) => {
    if (!smiles || typeof smiles !== 'string') return false;
    if (smiles.length === 0 || smiles.length > 500) return false;
    
    // Check for valid characters
    const validChars = /^[A-Za-z0-9\(\)\[\]=#\\\/\-@+.]+$/;
    if (!validChars.test(smiles)) return false;

    // Check bracket balance
    const openBrackets = (smiles.match(/\[/g) || []).length;
    const closeBrackets = (smiles.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) return false;

    return true;
  },

  /**
   * Validate descriptor ranges
   */
  validateDescriptorRanges: (descriptors) => {
    const errors = [];

    if (descriptors.mw < 50 || descriptors.mw > 1000) {
      errors.push('Molecular weight out of reasonable range (50-1000 Da)');
    }

    if (descriptors.tpsa < 0 || descriptors.tpsa > 200) {
      errors.push('TPSA out of reasonable range (0-200 Ų)');
    }

    if (descriptors.hbd < 0 || descriptors.hbd > 20) {
      errors.push('Number of H-bond donors out of range (0-20)');
    }

    if (descriptors.hba < 0 || descriptors.hba > 30) {
      errors.push('Number of H-bond acceptors out of range (0-30)');
    }

    return errors;
  }
};

/**
 * Data aggregation utilities
 */
export const DataAggregation = {
  /**
   * Compare multiple compounds
   */
  compareCompounds: (compounds) => {
    if (!Array.isArray(compounds) || compounds.length < 2) return null;

    const analyses = compounds.map(c => c.result?.analysis);
    
    return {
      topScored: compounds.reduce((best, curr) => {
        const currScore = curr.result?.summary?.overallScore || 0;
        const bestScore = best.result?.summary?.overallScore || 0;
        return currScore > bestScore ? curr : best;
      }),
      topAntibioticLike: compounds.reduce((best, curr) => {
        const currAL = curr.result?.summary?.antibioticLikeness || 0;
        const bestAL = best.result?.summary?.antibioticLikeness || 0;
        return currAL > bestAL ? curr : best;
      }),
      lowestResistanceRisk: compounds.filter(c => 
        c.result?.summary?.resistanceRisk === 'Low'
      )?.[0],
      averageScore: compounds.reduce((sum, c) => 
        sum + (c.result?.summary?.overallScore || 0), 0) / compounds.length
    };
  },

  /**
   * Group compounds by target class
   */
  groupByTargetClass: (compounds) => {
    if (!Array.isArray(compounds)) return {};
    return compounds.reduce((groups, compound) => {
      const target = compound.result?.summary?.primaryTarget || 'Unknown';
      if (!groups[target]) groups[target] = [];
      groups[target].push(compound);
      return groups;
    }, {});
  }
};
