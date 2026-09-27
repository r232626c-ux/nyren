const express = require('express');
const { interpretCommand, translateText } = require('../services/aiService');

const router = express.Router();

router.post('/interpret', async (req, res) => {
  try {
    const text = req.body?.text;
    const context = req.body?.context || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string.' });
    }

    const result = await interpretCommand(text, context);

    return res.json(result);
  } catch (err) {
    console.error('[AI ROUTE] interpret error:', err.message || err);
    return res.status(500).json({
      error: 'Unable to interpret command at this time.',
    });
  }
});

router.post('/translate', async (req, res) => {
  try {
    const text = req.body?.text;
    const targetLang = req.body?.targetLang || 'Shona';

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string.' });
    }

    const translation = await translateText(text, targetLang);
    return res.json({ translation });
  } catch (err) {
    console.error('[AI ROUTE] translate error:', err.message || err);
    return res.status(500).json({
      error: 'Unable to translate text at this time.',
    });
  }
});

module.exports = router;
