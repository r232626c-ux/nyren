const express = require("express");
const { searchPubMed } = require("../services/pubmed.service.js");
const { searchArxiv } = require("../services/arxiv.service.js");
const { searchScholar } = require("../services/scholar.service.js");
const { synthesize } = require("../services/synthesis.service.js");
const { extractGenes } = require("../services/geneExtractor.service.js");
const { normalizePaper } = require("../utils/normalizePaper.js");

const router = express.Router();

router.post("/research/analyze", async (req, res) => {
  try {
    const { query, sources = ["pubmed", "arxiv"] } =
      req.body;

    let papers = [];

    if (sources.includes("pubmed")) {
      const pub = await searchPubMed(query);
      papers.push(...pub);
    }

    if (sources.includes("arxiv")) {
      const arx = await searchArxiv(query);
      papers.push(...arx);
    }

    papers = papers.map(normalizePaper);

    const synthesis = synthesize(papers);

    const genes = extractGenes(
      papers.map(p => p.title + " " + p.abstract).join(" ")
    );

    return res.json({
      success: true,
      query,
      papers,
      synthesis,
      genes,
      total: papers.length,
    });

  } catch (err) {
    console.log("ANALYSIS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/research/search-pubmed", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
        papers: [],
      });
    }

    const papers = await searchPubMed(query);

    return res.json({
      success: true,
      papers: papers.map(normalizePaper),
      source: "pubmed",
      count: papers.length,
    });
  } catch (err) {
    console.log("PUBMED SEARCH ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      papers: [],
    });
  }
});

router.post("/research/search-arxiv", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
        papers: [],
      });
    }

    const papers = await searchArxiv(query);

    return res.json({
      success: true,
      papers: papers.map(normalizePaper),
      source: "arxiv",
      count: papers.length,
    });
  } catch (err) {
    console.log("ARXIV SEARCH ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      papers: [],
    });
  }
});

router.post("/research/search-scholar", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
        papers: [],
      });
    }

    const papers = await searchScholar(query);

    return res.json({
      success: true,
      papers: papers.map(normalizePaper),
      source: "scholar",
      count: papers.length,
    });
  } catch (err) {
    console.log("SCHOLAR SEARCH ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      papers: [],
    });
  }
});

router.post("/research/search-multi", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
        results: {},
      });
    }

    console.log(`[RESEARCH] Multi-source search for: ${query}`);

    // Fetch from all sources in parallel
    const [pubmedPapers, arxivPapers, scholarPapers] = await Promise.all([
      searchPubMed(query).catch((err) => {
        console.error("[RESEARCH] PubMed search failed:", err.message);
        return [];
      }),
      searchArxiv(query).catch((err) => {
        console.error("[RESEARCH] arXiv search failed:", err.message);
        return [];
      }),
      searchScholar(query).catch((err) => {
        console.error("[RESEARCH] Scholar search failed:", err.message);
        return [];
      }),
    ]);

    const allPapers = [
      ...pubmedPapers,
      ...arxivPapers,
      ...scholarPapers,
    ].map(normalizePaper);

    // Remove duplicates by title (fuzzy match)
    const uniquePapers = [];
    const titles = new Set();

    for (const paper of allPapers) {
      const normalizedTitle = paper.title.toLowerCase().trim();
      if (!titles.has(normalizedTitle)) {
        titles.add(normalizedTitle);
        uniquePapers.push(paper);
      }
    }

    return res.json({
      success: true,
      results: {
        pubmed: pubmedPapers.length,
        arxiv: arxivPapers.length,
        scholar: scholarPapers.length,
      },
      papers: uniquePapers.slice(0, 30),
      total: uniquePapers.length,
    });
  } catch (err) {
    console.log("MULTI-SEARCH ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      results: {},
      papers: [],
    });
  }
});

router.post("/research/synthesize", async (req, res) => {
  try {
    const { papers = [] } = req.body;

    const synthesis = synthesize(papers);

    return res.json({
      success: true,
      synthesis,
    });
  } catch (err) {
    console.log("SYNTHESIS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      synthesis: {},
    });
  }
});

module.exports = router;