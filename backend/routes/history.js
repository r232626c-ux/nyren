const express = require('express');
const router = express.Router();
const { getConversationHistory, clearConversationHistory } = require('../services/memoryService');

/**
 * GET /api/history/:userId
 * Get conversation history for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const history = await getConversationHistory(userId, parseInt(limit));

    // Format for frontend consumption
    const formattedHistory = history.map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      message: conv.message,
      coli_response: conv.coli_response,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    res.json({
      status: 'success',
      history: formattedHistory,
      count: formattedHistory.length,
    });
  } catch (error) {
    console.error('[History] Error fetching conversation history:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation history',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/history/:userId
 * Clear conversation history for a user
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const deletedCount = await clearConversationHistory(userId);

    res.json({
      status: 'success',
      message: `Cleared ${deletedCount} conversations`,
      deletedCount,
    });
  } catch (error) {
    console.error('[History] Error clearing conversation history:', error);
    res.status(500).json({
      error: 'Failed to clear conversation history',
      message: error.message,
    });
  }
});

/**
 * GET /api/history/:userId/context
 * Get conversation context for AI processing
 */
router.get('/:userId/context', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Import the context function
    const { getConversationContext } = require('../services/memoryService');
    const context = await getConversationContext(userId, parseInt(limit));

    res.json({
      status: 'success',
      context,
      userId,
    });
  } catch (error) {
    console.error('[History] Error fetching conversation context:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation context',
      message: error.message,
    });
  }
});

module.exports = router;