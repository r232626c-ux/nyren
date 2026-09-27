const { routeAI, checkRouterHealth } = require("../ai/router/aiRouter");

const {
  saveMemory,
  getMemoryContext,
} = require("./vectorMemoryService");

const searchService = require("./searchService");

/* ---------------- FALLBACK RESPONSE ---------------- */
const fallbackResponse = () =>
  "I'm having trouble responding right now, but I'm still here.";

/* ---------------- MAIN AI ORCHESTRATION ---------------- */
const processMessage = async (message, userId, mode = "chat", maxTokens = null, localOnly = false, language = null, threadHistory = []) => {
  try {
    let memoryContext = "";
    try {
      memoryContext = await getMemoryContext(userId, 3);
    } catch (err) {
      // Silent fail on memory retrieval
    }

    const systemPrompt = buildSystemPrompt(mode, memoryContext, language);
    const history = Array.isArray(threadHistory) ? threadHistory : [];

    // Use AI Router for intelligent provider selection + fallback
    const routerResult = await routeAI(
      [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      {
        temperature: 0.7,
        mode,
        max_tokens: maxTokens ?? 500,
        localOnly,
      }
    );

    const isFallback = routerResult.status !== "success";
    const answer = isFallback
      ? fallbackResponse()
      : routerResult.message;

    const providerUsed = routerResult.provider || "unknown";
    console.log(
      `[MESSAGE PROCESSED] Provider: ${providerUsed}, Status: ${routerResult.status}`
    );

    // Save to memory asynchronously (non-blocking)
    saveMemory(
      userId,
      `User: ${message}\nAssistant: ${answer}`,
      "conversation"
    ).catch(() => {});

    const extra = await buildModeResponse(mode, answer, message);

    return {
      status: isFallback ? "fallback" : "success",
      answer,
      provider: providerUsed,
      model: routerResult.model,
      ...extra,
    };
  } catch (err) {
    console.error("[PROCESS MESSAGE ERROR]", err.message);
    return {
      status: "error",
      answer: fallbackResponse(),
      provider: "error",
    };
  }
};

/* ---------------- PROMPT ---------------- */
function buildSystemPrompt(mode, memory, language) {
  const languageInstruction = language === "sn" || language === "Shona"
    ? "Respond in fluent, natural Shona (chiShona). Preserve names, numbers, and technical terms where appropriate; do not invent translations for uncertain terms. Example factual answer: Q: What is the capital city of Zimbabwe? A: Guta guru reZimbabwe iHarare. Example translation: Good morning = Mangwanani."
    : language === "en" || language === "English"
      ? "Respond in clear English."
      : "";
  const base = `
You are Coli, a Jarvis-style AI assistant.
- Be intelligent, concise, and helpful
- Respond naturally like a human
- Think when needed
${languageInstruction}

Memory:
${memory}
`;

  const modes = {
    chat: base,
    search: base + "\nUse real-world knowledge and include sources.",
    reason: base + "\nExplain step-by-step reasoning clearly.",
    doc: base + "\nAnswer strictly from document context.",
  };

  return modes[mode] || base;
}

/* ---------------- MODE EXTRA ---------------- */
async function buildModeResponse(mode, answer, userMessage) {
  try {
    if (mode === "search") {
      const sources = await searchService.searchAI(userMessage);
      return { sources };
    }

    if (mode === "reason") {
      return { reasoning: extractSteps(answer) };
    }

    return {};
  } catch (err) {
    console.warn("[MODE ERROR]", err.message);
    return {};
  }
}

/* ---------------- REASONING ---------------- */
function extractSteps(text) {
  const steps = [];

  text.split("\n").forEach((line) => {
    if (/^\d+\./.test(line) || /^[-•]/.test(line)) {
      steps.push(line.replace(/^\d+\.|[-•]\s*/, ""));
    }
  });

  return steps.length ? steps : [text];
}

function parseAIIntentResponse(rawText) {
  const defaultResponse = {
    intent: "unknown",
    action: "none",
    parameters: {},
    confidence: 0.0,
  };

  if (!rawText || typeof rawText !== "string") {
    return defaultResponse;
  }

  const text = rawText.trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  const candidate =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? text.slice(firstBrace, lastBrace + 1)
      : text;

  try {
    const parsed = JSON.parse(candidate);
    return {
      intent:
        typeof parsed.intent === "string"
          ? parsed.intent
          : defaultResponse.intent,
      action:
        typeof parsed.action === "string"
          ? parsed.action
          : defaultResponse.action,
      parameters:
        parsed.parameters && typeof parsed.parameters === "object"
          ? parsed.parameters
          : {},
      confidence:
        typeof parsed.confidence === "number" &&
        parsed.confidence >= 0 &&
        parsed.confidence <= 1
          ? parsed.confidence
          : defaultResponse.confidence,
    };
  } catch (err) {
    console.warn("[AI INTERPRET] JSON parse failed:", err.message);
    return defaultResponse;
  }
}

const INTERPRET_SYSTEM_PROMPT = `You are an AI system controller. Convert user speech into structured actions. Only respond in JSON with keys: intent, action, parameters, confidence. Do not explain anything. If the user asks a question or needs an answer, return intent \"ask_question\" and action \"answer\". If the user wants a search, return intent \"search\" and action \"search\". If the user wants an app action, return intent \"open_app\" and action \"open_app\". If the user requests system settings or controls, return intent \"system_control\". If the text is not actionable, return intent \"unknown\", action \"none\", parameters {}, confidence 0.0.`;

async function interpretCommand(text, context = {}) {
  try {
    const contextString = context ? JSON.stringify(context) : '';
    const routerResult = await routeAI(
      [
        { role: "system", content: INTERPRET_SYSTEM_PROMPT },
        { role: "user", content: `Text: ${text}\nContext: ${contextString}` },
      ],
      {
        temperature: 0,
        mode: "command",
        max_tokens: 180,
      }
    );

    return parseAIIntentResponse(routerResult.message || "");
  } catch (err) {
    console.error(
      "[AI INTERPRET] Failed to interpret command:",
      err.message || err
    );
    return {
      intent: "unknown",
      action: "none",
      parameters: {},
      confidence: 0.0,
    };
  }
}

async function translateText(text, targetLang = "Shona") {
  try {
    const languageMap = {
      sn: "Shona",
      en: "English",
      es: "Spanish",
      fr: "French",
    };

    const langLabel = typeof targetLang === "string"
      ? languageMap[targetLang] || targetLang
      : "Shona";

    const shonaExamples = langLabel === "Shona"
      ? ' Use natural Shona and preserve facts. Examples: "The capital city of Zimbabwe is Harare." -> "Guta guru reZimbabwe iHarare." "Good morning." -> "Mangwanani."'
      : "";
    const systemPrompt = `You are a translation assistant. Translate the user's text into ${langLabel}. Output only the ${langLabel} translation without any explanation, apologies, or extra commentary.${shonaExamples}`;

    const routerResult = await routeAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Text: ${text}` },
      ],
      {
        temperature: 0.0,
        mode: "translate",
        max_tokens: 300,
      }
    );

    return routerResult.message || text;
  } catch (err) {
    console.error("[TRANSLATE] Backend translation failed:", err.message || err);
    return text;
  }
}

module.exports = {
  processMessage,
  checkRouterHealth,
  interpretCommand,
  translateText,
};