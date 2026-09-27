const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama3";
const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "gpt-3.5-turbo";

function decideModel(message = "", context = {}) {
  const text = String(message || "").trim().toLowerCase();
  const { domain, depth } = context;

  if (domain === "bio" || /\b(bio|biology|chemistry|gene|dna|rna|protein|cell|microbi|neuro)\b/.test(text)) {
    if (depth === "high" || /\b(analyze|explain|reason|diagnose|study|deep|complex)\b/.test(text)) {
      return {
        provider: "openrouter",
        model: DEFAULT_OPENROUTER_MODEL,
        reason: "deep bio reasoning",
      };
    }

    return {
      provider: "groq",
      model: DEFAULT_GROQ_MODEL,
      reason: "fast bio answers",
    };
  }

  if (
    domain === "coding" ||
    /\b(code|bug|function|algorithm|javascript|python|typescript|react|node|java|csharp|rust|go|shell)\b/.test(text)
  ) {
    return {
      provider: "openrouter",
      model: DEFAULT_OPENROUTER_MODEL,
      reason: "coding query",
    };
  }

  if (/\b(search|lookup|source|web|browse|news|research)\b/.test(text)) {
    return {
      provider: "groq",
      model: DEFAULT_GROQ_MODEL,
      reason: "fast general response",
    };
  }

  return {
    provider: "groq",
    model: DEFAULT_GROQ_MODEL,
    reason: "fast general response",
  };
}

module.exports = { decideModel };