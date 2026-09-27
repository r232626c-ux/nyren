/**
 * Antibacterial API Routes
 * Non-breaking integration with existing Coli API
 */

const express = require('express');
const router = express.Router();
const AntibacterialAnalysisController = require('../services/AntibacterialAnalysisController');

/**
 * POST /api/scientific/antibacterial/analyze
 * Complete antibacterial analysis workflow
 */
router.post('/analyze', async (req, res) => {
  try {
    const { smiles } = req.body;

    if (!smiles || typeof smiles !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SMILES required',
      });
    }

    const result = await AntibacterialAnalysisController.analyzeCompound(smiles);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[AntibacterialRoutes] analyze error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Antibacterial analysis failed',
      fallback: true,
      data: {
        descriptors: {},
        targetPrediction: {
          predictedClass: "unknown",
          confidence: 0
        }
      }
    });
  }
});

/**
 * POST /api/scientific/antibacterial/predict-target
 * Predict target class only (lightweight)
 */
router.post('/predict-target', async (req, res) => {
  try {
    const { smiles } = req.body;

    if (!smiles || typeof smiles !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SMILES required',
      });
    }

    const prediction = await AntibacterialAnalysisController.predictTargetClass(smiles);

    return res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('[AntibacterialRoutes] predict-target error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Prediction failed',
      fallback: true,
      data: {
        predictedClass: "unknown",
        confidence: 0
      }
    });
  }
});

/**
 * POST /api/scientific/antibacterial/score-likeness
 * Score antibiotic-likeness
 */
router.post('/score-likeness', async (req, res) => {
  try {
    const { smiles, targetClass = 'proteinTargeting' } = req.body;

    if (!smiles || typeof smiles !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SMILES required',
      });
    }

    const score = await AntibacterialAnalysisController.scoreAntibioticLikeness(smiles, targetClass);

    return res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    console.error('[AntibacterialRoutes] score-likeness error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Scoring failed',
      fallback: true,
      data: {
        score: 0,
        confidence: 0,
        passed: false
      }
    });
  }
});

/**
 * POST /api/scientific/antibacterial/analyze-resistance
 * Analyze resistance risk
 */
router.post('/analyze-resistance', async (req, res) => {
  try {
    const { smiles } = req.body;

    if (!smiles || typeof smiles !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SMILES required',
      });
    }

    const analysis = await AntibacterialAnalysisController.analyzeResistance(smiles);

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('[AntibacterialRoutes] analyze-resistance error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Analysis failed',
      fallback: true,
      data: {
        scaffoldNovelty: { score: 0 },
        knownSimilarity: { score: 0 },
        overallResistanceRisk: 0
      }
    });
  }
});

/**
 * POST /api/scientific/antibacterial/optimize
 * Generate optimization recommendations
 */
router.post('/optimize', async (req, res) => {
  try {
    const { smiles } = req.body;

    if (!smiles || typeof smiles !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SMILES required',
      });
    }

    const optimization = await AntibacterialAnalysisController.optimizeCompound(smiles);

    return res.json({
      success: true,
      data: optimization,
    });
  } catch (error) {
    console.error('[AntibacterialRoutes] optimize error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Optimization failed',
      fallback: true,
      data: {
        recommendations: [],
        score: 0
      }
    });
  }
});

/**
 * GET /api/scientific/antibacterial/health
 * Health check for antibacterial system
 */
router.get('/health', (req, res) =>  {
  return res.json({
    status: 'healthy',
    module: 'antibacterial-intelligence',
    version: '1.0.0',
    capabilities: [
      'descriptor-calculation',
      'target-prediction',
      'antibiotic-likeness-scoring',
      'ribosome-binding-analysis',
      'resistance-analysis',
      'lead-optimization',
    ],
  });
});

module.exports = router;
