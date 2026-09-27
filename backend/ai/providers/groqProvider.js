const axios = require("axios");

/**
 * Groq Provider - Fast inference for shorter, real-time responses
 * Default model: llama3-16k
 * Best for: Quick replies, search summaries, real-time chat
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_HEALTH_MODEL = process.env.GROQ_MODEL || "llama3";
const GROQ_HEALTH_TTL = 5 * 60 * 1000; // 5 minutes
let groqHealthCache = { valid: null, checkedAt: 0 };

function clampMaxTokens(maxTokens, fallback = 600) {
  const parsed = Number(maxTokens);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 32), 900);
}

async function callGroq(messages, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  try {
    const model = options.model || process.env.GROQ_MODEL || "llama3";
    const safeMaxTokens = clampMaxTokens(options.max_tokens, 600);
    const response = await axios.post(
      GROQ_URL,
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: safeMaxTokens,
        top_p: 1,
        stream: false,
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: options.timeout || 30000,
      }
    );

    return {
      success: true,
      content: response.data.choices[0]?.message?.content || "",
      provider: "groq",
      model,
    };
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message;
    console.error("[GROQ PROVIDER ERROR]", status || err.message, detail);
    throw new Error(`GROQ request failed${status ? ` (${status})` : ""}: ${JSON.stringify(detail)}`);
  }
}

async function checkGroqHealth() {
  if (!GROQ_API_KEY) {
    return false;
  }

  if (
    groqHealthCache.valid !== null &&
    Date.now() - groqHealthCache.checkedAt < GROQ_HEALTH_TTL
  ) {
    return groqHealthCache.valid;
  }

  try {
    await axios.post(
      GROQ_URL,
      {
        model: GROQ_HEALTH_MODEL,
        messages: [
          {
            role: "system",
            content: "Health check: respond with OK.",
          },
        ],
        temperature: 0,
        max_tokens: 1,
        top_p: 1,
        stream: false,
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    groqHealthCache = { valid: true, checkedAt: Date.now() };
    return true;
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message;
    console.warn("[GROQ HEALTH CHECK FAILED]", status || err.message, detail);
    groqHealthCache = { valid: false, checkedAt: Date.now() };
    return false;
  }
}

module.exports = {
  callGroq,
  checkGroqHealth,
  name: "groq",
  capabilities: ["fast", "real-time", "summarization"],
};
