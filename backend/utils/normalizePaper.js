const normalizePaper = (p = {}) => ({
  title: p.title || "Untitled",
  abstract: p.abstract || "",
  source: p.source || "unknown",
  year: p.year || null,
  authors: p.authors || [],
  journal: p.journal || "",
  pmid: p.pmid || null,
  url: p.url || null,
  pdfUrl: p.pdfUrl || p.openAccessPdf?.url || null,
  doi: p.doi || null,
  paperId: p.paperId || null,
});

module.exports = { normalizePaper };