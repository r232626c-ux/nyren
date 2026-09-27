const axios = require("axios");

/**
 * Ollama Provider - Local AI model execution
 * Best for: Offline mode, privacy-sensitive requests, on-premises deployment
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_API_URL = `${OLLAMA_BASE_URL}/api/chat`;

function clampMaxTokens(maxTokens, fallback = 600) {
  const parsed = Number(maxTokens);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 32), 900);
}

async function callOllama(messages, options = {}) {
  try {
    const model = options.model || process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
    const safeMaxTokens = clampMaxTokens(options.max_tokens, 600);

    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: safeMaxTokens,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: options.timeout || 120000, // Ollama is slower locally
      }
    );

    return {
      success: true,
      content: response.data?.message?.content || "",
      provider: "ollama",
      model,
    };
  } catch (err) {
    console.error("[OLLAMA PROVIDER ERROR]", err.message);
    throw err;
  }
}

/**
 * Health check for Ollama availability
 */
async function checkOllamaHealth() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (err) {
    console.warn("[OLLAMA HEALTH CHECK FAILED]", err.message);
    return false;
  }
}

module.exports = {
  callOllama,
  checkOllamaHealth,
  name: "ollama",
  capabilities: ["local", "offline", "privacy"],
};
