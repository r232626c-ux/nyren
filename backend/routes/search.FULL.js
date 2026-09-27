/**
 * UPDATED SEARCH ROUTE
 * 
 * Endpoints:
 * - POST /api/search — Web + Academic search
 * - POST /api/search (mode=consensus) — Consensus analysis
 * - GET /api/search/health — API status check
 */

const express = require('express');
const { searchAI, consensusSearch } = require('../services/searchService');
const { getOrCreateUserByExternalId } = require('../utils/userUuidHelper');

const router = express.Router();

/**
 * POST /api/search
 * Standard search mode (Perplexity-style with real APIs)
 * 
 * Usage:
 * curl -X POST http://localhost:5000/api/search \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "query": "machine learning",
 *     "userId": "user-123",
 *     "mode": "search"
 *   }'
 */
router.post('/', async (req, res) => {
  try {
    const { query, userId, mode = 'search' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: 'Coli User',
      email: `${userId}@coli.local`,
    });

    let result;

    if (mode === 'consensus') {
      result = await consensusSearch(query);
    } else {
      result = await searchAI(query);
    }

    res.json({
      status: 'success',
      mode,
      query,
      ...result,
    });
  } catch (error) {
    console.error('[SEARCH ROUTE] Error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/search/health
 * Health check for search service and API availability
 * 
 * Usage:
 * curl http://localhost:5000/api/search/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'search',
    apis: {
      serpapi: process.env.SERP_API_KEY && process.env.SERP_API_KEY !== 'your_serpapi_key_here' ? 'configured' : 'not configured',
      openalex: 'available (free, no key needed)'
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
