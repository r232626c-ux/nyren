const axios = require("axios");

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

const searchPubMed = async (query) => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    console.log(`[PUBMED] Searching for: ${query}`);

    // Step 1: Search for IDs
    const searchRes = await axios.get(`${BASE}/esearch.fcgi`, {
      params: {
        db: "pubmed",
        term: query,
        retmode: "json",
        retmax: 15,
        sort: "relevance",
      },
      timeout: 10000,
    });

    const ids = searchRes.data?.esearchresult?.idlist || [];

    if (!ids.length) {
      console.log(`[PUBMED] No results for: ${query}`);
      return [];
    }

    console.log(`[PUBMED] Found ${ids.length} papers, fetching details...`);

    // Step 2: Fetch summaries
    const summaryRes = await axios.get(`${BASE}/esummary.fcgi`, {
      params: {
        db: "pubmed",
        id: ids.join(","),
        retmode: "json",
        retmax: 15,
      },
      timeout: 10000,
    });

    const results = Object.values(summaryRes.data.result || {})
      .filter((x) => x && x.uid)
      .map((paper) => ({
        title: paper.title || "Untitled",
        abstract: paper.abstracttext || paper.abstract || "No abstract available",
        source: "pubmed",
        year: paper.pubdate ? new Date(paper.pubdate).getFullYear() : null,
        authors: paper.authors
          ? paper.authors.slice(0, 5).map((a) => a.name || a.Author)
          : [],
        journal: paper.fulljournalname || paper.source || "",
        pmid: paper.uid,
        url: `https://pubmed.ncbi.nlm.nih.gov/${paper.uid}/`,
        doi: paper.doi || null,
      }));

    console.log(`[PUBMED] Fetched ${results.length} papers successfully`);
    return results;
  } catch (err) {
    console.error(`[PUBMED ERROR]: ${err.message}`);
    return [];
  }
};

module.exports = { searchPubMed };