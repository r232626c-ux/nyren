const express = require('express');
const router = express.Router();
const { generatePredictions, getRecentPredictions, updatePredictionOutcome } = require('../utils/trendPredictor');
const TrendHistory = require('../models/TrendHistory');

router.get('/', async (req, res) => {
  try {
    const predictions = await getRecentPredictions(10);
    res.json(predictions);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const prediction = await generatePredictions();
    if (prediction) {
      res.json(prediction);
    } else {
      res.status(500).json({ error: 'Failed to generate prediction' });
    }
  } catch (error) {
    console.error('Generate trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/outcome', async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    await updatePredictionOutcome(id, outcome);
    res.json({ success: true });
  } catch (error) {
    console.error('Update prediction outcome error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;