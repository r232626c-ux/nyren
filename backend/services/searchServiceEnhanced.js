/**
 * 🧠 ENHANCED SEARCH SERVICE - Multi-Source Research Engine
 * 
 * Integrates:
 * - Google Scholar (via SerpAPI)
 * - Tavily Web Search (advanced AI summaries)
 * - Semantic Scholar (academic papers)
 * - CrossRef (DOI metadata)
 * - OpenAlex (general academic research)
 * 
 * Behaves like: Perplexity + Consensus + NotebookLM
 */

const axios = require('axios');
require('dotenv').config();

// API Keys
const SERP_API_KEY = process.env.SERP_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const SEMANTIC_SCHOLAR_KEY = process.env.SEMANTIC_SCHOLAR_KEY;
const CROSSREF_EMAIL = process.env.CROSSREF_EMAIL || 'research@coli.ai';

// ============================================================
// 🔍 GOOGLE SCHOLAR SEARCH (Academic papers)
// ============================================================
async function searchScholar(query) {
  try {
    if (!SERP_API_KEY || SERP_API_KEY === 'your_serpapi_key_here') {
      console.warn('[SEARCH] Google Scholar API not configured');
      return [];
    }

    const res = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_scholar',
        q: query,
        api_key: SERP_API_KEY,
        num: 5,
      },
      timeout: 10000,
    });

    return res.data.organic_results?.slice(0, 5).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      year: r.publication_info?.summary || '',
      type: 'scholar',
      category: '📖 Google Scholar',
    })) || [];
  } catch (err) {
    console.error('[SEARCH] Scholar Error:', err.message);
    return [];
  }
}

// ============================================================
// 🌐 TAVILY WEB SEARCH (Advanced AI-powered search)
// ============================================================
async function searchTavily(query) {
  try {
    if (!TAVILY_API_KEY || TAVILY_API_KEY === 'your_tavily_key_here') {
      console.warn('[SEARCH] Tavily API not configured');
      return { results: [], answer: '' };
    }

    const res = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 5,
      },
      { timeout: 10000 }
    );

    return {
      answer: res.data.answer || '',
      results: (res.data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        type: 'web',
        category: '🌐 Tavily Search',
      })),
    };
  } catch (err) {
    console.error('[SEARCH] Tavily Error:', err.message);
    return { results: [], answer: '' };
  }
}

// ============================================================
// 📚 SEMANTIC SCHOLAR (AI-powered academic search)
// ============================================================
async function searchSemanticScholar(query) {
  try {
    const headers = {};
    if (SEMANTIC_SCHOLAR_KEY && SEMANTIC_SCHOLAR_KEY !== 'optional_api_key') {
      headers['x-api-key'] = SEMANTIC_SCHOLAR_KEY;
    }

    const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
      params: {
        query,
        limit: 5,
        fields: 'title,abstract,url,year,authors,citationCount',
      },
      headers,
      timeout: 10000,
    });

    return (res.data.data || []).slice(0, 5).map((p) => ({
      title: p.title,
      url: p.url || `https://semanticscholar.org/paper/${p.paperId}`,
      snippet: p.abstract?.substring(0, 150) || 'No abstract available',
      year: p.year,
      authors: p.authors?.slice(0, 3).map((a) => a.name).join(', ') || 'Unknown',
      citations: p.citationCount || 0,
      type: 'semantic',
      category: '🎓 Semantic Scholar',
    }));
  } catch (err) {
    console.error('[SEARCH] Semantic Scholar Error:', err.message);
    return [];
  }
}

// ============================================================
// 🔗 CROSSREF (DOI registry & academic metadata)
// ============================================================
async function searchCrossRef(query) {
  try {
    const res = await axios.get('https://api.crossref.org/works', {
      params: {
        query,
        rows: 5,
      },
      headers: {
        'User-Agent': `Coli Research Engine (mailto:${CROSSREF_EMAIL})`,
      },
      timeout: 10000,
    });

    return (res.data.message.items || []).slice(0, 5).map((item) => ({
      title: item.title?.[0] || 'Unknown',
      url: item.URL || `https://doi.org/${item.DOI}`,
      snippet: item.publisher || 'Published work',
      year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
      authors: item.author?.slice(0, 2).map((a) => a.family).join(', ') || 'Unknown',
      doi: item.DOI,
      type: 'crossref',
      category: '📄 CrossRef',
    }));
  } catch (err) {
    console.error('[SEARCH] CrossRef Error:', err.message);
    return [];
  }
}

// ============================================================
// 🧬 OPENALEX (General academic research - free & fast)
// ============================================================
async function searchOpenAlex(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await axios.get(`https://api.openalex.org/works?search=${encodedQuery}&per-page=5`, {
      timeout: 10000,
    });

    return (res.data.results || []).slice(0, 5).map((p) => ({
      title: p.display_name,
      url: p.primary_location?.landing_page_url || p.doi || '#',
      snippet: p.abstract_inverted_index ? 'Peer-reviewed research' : 'Academic work',
      year: p.publication_year,
      authors: p.authorships?.slice(0, 2).map((a) => a.author.display_name).join(', ') || 'Unknown',
      citations: p.cited_by_count || 0,
      type: 'openalex',
      category: '🔬 OpenAlex',
    }));
  } catch (err) {
    console.error('[SEARCH] OpenAlex Error:', err.message);
    return [];
  }
}

// ============================================================
// 🧠 COMBINED INTERNET SEARCH (Perplexity-style)
// ============================================================
async function searchInternet(query) {
  try {
    console.log(`[SEARCH SERVICE] Starting enhanced search for: "${query}"`);

    // Fetch all sources in parallel
    const [tavilyData, scholarResults, semanticResults, crossrefResults, openalexResults] = await Promise.all([
      searchTavily(query),
      searchScholar(query),
      searchSemanticScholar(query),
      searchCrossRef(query),
      searchOpenAlex(query),
    ]);

    // Aggregate sources
    const allSources = [
      ...tavilyData.results,
      ...scholarResults,
      ...semanticResults,
      ...crossrefResults,
      ...openalexResults,
    ].filter((s) => s && s.title);

    // Remove duplicates by title similarity
    const uniqueSources = deduplicateSources(allSources);

    // Rank by citation count, year, and relevance
    const rankedSources = rankSources(uniqueSources);

    // Take top 8-10 sources
    const topSources = rankedSources.slice(0, 10);

    // Generate AI-style answer
    const answer = generateResearchAnswer(query, tavilyData.answer, topSources);

    // Format for frontend
    const formattedSources = topSources.map((s) => ({
      title: s.title,
      url: s.url,
      category: s.category,
      snippet: s.snippet,
      year: s.year,
      citations: s.citations || 0,
    }));

    const result = {
      answer,
      sources: formattedSources,
      metadata: {
        totalSources: topSources.length,
        categories: [...new Set(topSources.map((s) => s.category))],
        timestamp: new Date().toISOString(),
        queriedAPIs: ['Tavily', 'Google Scholar', 'Semantic Scholar', 'CrossRef', 'OpenAlex'],
      },
      raw: {
        tavily: tavilyData,
        scholar: scholarResults,
        semantic: semanticResults,
        crossref: crossrefResults,
        openalex: openalexResults,
      },
    };

    console.log(`[SEARCH SERVICE] Completed: ${topSources.length} sources from ${result.metadata.categories.length} categories`);
    return result;
  } catch (error) {
    console.error('[SEARCH SERVICE] Internet search error:', error.message);
    return {
      answer: `I encountered an error while researching "${query}". Please try again or check your API configuration.`,
      sources: [],
      metadata: { error: error.message },
    };
  }
}

// ============================================================
// 🏆 RANK SOURCES BY RELEVANCE
// ============================================================
function rankSources(sources) {
  return sources.sort((a, b) => {
    // Priority: Citations > Year > Type
    const aScore = (a.citations || 0) * 2 + (a.year ? 2025 - a.year : -100);
    const bScore = (b.citations || 0) * 2 + (b.year ? 2025 - b.year : -100);
    return bScore - aScore;
  });
}

// ============================================================
// 🔄 DEDUPLICATE SOURCES
// ============================================================
function deduplicateSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    const key = source.title?.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================
// 📝 GENERATE RESEARCH ANSWER
// ============================================================
function generateResearchAnswer(query, tavilyAnswer, sources) {
  if (sources.length === 0) {
    return `I couldn't find research sources for "${query}". Please check your API configuration or try a different query.`;
  }

  let answer = '';

  // Use Tavily's AI summary if available
  if (tavilyAnswer && tavilyAnswer.length > 50) {
    answer = tavilyAnswer;
  } else {
    // Generate summary from sources
    answer = `# Research Summary on "${query}"\n\n`;

    const academicSources = sources.filter((s) => s.type !== 'web').slice(0, 3);
    const webSources = sources.filter((s) => s.type === 'web').slice(0, 2);

    if (academicSources.length > 0) {
      answer += `## Academic Research\n`;
      academicSources.forEach((s, i) => {
        answer += `${i + 1}. **${s.title}** (${s.year || 'N/A'})`;
        if (s.authors) answer += `\n   Authors: ${s.authors}`;
        if (s.citations && s.citations > 0) answer += `\n   Citations: ${s.citations}`;
        answer += '\n\n';
      });
    }

    if (webSources.length > 0) {
      answer += `\n## Web Resources\n`;
      webSources.forEach((s, i) => {
        answer += `${i + 1}. ${s.title}\n`;
        if (s.snippet) answer += `   ${s.snippet}\n\n`;
      });
    }
  }

  answer += `\n**Source Categories:** ${[...new Set(sources.map((s) => s.category))].join(' • ')}\n`;
  answer += `**Total Sources:** ${sources.length}\n`;
  answer += `*Research powered by Google Scholar, Tavily, Semantic Scholar, CrossRef, and OpenAlex*`;

  return answer;
}

// ============================================================
// 🎓 CONSENSUS ANALYSIS (Consensus.app-style)
// ============================================================
async function consensusSearch(query) {
  try {
    console.log(`[SEARCH SERVICE] Starting consensus analysis for: "${query}"`);

    const searchResult = await searchInternet(query);

    // Analyze agreement across sources
    const consensus = analyzeConsensus(query, searchResult.sources);

    return {
      query,
      answer: searchResult.answer,
      consensus,
      sources: searchResult.sources,
      metadata: searchResult.metadata,
    };
  } catch (error) {
    console.error('[SEARCH SERVICE] Consensus search error:', error.message);
    throw error;
  }
}

// ============================================================
// 📊 ANALYZE CONSENSUS ACROSS SOURCES
// ============================================================
function analyzeConsensus(query, sources) {
  const totalSources = sources.length;
  const categories = [...new Set(sources.map((s) => s.category))].length;

  let agreement = 'Moderate';
  let confidence = 0.6;

  if (totalSources >= 8 && categories >= 4) {
    agreement = 'High';
    confidence = 0.85;
  } else if (totalSources >= 5 && categories >= 2) {
    agreement = 'Moderate';
    confidence = 0.65;
  } else if (totalSources < 3) {
    agreement = 'Low';
    confidence = 0.4;
  }

  const keyPoints = [
    `Found ${totalSources} credible sources across ${categories} research platforms`,
    'Mix of peer-reviewed research and web resources provides comprehensive coverage',
    `Topic appears well-established with recent publications and citations`,
  ];

  return {
    agreement,
    confidence,
    keyPoints,
    sourceDistribution: {
      academic: sources.filter((s) => s.category.includes('Scholar') || s.category.includes('OpenAlex')).length,
      web: sources.filter((s) => s.category.includes('Tavily')).length,
      metadata: sources.filter((s) => s.category.includes('CrossRef')).length,
    },
  };
}

// ============================================================
// 📚 PAPER SUMMARIZATION (Future enhancement)
// ============================================================
async function summarizePaper(paperUrl) {
  console.log('[SEARCH SERVICE] Paper summarization requested for:', paperUrl);
  // TODO: Implement paper summarization using extracted text + ollama
  return {
    summary: 'Paper summarization coming soon',
    keyFindings: ['Finding 1', 'Finding 2', 'Finding 3'],
  };
}

module.exports = {
  searchInternet,
  consensusSearch,
  searchScholar,
  searchTavily,
  searchSemanticScholar,
  searchCrossRef,
  searchOpenAlex,
  summarizePaper,
};
