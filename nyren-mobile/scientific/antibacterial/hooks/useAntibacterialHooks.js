import { useState, useCallback } from 'react';
import { AntibacterialAPI } from '../services/AntibacterialAPI';

/**
 * useAntibacterialAnalysis - Main hook for compound analysis
 * Handles SMILES input → full analysis orchestration → result caching
 */
export function useAntibacterialAnalysis() {
  const [smiles, setSmiles] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const analyze = useCallback(async (smilesString) => {
    if (!smilesString.trim()) {
      setError('Please enter a valid SMILES string');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate SMILES format (basic check)
      if (!/^[A-Za-z0-9\(\)\[\]=#\\\/\-@+]+$/.test(smilesString)) {
        throw new Error('Invalid SMILES format. Use standard SMILES notation.');
      }

      const result = await AntibacterialAPI.analyzeCompound(smilesString);
      setAnalysisResult(result.data);
      setSmiles(smilesString);

      // Add to history
      setHistory(prev => [
        { smiles: smilesString, result: result.data, timestamp: new Date() },
        ...prev.slice(0, 9) // Keep last 10
      ]);

      return result.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Analysis failed';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const loadFromHistory = useCallback((item) => {
    setAnalysisResult(item.result);
    setSmiles(item.smiles);
  }, []);

  return {
    smiles,
    setSmiles,
    analysisResult,
    setAnalysisResult,
    loading,
    error,
    history,
    analyze,
    clearHistory,
    loadFromHistory,
  };
}

/**
 * useTargetPrediction - Hook for isolated target class prediction
 */
export function useTargetPrediction() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (smiles) => {
    setLoading(true);
    setError(null);

    try {
      const result = await AntibacterialAPI.predictTargetClass(smiles);
      setPrediction(result.data);
      return result.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Prediction failed';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { prediction, loading, error, predict };
}

/**
 * useAntibioticLikenessScore - Hook for antibiotic-likeness scoring
 */
export function useAntibioticLikenessScore() {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scoreCompound = useCallback(async (smiles, targetClass) => {
    setLoading(true);
    setError(null);

    try {
      const result = await AntibacterialAPI.scoreAntibioticLikeness(smiles, targetClass);
      setScore(result.data);
      return result.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Scoring failed';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { score, loading, error, scoreCompound };
}

/**
 * useResistanceAnalysis - Hook for resistance risk analysis
 */
export function useResistanceAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (smiles) => {
    setLoading(true);
    setError(null);

    try {
      const result = await AntibacterialAPI.analyzeResistance(smiles);
      setAnalysis(result.data);
      return result.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Analysis failed';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analysis, loading, error, analyze };
}

/**
 * useOptimizationEngine - Hook for lead optimization recommendations
 */
export function useOptimizationEngine() {
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const optimize = useCallback(async (smiles) => {
    setLoading(true);
    setError(null);

    try {
      const result = await AntibacterialAPI.optimizeCompound(smiles);
      setOptimization(result.data);
      return result.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Optimization failed';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { optimization, loading, error, optimize };
}

/**
 * useServiceHealth - Hook to check API health
 */
export function useServiceHealth() {
  const [isHealthy, setIsHealthy] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = useCallback(async () => {
    setLoading(true);

    try {
      const result = await AntibacterialAPI.healthCheck();
      setIsHealthy(result.status === 'ok');
    } catch (err) {
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isHealthy, loading, checkHealth };
}

/**
 * useCompoundComparison - Hook for comparing multiple compounds
 */
export function useCompoundComparison() {
  const [compounds, setCompounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addCompound = useCallback(async (smiles, label = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await AntibacterialAPI.analyzeCompound(smiles);
      setCompounds(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        label: label || smiles.substring(0, 20),
        smiles,
        result: result.data
      }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add compound';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCompound = useCallback((id) => {
    setCompounds(prev => prev.filter(c => c.id !== id));
  }, []);

  const clearCompounds = useCallback(() => {
    setCompounds([]);
  }, []);

  return {
    compounds,
    loading,
    error,
    addCompound,
    removeCompound,
    clearCompounds
  };
}

/**
 * useDescriptorValidation - Hook for real-time descriptor validation
 */
export function useDescriptorValidation() {
  const [validation, setValidation] = useState({
    mw: { valid: true, message: '' },
    logp: { valid: true, message: '' },
    tpsa: { valid: true, message: '' },
    hbd: { valid: true, message: '' },
    hba: { valid: true, message: '' },
  });

  const validateDescriptors = useCallback((descriptors) => {
    const newValidation = {};

    // MW validation (200-600 typical for drugs)
    newValidation.mw = {
      valid: descriptors.mw >= 150 && descriptors.mw <= 800,
      message: descriptors.mw >= 200 && descriptors.mw <= 600 ? 'Optimal range' : 'Outside typical range'
    };

    // LogP validation (-2 to 5 typical)
    newValidation.logp = {
      valid: descriptors.logp >= -3 && descriptors.logp <= 6,
      message: descriptors.logp >= -1 && descriptors.logp <= 4 ? 'Optimal range' : 'Outside typical range'
    };

    // TPSA validation
    newValidation.tpsa = {
      valid: descriptors.tpsa >= 0 && descriptors.tpsa <= 180,
      message: descriptors.tpsa >= 20 && descriptors.tpsa <= 130 ? 'Optimal range' : 'Outside typical range'
    };

    // HBD validation
    newValidation.hbd = {
      valid: descriptors.hbd >= 0 && descriptors.hbd <= 8,
      message: descriptors.hbd <= 5 ? 'Optimal' : 'High acceptor count'
    };

    // HBA validation
    newValidation.hba = {
      valid: descriptors.hba >= 0 && descriptors.hba <= 15,
      message: descriptors.hba <= 10 ? 'Optimal' : 'High donor count'
    };

    setValidation(newValidation);
    return newValidation;
  }, []);

  return { validation, validateDescriptors };
}

/**
 * useSmilesParser - Hook for basic SMILES parsing and validation
 */
export function useSmilesParser() {
  const validateSmiles = useCallback((smiles) => {
    if (!smiles || smiles.trim().length === 0) {
      return { valid: false, error: 'SMILES string cannot be empty' };
    }

    if (smiles.length > 500) {
      return { valid: false, error: 'SMILES string too long (max 500 characters)' };
    }

    // Basic SMILES validation - only allows valid characters
    const validChars = /^[A-Za-z0-9\(\)\[\]=#\\\/\-@+.]+$/;
    if (!validChars.test(smiles)) {
      return { valid: false, error: 'Invalid SMILES characters detected' };
    }

    // Check for balanced brackets
    const openBrackets = (smiles.match(/\[/g) || []).length;
    const closeBrackets = (smiles.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: 'Unbalanced brackets in SMILES' };
    }

    const openParens = (smiles.match(/\(/g) || []).length;
    const closeParens = (smiles.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { valid: false, error: 'Unbalanced parentheses in SMILES' };
    }

    return { valid: true };
  }, []);

  return { validateSmiles };
}

/**
 * useAnalysisCache - Hook for caching analysis results
 */
export function useAnalysisCache() {
  const [cache, setCache] = useState(new Map());

  const getCached = useCallback((smiles) => {
    return cache.get(smiles);
  }, [cache]);

  const setCached = useCallback((smiles, result) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(smiles, result);
      // Keep cache size manageable (max 50 entries)
      if (newCache.size > 50) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return { getCached, setCached, clearCache, cacheSize: cache.size };
}
