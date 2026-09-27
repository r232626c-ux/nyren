const GENE_REGEX = /\b[A-Z0-9]{2,10}\b/g;

const extractGenes = (text = "") => {
  const matches = text.match(GENE_REGEX) || [];

  const blacklist = [
    "AND", "THE", "FOR", "WITH", "RNA", "DNA"
  ];

  return [...new Set(
    matches.filter(
      g => !blacklist.includes(g)
    )
  )];
};

module.exports = { extractGenes };