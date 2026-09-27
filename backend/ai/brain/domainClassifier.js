function detectDomain(message) {
  const msg = message.toLowerCase();

  if (
    msg.includes("dna") ||
    msg.includes("gene") ||
    msg.includes("cancer") ||
    msg.includes("rna") ||
    msg.includes("genome") ||
    msg.includes("expression")
  ) {
    return "bio";
  }

  if (
    msg.includes("code") ||
    msg.includes("api") ||
    msg.includes("react") ||
    msg.includes("bug") ||
    msg.includes("server")
  ) {
    return "coding";
  }

  return "general";
}

module.exports = { detectDomain };