const express = require('express');
const { searchInternet, consensusSearch, searchScholar, searchTavily } = require('../services/searchServiceEnhanced');
const { getOrCreateUserByExternalId } = require('../utils/userUuidHelper');

const router = express.Router();

/**
 * POST /api/search
 * ✨ Enhanced multi-source research engine (Perplexity + Consensus + NotebookLM)
 * 
 * Modes:
 * - 'search': Standard internet search with AI summaries
 * - 'consensus': Analyze agreement across academic + web sources
 * - 'scholar': Google Scholar + Academic papers focus
 * - 'web': Web-focused search with Tavily
 * 
 * Request body:
 * {
 *   "query": "quantum computing applications",
 *   "userId": "user123",
 *   "mode": "search" // optional
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { query, userId, mode = 'search' } = req.body;

    // Validation
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required and cannot be empty' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: 'Coli User',
      email: `${userId}@coli.local`,
    });

    console.log(`[SEARCH ROUTE] Mode: ${mode}, Query: ${query}`);

    let result;

    // Route to appropriate search function
    switch (mode) {
      case 'consensus':
        result = await consensusSearch(query);
        break;

      case 'scholar':
        result = await searchScholar(query);
        break;

      case 'web':
        result = await searchTavily(query);
        break;

      case 'search':
      default:
        // Standard internet search (all sources combined)
        result = await searchInternet(query);
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
      status: 'error',
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/search/health
 * Health check for search service and API configuration
 */
router.get('/health', (req, res) => {
  const apiStatus = {
    serpapi: process.env.SERP_API_KEY && process.env.SERP_API_KEY !== 'your_serpapi_key_here' ? '✅ Ready' : '⚠️ Not configured',
    tavily: process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_key_here' ? '✅ Ready' : '⚠️ Not configured',
    semanticScholar: '✅ Available (free)',
    crossref: '✅ Available (free)',
    openalex: '✅ Available (free)',
  };

  res.json({
    status: 'OK',
    service: 'search-engine',
    timestamp: new Date().toISOString(),
    apis: apiStatus,
    features: [
      '📖 Google Scholar',
      '🌐 Tavily Web Search',
      '🎓 Semantic Scholar',
      '📄 CrossRef',
      '🔬 OpenAlex',
      '💡 AI Summaries',
      '📊 Consensus Analysis',
    ],
  });
});

/**
 * POST /api/search/index
 * Get available search modes and capabilities
 */
router.post('/index', (req, res) => {
  res.json({
    status: 'success',
    availableModes: {
      search: 'Combined search across all sources (default)',
      consensus: 'Consensus analysis with agreement scoring',
      scholar: 'Google Scholar academic papers focus',
      web: 'Web-focused search with Tavily AI summaries',
    },
    supportedQueries: [
      'What are the latest developments in machine learning?',
      'Compare different approaches to quantum error correction',
      'What do recent studies say about climate change?',
    ],
  });
});

module.exports = router;
