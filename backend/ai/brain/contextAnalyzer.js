const { detectDomain } = require("./domainClassifier");
const { estimateDepth } = require("./depthEstimator");

function analyzeContext(message) {
  const domain = detectDomain(message);
  const depth = estimateDepth(message);

  return {
    domain,   // bio | coding | general
    depth,    // low | medium | high
  };
}

module.exports = { analyzeContext };