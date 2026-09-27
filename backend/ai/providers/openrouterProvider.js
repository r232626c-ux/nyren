const axios = require("axios");

/**
 * OpenRouter Provider - Heavy reasoning and analysis
 * Supports multiple models (gpt-4, claude, etc.)
 * Best for: Complex reasoning, deep analysis, long-form content
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "gpt-3.5-turbo";

function clampMaxTokens(maxTokens, fallback = 600) {
  const parsed = Number(maxTokens);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 32), 900);
}

async function callOpenRouter(messages, options = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  try {
    const model = options.model || DEFAULT_OPENROUTER_MODEL;
    const safeMaxTokens = clampMaxTokens(options.max_tokens, 600);

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: safeMaxTokens,
        top_p: 0.95,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: options.timeout || 60000,
      }
    );

    return {
      success: true,
      content: response.data.choices[0]?.message?.content || "",
      provider: "openrouter",
      model,
    };
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message;
    console.error("[OPENROUTER PROVIDER ERROR]", status || err.message, detail);
    throw new Error(`OpenRouter request failed${status ? ` (${status})` : ""}: ${JSON.stringify(detail)}`);
  }
}

module.exports = {
  callOpenRouter,
  name: "openrouter",
  capabilities: ["reasoning", "analysis", "multi-model"],
};
