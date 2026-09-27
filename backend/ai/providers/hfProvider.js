const axios = require("axios");

/**
 * HuggingFace Provider - On-demand inference via HF API
 * Best for: Specific model requirements, fine-tuned models, cost optimization
 */

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_BASE_URL = "https://api-inference.huggingface.co/models";

function clampMaxTokens(maxTokens, fallback = 600) {
  const parsed = Number(maxTokens);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 32), 900);
}

async function callHuggingFace(messages, options = {}) {
  if (!HF_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  try {
    // Convert messages to HF format (text prompt)
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const model = options.model || process.env.HUGGINGFACE_MODEL || "gpt2";
    const url = `${HF_BASE_URL}/${model}`;
    const safeMaxTokens = clampMaxTokens(options.max_tokens, 600);

    const response = await axios.post(
      url,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: safeMaxTokens,
          temperature: options.temperature || 0.7,
        },
      },
      {
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: options.timeout || 60000,
      }
    );

    // Extract generated text
    const content =
      response.data[0]?.generated_text ||
      response.data?.generated_text ||
      "";

    return {
      success: true,
      content,
      provider: "huggingface",
      model,
    };
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message;
    console.error("[HUGGINGFACE PROVIDER ERROR]", status || err.message, detail);
    throw new Error(`HuggingFace request failed${status ? ` (${status})` : ""}: ${JSON.stringify(detail)}`);
  }
}

module.exports = {
  callHuggingFace,
  name: "huggingface",
  capabilities: ["inference-api", "custom-models"],
};
