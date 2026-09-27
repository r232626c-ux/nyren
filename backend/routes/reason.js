/**
 * Unified Reason Route
 * Deep reasoning + step-by-step analysis using centralized aiService
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const Conversation = require('../models/Conversation');

/**
 * POST /api/reason
 * Deep reasoning with step-by-step analysis
 * 
 * Request: { query: string, userId: string }
 * Response: { answer: string, reasoning: array, status: string }
 */
router.post('/', async (req, res) => {
  try {
    const { query, userId, message } = req.body;

    // Support both 'query' and 'message' field names for compatibility
    const actualQuery = query || message;

    if (!actualQuery || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Query and userId are required',
      });
    }

    console.log(`[REASON ROUTE] Query: "${actualQuery}" for user: ${userId}`);

    // Use unified service in reason mode
    const result = await aiService.processMessage(actualQuery, userId, 'reason');

    // Save to conversation history
    try {
      const conversation = new Conversation({
        userId,
        message: actualQuery,
        coli_response: result.answer,
        reasoning: result.reasoning || [],
      });
      await conversation.save();
    } catch (dbError) {
      console.warn('[REASON ROUTE] DB save warning:', dbError.message);
    }

    res.json({
      status: result.status || 'success',
      answer: result.answer,
      reasoning: result.reasoning || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[REASON ROUTE] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Reasoning failed',
    });
  }
});

module.exports = router;
