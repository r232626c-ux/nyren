function estimateDepth(message) {
  const len = message.length;

  if (len < 50) return "low";
  if (len < 150) return "medium";

  return "high";
}

module.exports = { estimateDepth };