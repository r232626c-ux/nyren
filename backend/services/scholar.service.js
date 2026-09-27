const axios = require("axios");

// Semantic Scholar API (free, no key required)
const SCHOLAR_API = "https://api.semanticscholar.org/graph/v1/paper";

const searchScholar = async (query) => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    console.log(`[SCHOLAR] Searching for: ${query}`);

    const response = await axios.get("https://api.semanticscholar.org/graph/v1/paper/search", {
      params: {
        query: query,
        limit: 15,
        fields: "paperId,title,abstract,year,authors,venue,citationCount,openAccessPdf",
      },
      timeout: 10000,
    });

    const papers = (response.data?.data || [])
      .filter((p) => p.title && p.paperId)
      .map((paper) => ({
        title: paper.title || "Untitled",
        abstract: paper.abstract || "No abstract available",
        source: "scholar",
        year: paper.year || null,
        authors: (paper.authors || [])
          .slice(0, 5)
          .map((a) => a.name || a),
        journal: paper.venue || "Academic Paper",
        paperId: paper.paperId,
        url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
        citations: paper.citationCount || 0,
        pdfUrl: paper.openAccessPdf?.url || null,
      }));

    console.log(`[SCHOLAR] Found ${papers.length} papers`);
    return papers;
  } catch (err) {
    console.error(`[SCHOLAR ERROR]: ${err.message}`);
    return [];
  }
};

module.exports = { searchScholar };
