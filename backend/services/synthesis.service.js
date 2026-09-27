const synthesize = (papers = []) => {
  if (!papers.length) {
    return {
      hypothesis:
        "No sufficient literature found.",
      mechanisms: [],
      summary: "",
    };
  }

  const keywords = new Set();
  const mechanisms = [];

  for (const p of papers) {
    if (p.title) {
      const words = p.title.split(" ");
      words.forEach(w => {
        if (w.length > 6) keywords.add(w);
      });
    }

    if (p.abstract) {
      if (p.abstract.includes("mutation"))
        mechanisms.push("genetic mutation");

      if (p.abstract.includes("expression"))
        mechanisms.push("gene expression regulation");

      if (p.abstract.includes("pathway"))
        mechanisms.push("signaling pathway disruption");
    }
  }

  return {
    hypothesis: `Integrated model suggests ${[
      ...keywords,
    ].slice(0, 6).join(", ")} may contribute to disease progression.`,

    mechanisms: [...new Set(mechanisms)],

    summary:
      "Cross-study synthesis of PubMed + arXiv biomedical literature.",
  };
};

module.exports = { synthesize };