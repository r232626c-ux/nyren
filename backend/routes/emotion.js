const express = require('express');
const router = express.Router();
const { detectEmotion } = require('../utils/emotionDetector');
const EmotionalMemory = require('../models/EmotionalMemory');
const { getOrCreateUserByExternalId } = require('../utils/userUuidHelper');

router.post('/analyze', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const emotion = await detectEmotion(text);

    if (userId) {
      const user = await getOrCreateUserByExternalId(userId, {
        name: `User_${userId}`,
        email: `${userId}@coli.local`,
      });
      await EmotionalMemory.create({
        userId: user.id, // Use integer id
        mood: emotion,
        tone: 'analyzed',
        trigger: text,
        response: `Detected emotion: ${emotion}`,
      });
    }

    res.json({ emotion });
  } catch (error) {
    console.error('Emotion analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bond/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getOrCreateUserByExternalId(userId, {
      name: 'Nyx User',
      email: `${userId}@nyx.local`,
    });

    res.json({ bondLevel: user.bondLevel || 0 });
  } catch (error) {
    console.error('Get bond level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bond/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { increment } = req.body;
    const change = typeof increment === 'number' ? increment : 0.1;

    const user = await getOrCreateUserByExternalId(userId, {
      name: 'Nyx User',
      email: `${userId}@nyx.local`,
    });

    user.bondLevel = (user.bondLevel || 0) + change;
    await user.save();

    res.json({ bondLevel: user.bondLevel });
  } catch (error) {
    console.error('Update bond level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;