const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const EmotionalMemory = require('../models/EmotionalMemory');
const ResearchMemory = require('../models/ResearchMemory');

router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await Conversation.find({ userId }).sort({ timestamp: -1 }).limit(50);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/emotional/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const emotions = await EmotionalMemory.find({ userId }).sort({ timestamp: -1 }).limit(20);
    res.json(emotions);
  } catch (error) {
    console.error('Get emotional memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/research/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const research = await ResearchMemory.find({ userId }).sort({ timestamp: -1 }).limit(10);
    res.json(research);
  } catch (error) {
    console.error('Get research memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/research/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { ideas, experiments, notes } = req.body;

    const researchEntry = new ResearchMemory({
      userId,
      ideas,
      experiments,
      notes
    });

    await researchEntry.save();
    res.json(researchEntry);
  } catch (error) {
    console.error('Save research memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;