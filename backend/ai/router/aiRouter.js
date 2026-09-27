
/**
 * AI Router - Hardened Main Orchestration Layer
 * Fixes: undefined provider, bad payloads, unstable fallback
 */

const { decideModel } = require("./decisionEngine");
const { withFallback, getAvailableProviders } = require("./fallbackManager");

const DEFAULT_MAX_TOKENS = 600;
const MODE_MAX_TOKENS = {
  chat: 500,
  search: 700,
  reason: 900,
  doc: 600,
  translate: 300,
  command: 180,
  default: DEFAULT_MAX_TOKENS,
};

function resolveMaxTokens(context = {}) {
  const requested = Number(context.max_tokens);
  const mode = context.mode || context.package || "default";
  const cap = MODE_MAX_TOKENS[mode] ?? MODE_MAX_TOKENS.default;

  if (!Number.isFinite(requested)) {
    return cap;
  }

  return Math.min(Math.max(requested, 64), cap);
}

/**
 * Normalize messages for all providers (prevents 400 errors)
 */
function normalizeMessages(messages = []) {
  return messages.map((m) => ({
    role: m?.role || "user",
    content: m?.content || "",
  }));
}

/**
 * Main routing function - Entry point for all AI requests
 */
async function routeAI(messages, context = {}) {
  try {
    // 🧼 Step 0: Normalize messages
    const normalizedMessages = normalizeMessages(messages);

    const lastMessage =
      normalizedMessages[normalizedMessages.length - 1]?.content || "";

    // 🧠 Step 1: Decide provider
    let decision = context.localOnly
      ? {
          provider: "ollama",
          model: process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
          reason: "offline local-only mode",
        }
      : await decideModel(lastMessage, context);

    // 🛡️ Step 1.5: Fix undefined provider issue
    if (!decision || !decision.provider) {
      console.warn("[ROUTER] Invalid decision → defaulting to groq");

      decision = {
        provider: "groq",
        model: process.env.GROQ_MODEL || "llama3",
        reason: "default fallback",
      };
    }

    console.log(
      `[ROUTER] Selected provider: ${decision.provider} (reason: ${decision.reason})`
    );

    // ⚡ Step 2: Execute with fallback
    const result = await withFallback(
      decision.provider,
      normalizedMessages,
      {
        model: decision.model,
        temperature: context.temperature ?? 0.7,
        max_tokens: resolveMaxTokens(context),
        localOnly: context.localOnly === true,
      }
    );

    // ✅ Step 3: Return structured success
    return {
      status: "success",
      message: result?.content || "",
      provider: result?.provider || decision.provider,
      model: result?.model || decision.model,
      decision: decision.reason,
      attemptNumber: result?.attemptNumber || 1,
      totalAttempts: result?.totalAttempts || 1,
    };
  } catch (err) {
    console.error("[ROUTER ERROR]", err.message);

    // 🚨 Final safe response (never expose raw failure)
    return {
      status: "error",
      message:
        "I'm having trouble accessing my AI systems right now, but I’m still here. Please try again in a moment.",
      provider: "none",
      error: err.message,
      availableProviders: await getAvailableProviders(),
    };
  }
}

/**
 * Health check for all providers
 */
async function checkRouterHealth() {
  const available = await getAvailableProviders();

  return {
    healthy: available.length > 0,
    availableProviders: available,
    totalProviders: available.length,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  routeAI,
  checkRouterHealth,
};