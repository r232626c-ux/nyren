const express = require('express');
const router = express.Router();
const { textToSpeech } = require('../services/elevenlabs');

router.get('/', async (req, res) => {
  try {
    const { text, voice } = req.query;

    if (!text) {
      return res.status(400).json({ error: 'Text query parameter is required' });
    }

    const audioBuffer = await textToSpeech(text, { voice });

    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-store');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS route error:', error.message);
    res.status(500).json({ error: 'Unable to generate speech audio' });
  }
});

module.exports = router;
