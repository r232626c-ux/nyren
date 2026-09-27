import axios from "axios";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, getOllamaBaseUrls, getOpenRouterApiKey, getOpenRouterBaseUrl, isOnline } from "./config";
import billingService from "./billingService";
import { getPlanResponseTokenLimit } from "../constants/pricing";

/* ================= AXIOS ================= */

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30s timeout for development (backend initialization may be slow)
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_TOKEN_KEY = 'coli_auth_token';
const AUTH_USER_KEY = 'coli_user_info';

export const getAuthToken = async () => AsyncStorage.getItem(AUTH_TOKEN_KEY);
export const setAuthToken = async (token) => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  return token;
};
export const clearAuthToken = async () => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(AUTH_USER_KEY);
};
export const saveAuthUser = async (user) => {
  if (user) {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};
export const getAuthUser = async () => {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    try {
      console.log('[API] Request - attaching token (first 20 chars):', token ? token.slice(0, 20) : null);
    } catch (e) {
      console.log('[API] Request - no token available');
    }
    if (token && config?.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Health check flag to avoid repeated backend checks
let backendHealthy = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5000; // Only check every 5 seconds

export const checkBackendHealth = async () => {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return backendHealthy;
  }

  lastHealthCheck = now;
  try {
    const response = await axios.get(`${getApiBaseUrl()}/health`, {
      timeout: 2000,
    });
    backendHealthy = response.status === 200;
    return backendHealthy;
  } catch (error) {
    backendHealthy = false;
    return false;
  }
};

const OPENROUTER_API_KEY = getOpenRouterApiKey();
const OPENROUTER_BASE_URL = getOpenRouterBaseUrl();

const openrouterClient = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    ...(OPENROUTER_API_KEY ? { Authorization: `Bearer ${OPENROUTER_API_KEY}` } : {}),
  },
});

/* ================= USER ID ================= */

let cachedUserId = null;

const generateUUID = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

export const getUserId = async () => {
  const authUser = await getAuthUser();
  if (authUser?.uuid) return authUser.uuid;
  if (cachedUserId) return cachedUserId;

  let id = await AsyncStorage.getItem("coli_user_id");

  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem("coli_user_id", id);
  }

  cachedUserId = id;
  return id;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/api/users/register', { name, email, password });
  if (response?.token) {
    console.log('[API] registerUser - received token (first 20 chars):', response.token.slice(0,20));
    await setAuthToken(response.token);
    await saveAuthUser(response.user);
  } else {
    console.log('[API] registerUser - no token in response', response);
  }
  return response;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/api/users/login', { email, password });
  console.log('[API] loginUser response body:', response);
  if (response?.token) {
    console.log('[API] loginUser - received token (first 20 chars):', response.token.slice(0,20));
    await setAuthToken(response.token);
    await saveAuthUser(response.user);
  } else {
    console.log('[API] loginUser - no token in response', response);
  }
  return response;
};

export const startSocialLogin = async (provider) => {
  if (!['google', 'facebook', 'github'].includes(provider)) {
    throw new Error('Unsupported sign-in provider.');
  }
  const returnTo = Platform.OS === 'web' ? window.location.origin : 'coli://auth';
  const query = `?returnTo=${encodeURIComponent(returnTo)}`;
  return Linking.openURL(`${getApiBaseUrl()}/api/users/oauth/${provider}${query}`);
};

export const logoutUser = async () => {
  await clearAuthToken();
  return true;
};

export const getProfile = async () =>
  api.get('/api/users/profile', {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

/* ================= RESPONSE ================= */

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const errMsg = err?.message || '';
    // Silently suppress known network timeouts and Ollama 404s
    if (!errMsg.includes('timeout') && !errMsg.includes('ERR_NETWORK') && !errMsg.includes('404')) {
      console.log("[API ERROR]", errMsg);
    }
    return Promise.reject(err);
  }
);

/* ================= RETRY + SAFE CALL ================= */

const isRetryableError = (error) => {
  const status = error?.response?.status;
  const errMsg = (error?.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    errMsg.includes('timeout') ||
    errMsg.includes('network') ||
    errMsg.includes('econnaborted') ||
    errMsg.includes('ecONNRESET')
  );
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, attempts = 3, initialDelay = 500) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableError(error)) {
        throw error;
      }
      const jitter = Math.random() * 200;
      const delay = initialDelay * 2 ** (attempt - 1) + jitter;
      console.log(`[API RETRY] attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`);
      await wait(delay);
    }
  }
  throw lastError;
};

const safe = async (fn, fallback) => {
  try {
    return await retryWithBackoff(fn, 3, 500);
  } catch (e) {
    const errMsg = e?.message || '';
    // Silently suppress known network timeouts and Ollama/OpenRouter 404s
    if (!errMsg.includes('timeout') && !errMsg.includes('404')) {
      console.log("[SAFE ERROR]", errMsg);
    }
    return fallback;
  }
};

const OPENROUTER_ENABLED = Boolean(OPENROUTER_API_KEY);

const createOpenRouterPayload = (message, options = {}) => ({
  model: options.model || "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content:
        options.system ||
        "You are Coli, a helpful AI assistant that responds clearly and upholds user intent.",
    },
    { role: "user", content: message },
  ],
  temperature: options.temperature || 0.7,
  ...(options.max_tokens ? { max_tokens: options.max_tokens } : {}),
  ...(options.stream ? { stream: options.stream } : {}),
});

const callOpenRouter = async (message, options = {}) => {
  if (!OPENROUTER_ENABLED) {
    throw new Error("OpenRouter API key is not configured.");
  }

  const payload = createOpenRouterPayload(message, options);
  const endpoint = "/chat/completions";

  const response = await openrouterClient.post(endpoint, payload);
  const content =
    response?.data?.choices?.[0]?.message?.content ||
    response?.data?.output?.[0]?.content ||
    response?.data?.text ||
    "";

  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  return {
    answer: content,
    structured: parseStructuredAnswer(content),
  };
};

const ollamaHosts = getOllamaBaseUrls().filter(Boolean);

const createOllamaPayload = (message, options = {}) => ({
  model: options.model || process.env.EXPO_PUBLIC_OLLAMA_MODEL || "qwen2.5:0.5b",
  messages: [
    {
      role: "system",
      content:
        options.system ||
        "You are Coli, a helpful offline AI assistant. Answer clearly and use structured output when possible.",
    },
    { role: "user", content: message },
  ],
  options: {
    temperature: options.temperature ?? 0.7,
    num_predict: options.max_tokens || 600,
  },
  stream: false,
});

const parseStructuredAnswer = (text) => {
  if (!text || typeof text !== "string") return null;
  const jsonMatch = text.match(/([\[{][\s\S]*[\]}])/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return null;
  }
};

/* ---------- TRANSLATION HELPERS ---------- */
const getLanguageLabel = (lang) => {
  if (!lang) return null;
  if (lang === "auto") return null;
  if (lang === "sn") return "Shona";
  if (lang === "en") return "English";
  if (lang === "es") return "Spanish";
  if (lang === "fr") return "French";
  return lang.toUpperCase();
};

const translateText = async (text, targetLang) => {
  if (!text || !targetLang || targetLang === "auto") return text;

  const langLabel = getLanguageLabel(targetLang) || targetLang;
  const prompt = `Translate the following text into ${langLabel}. Preserve meaning exactly and format naturally. Respond with plain text only.\n\n${text}`;

  try {
    // Use OpenRouter primarily for translations when configured.
    if (OPENROUTER_ENABLED) {
      try {
        const shonaSpecial = langLabel === 'Shona';
        const systemMsg = shonaSpecial
          ? "You are a professional translator to Shona. Translate the user text into fluent Shona. Output only the translated Shona text with no explanation, apologies, or extra commentary."
          : `You are a professional translator. Translate the user text into ${langLabel}. Output only the translated text with no explanation, apologies, or extra commentary.`;

        const tr = await callOpenRouter(prompt, { system: systemMsg, temperature: 0.0, max_tokens: 1200 });
        return tr?.answer || text;
      } catch (orErr) {
        console.warn('[TRANSLATE] OpenRouter translation failed:', orErr.message || orErr);
      }
    }

    // If OpenRouter is not configured or failed, use backend translate endpoint to preserve translation behavior.
    try {
      const res = await api.post('/api/ai/translate', {
        text,
        targetLang: getLanguageLabel(targetLang) || targetLang,
      });

      const backendTranslation = res?.translation;
      if (backendTranslation) return backendTranslation;
    } catch (backendErr) {
      console.warn('[TRANSLATE] backend translate endpoint failed:', backendErr.message || backendErr);
    }

    console.warn('[TRANSLATE] all translation providers failed; returning original text');
    return text;
  } catch (err) {
    console.warn("[TRANSLATE] failed:", err.message || err);
    return text;
  }
};

const getLocalOllamaEndpoints = (host) => [`${host}/api/chat`];

const callLocalOllama = async (message, options = {}) => {
  const payload = createOllamaPayload(message, options);
  const endpoints = ollamaHosts.flatMap(getLocalOllamaEndpoints);

  if (!endpoints.length) {
    throw new Error("No Ollama host is configured for offline fallback.");
  }

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: options.timeout || 120000,
      });
      const content = response?.data?.message?.content || "";

      if (!content) {
        throw new Error("Empty response from Ollama");
      }

      return {
        answer: content,
        structured: parseStructuredAnswer(content),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Local Ollama request failed: ${lastError?.message || "host unavailable"}`
  );
};

const localFallback = async (message, options = {}) => {
  try {
    return await callLocalOllama(message, options);
  } catch (error) {
    console.warn("[LOCAL FALLBACK]", error.message);
    return {
      answer: "Offline mode is active. Ollama is not reachable at the configured local host.",
      sources: [],
      reasoning: [],
      structured: null,
    };
  }
};

const getCurrentPlanTokenLimit = async (fallback = 250) => {
  try {
    const state = await billingService.getBillingState();
    return getPlanResponseTokenLimit(state?.currentPlan, fallback);
  } catch (error) {
    return fallback;
  }
};

const callBackendOllama = async (message, userId, mode, maxTokens, options = {}) => {
  const response = await api.post(
    "/api/chat",
    {
      message,
      userId,
      mode,
      local_only: true,
      threadId: options.threadId || undefined,
      max_tokens: maxTokens,
    },
    { timeout: options.timeout || 180000 }
  );
  const answer = response?.answer || response?.reply || "";

  if (response?.status !== "success" || !answer) {
    throw new Error(response?.message || "Backend Ollama request failed");
  }

  return {
    answer,
    conversationId: response.conversationId,
    threadId: response.threadId,
    sources: response.sources || [],
    reasoning: response.reasoning || [],
    structured: response.structured || parseStructuredAnswer(answer),
  };
};

/* ================= API SERVICE ================= */

export const apiService = {
  /* -------- HTTP GENERIC HELPERS -------- */

  // Keep LearnScreen and other screens simple by exposing axios-like get/post.
  // Note: axios instance already handles auth headers via interceptors and returns res.data.
  get: async (url, options = {}) => {
    // allow LearnScreen to pass e.g. { signal }
    return api.get(url, options);
  },

  post: async (url, body, options = {}) => {
    return api.post(url, body, options);
  },

  patch: async (url, body, options = {}) => {
    return api.patch(url, body, options);
  },

  delete: async (url, options = {}) => {
    return api.delete(url, options);
  },

  /* -------- CHAT -------- */

  sendMessage: async (message, options = {}) => {
    const userId = await getUserId();
    const online = await isOnline();
    const maxTokens = await getCurrentPlanTokenLimit(250);
    console.log(`[API SERVICE] sendMessage online=${online} planLimit=${maxTokens}`);

    return safe(async () => {
      // Priority 1: OpenRouter (if enabled and online)
      if (OPENROUTER_ENABLED && online && !options.threadId) {
        try {
          const lang = options.language || "auto";
          const langLabel = lang === "auto" ? null : (lang === "sn" ? "Shona" : lang === "en" ? "English" : lang.toUpperCase());
          const systemPrompt = `${langLabel ? `Respond only in ${langLabel}.\n` : ""}You are Coli, a helpful AI assistant that responds clearly and upholds user intent.`;

          return await callOpenRouter(message, {
            system: systemPrompt,
            temperature: 0.7,
            max_tokens: maxTokens,
          });
        } catch (openError) {
          // Silently fail over to next option
        }
      }

      // Priority 2: Local backend (if online and healthy)
      if (online) {
        const isHealthy = await checkBackendHealth();
        if (isHealthy) {
          try {
              const res = await api.post("/api/chat", {
                message,
                userId,
                mode: "chat",
                language: options.language || undefined,
                max_tokens: maxTokens,
                threadId: options.threadId || undefined,
              });

            const answer = res.answer || res.reply || "";
            const shouldUseBackendFallback =
              res.status !== "success" ||
              !answer ||
              answer === "I'm having trouble responding right now, but I'm still here." ||
              answer === "I'm having trouble accessing my AI systems right now, but I'm still here. Please try again in a moment.";

                if (!shouldUseBackendFallback) {
                  const final = {
                    answer,
                    conversationId: res.conversationId,
                    threadId: res.threadId,
                    sources: res.sources || [],
                    reasoning: res.reasoning || [],
                    structured: res.structured || parseStructuredAnswer(answer),
                  };

                  // Translate backend answer if language option provided
                  if (options.language && options.language !== "auto" && final.answer) {
                    try {
                      final.answer = await translateText(final.answer, options.language);
                    } catch (err) {
                      console.warn('[API SERVICE] backend translation failed', err.message || err);
                    }
                  }

                  return final;
                }
          } catch (error) {
            backendHealthy = false;
            // Silently fail over to next option
          }
        }
      }

      // Priority 3: Local Ollama fallback
      const lang = options.language || "auto";
      const langLabel = lang === "auto" ? null : (lang === "sn" ? "Shona" : lang === "en" ? "English" : lang.toUpperCase());
      const systemPrompt = `${langLabel ? `Respond only in ${langLabel}.\n` : ""}You are an offline AI assistant capable of answering questions clearly and helpfully.`;

      try {
        return await callBackendOllama(message, userId, "chat", maxTokens, { threadId: options.threadId });
      } catch (error) {
        console.warn("[LOCAL BACKEND OLLAMA]", error.message);
      }

      return await localFallback(message, { system: systemPrompt, max_tokens: maxTokens, threadId: options.threadId });
    }, { answer: "Offline mode active. Unable to reach AI services.", sources: [], reasoning: [], structured: null });
  },

  streamMessage: async (message, options = {}, mode = "chat", onChunk, signal) => {
    const userId = await getUserId();
    const online = await isOnline();
    const maxTokens = await getCurrentPlanTokenLimit(250);
    console.log(`[API SERVICE] streamMessage online=${online} mode=${mode} planLimit=${maxTokens}`);

    const buildResult = (res) => ({
      answer: res.answer || res.reply || "",
      conversationId: res.conversationId,
      threadId: res.threadId,
      sources: res.sources || [],
      reasoning: res.reasoning || [],
      structured: res.structured || parseStructuredAnswer(res.answer || res.reply || ""),
    });

    const emitChunks = async (text) => {
      if (!onChunk || typeof onChunk !== "function") return;
      if (!text) return;
      const chunks = text.match(/.{1,120}(?:\s|$)/g) || [text];
      for (const chunk of chunks) {
        if (signal?.aborted) {
          throw new Error("Aborted");
        }
        onChunk(chunk);
      }
    };

    if (signal?.aborted) {
      throw new Error("Aborted");
    }

    let result = { answer: "", sources: [], reasoning: [], structured: null };

    try {
      if (!online) {
        throw new Error("Offline");
      }

      const res = await api.post("/api/chat", {
        message,
        userId,
        mode,
        threadId: options.threadId || undefined,
        max_tokens: options.max_tokens || maxTokens,
        ...options,
      });

      result = buildResult(res);
    } catch (error) {
      if (signal?.aborted || error?.message === "Aborted") {
        throw error;
      }

      console.warn("[API SERVICE] streamMessage fallback due to:", error.message || error);

      try {
        result = await callBackendOllama(
          message,
          userId,
          mode,
          options.max_tokens || maxTokens,
          { timeout: options.timeout, threadId: options.threadId }
        );
      } catch (backendError) {
        console.warn("[LOCAL BACKEND OLLAMA]", backendError.message);
        if (online && OPENROUTER_ENABLED) {
          try {
            result = await callOpenRouter(message, {
              system:
                options.system ||
                "You are an offline AI assistant capable of answering questions clearly and helpfully.",
              temperature: options.temperature || 0.7,
              max_tokens: options.max_tokens || maxTokens,
            });
          } catch (openError) {
            console.warn("[OPENROUTER FALLBACK]", openError.message || openError);
            result = await localFallback(message, {
              system:
                options.system ||
                "You are an offline AI assistant capable of answering questions clearly and helpfully.",
              temperature: options.temperature || 0.7,
              max_tokens: options.max_tokens || maxTokens,
              timeout: options.timeout,
            });
          }
        } else {
          result = await localFallback(message, {
            system:
              options.system ||
              "You are an offline AI assistant capable of answering questions clearly and helpfully.",
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || maxTokens,
            timeout: options.timeout,
          });
        }
      }
    }

    // If caller requested a specific language, translate final result before emitting/returning
    try {
      const targetLang = options?.language;
      if (targetLang && targetLang !== "auto" && result?.answer) {
        const translated = await translateText(result.answer, targetLang);
        result.answer = translated;
      }
    } catch (err) {
      console.warn('[API SERVICE] translation failed', err.message || err);
    }

    await emitChunks(result.answer);
    return result;
  },

  getChatThreads: async () => {
    const userId = await getUserId();
    return safe(() => api.get(`/api/chat/threads?userId=${encodeURIComponent(userId)}`), { threads: [] });
  },

  submitLearningAssessment: async (contentId, payload = {}) =>
    safe(
      () => api.post(`/api/learn/assessments/${encodeURIComponent(contentId)}/submit`, payload),
      { success: false, error: "Assessment submission unavailable" }
    ),

  saveLearningInteractions: async (payload = {}) =>
    safe(
      () => api.patch("/api/learn/progress/interactions", payload),
      { success: false, error: "Learning activity could not be saved" }
    ),

  getChatThread: async (threadId) => {
    const userId = await getUserId();
    return safe(
      () => api.get(`/api/chat/threads/${encodeURIComponent(threadId)}?userId=${encodeURIComponent(userId)}`),
      { turns: [] }
    );
  },

  saveChatTurn: async ({ message, answer, threadId, mode = "chat" }) => {
    const userId = await getUserId();
    return safe(
      () => api.post("/api/chat/turns", { userId, message, answer, threadId, mode }),
      { status: "error", message: "Unable to save chat turn" }
    );
  },

  setChatTurnImportant: async (turnId, isImportant) => {
    const userId = await getUserId();
    return safe(
      () => api.patch(`/api/chat/turns/${encodeURIComponent(turnId)}/important`, { userId, isImportant }),
      { status: "error" }
    );
  },

  /* -------- SEARCH -------- */

  search: async (query, options = {}) => {
    const userId = await getUserId();
    const online = await isOnline();
    const maxTokens = await getCurrentPlanTokenLimit(350);
    console.log(`[API SERVICE] search online=${online} planLimit=${maxTokens}`);

    return safe(
      async () => {
        // Priority 1: OpenRouter (if enabled and online)
        if (OPENROUTER_ENABLED && online) {
          try {
            const langLabel = getLanguageLabel(options.language);
            const systemPrompt = `${langLabel ? `Respond only in ${langLabel}.\n` : ""}You are a helpful AI assistant that answers search queries concisely and clearly.`;

            return await callOpenRouter(query, {
              system: systemPrompt,
              temperature: 0.5,
              max_tokens: maxTokens,
            });
          } catch (openError) {
            console.warn("[OPENROUTER]", openError.message || openError);
          }
        }

        // Priority 2: Local backend (if online)
        if (online) {
          try {
            const res = await api.post("/api/chat", {
              message: query,
              userId,
              mode: "search",
              max_tokens: maxTokens,
              language: options.language || undefined,
              threadId: options.threadId || undefined,
            });

            const out = {
              answer: res.answer || res.reply || "",
              conversationId: res.conversationId,
              threadId: res.threadId,
              sources: res.sources || [],
              reasoning: res.reasoning || [],
              structured: res.structured || parseStructuredAnswer(res.answer || res.reply || ""),
            };

            if (options.language && options.language !== "auto") {
              out.answer = await translateText(out.answer, options.language);
            }

            return out;
          } catch (error) {
            console.warn("[LOCAL BACKEND]", error.message || error);
          }
        }

        // Priority 3: Local Ollama fallback
        const langLabel = getLanguageLabel(options.language);
        const result = await localFallback(query, {
          system: `${langLabel ? `Respond in fluent ${langLabel}.\n` : ""}You are an offline AI assistant. Answer this search query with concise insights and indicate when you are offline.`,
          max_tokens: maxTokens,
        });
        if (options.language && options.language !== "auto") {
          result.answer = await translateText(result.answer, options.language);
        }
        return result;
      },
      { answer: "Search unavailable", sources: [], reasoning: [], structured: null }
    );
  },

  /* -------- REASON -------- */

  reason: async (query, options = {}) => {
    const userId = await getUserId();
    const online = await isOnline();
    const maxTokens = await getCurrentPlanTokenLimit(450);
    console.log(`[API SERVICE] reason online=${online} planLimit=${maxTokens}`);

    return safe(
      async () => {
        // Priority 1: OpenRouter (if enabled and online)
        if (OPENROUTER_ENABLED && online) {
          try {
            const langLabel = getLanguageLabel(options.language);
            const systemPrompt = `${langLabel ? `Respond only in ${langLabel}.\n` : ""}You are an AI assistant that provides structured reasoning steps and clear answers.`;

            return await callOpenRouter(query, {
              system: systemPrompt,
              temperature: 0.5,
              max_tokens: maxTokens,
            });
          } catch (openError) {
            console.warn("[OPENROUTER]", openError.message || openError);
          }
        }

        // Priority 2: Local backend (if online)
        if (online) {
          try {
            const res = await api.post("/api/chat", {
              message: query,
              userId,
              mode: "reason",
              max_tokens: maxTokens,
              language: options.language || undefined,
              threadId: options.threadId || undefined,
            });

            const out = {
              answer: res.answer || res.reply || "",
              conversationId: res.conversationId,
              threadId: res.threadId,
              sources: res.sources || [],
              reasoning: res.reasoning || [],
              structured: res.structured || parseStructuredAnswer(res.answer || res.reply || ""),
            };

            if (options.language && options.language !== "auto") {
              out.answer = await translateText(out.answer, options.language);
            }

            return out;
          } catch (error) {
            console.warn("[LOCAL BACKEND]", error.message || error);
          }
        }

        // Priority 3: Local Ollama fallback
        const langLabel = getLanguageLabel(options.language);
        const result = await localFallback(query, {
          system: `${langLabel ? `Respond in fluent ${langLabel}.\n` : ""}You are an offline reasoning assistant. Provide structured reasoning steps and a clear answer.`,
          max_tokens: maxTokens,
        });
        if (options.language && options.language !== "auto") {
          result.answer = await translateText(result.answer, options.language);
        }
        return result;
      },
      { answer: "Reasoning unavailable", reasoning: [], structured: null }
    );
  },

  /* -------- QC REPORT -------- */

  qc: async (query) => {
    const userId = await getUserId();

    return safe(
      () =>
        api.post("/api/chat", {
          message: query,
          userId,
          mode: "qc",
        }),
      { answer: "QC analysis unavailable" }
    );
  },

  /* -------- DOCUMENTS -------- */

  uploadDocument: async (formData) => {
    const userId = await getUserId();
    formData.append("userId", userId);

    // On web, letting the browser set Content-Type itself is required so it
    // can compute the multipart boundary; overriding it corrupts the upload.
    return safe(
      () =>
        api.post("/api/upload", formData, {
          headers: Platform.OS === "web" ? {} : { "Content-Type": "multipart/form-data" },
        }),
      { documentId: null }
    );
  },

  /* -------- ANALYSIS -------- */

  submitAnalysisJob: async (dataset, taskType, params = {}) => {
    const userId = await getUserId();

    return safe(
      () =>
        api.post("/api/analysis/jobs", {
          userId,
          dataset,
          taskType,
          params,
        }),
      { status: "failed", error: "Offline" }
    );
  },

  getJobs: async (userId, signal) => {
    return safe(
      () =>
        api.get(`/api/analysis/jobs?userId=${userId}`, { signal }),
      { count: 0, jobs: [] }
    );
  },

  getJobStatus: async (jobId) => {
    return safe(
      () =>
        api.get(`/api/analysis/jobs/${jobId}`),
      { status: "unknown", error: "Offline" }
    );
  },

  getJobResult: async (jobId) => {
    return safe(
      () =>
        api.get(`/api/analysis/jobs/${jobId}/result`),
      { status: "failed", error: "Offline" }
    );
  },

  docChat: async (query, documentId, options = {}) => {
    const userId = await getUserId();
    const maxTokens = await getCurrentPlanTokenLimit(250);

    return safe(
      async () => {
        try {
          const res = await api.post("/api/doc-chat", {
            message: query,
            userId,
            mode: "docs",
            documentId,
            language: options.language || undefined,
            max_tokens: maxTokens,
          });

          const out = {
            answer: res.answer || res.reply || "",
            sources: res.sources || [],
            reasoning: res.reasoning || [],
            structured: res.structured || parseStructuredAnswer(res.answer || res.reply || ""),
          };

          if (options.language && options.language !== "auto") {
            out.answer = await translateText(out.answer, options.language);
          }

          return out;
        } catch (error) {
          return {
            answer: "Document chat unavailable offline.",
            sources: [],
            reasoning: [],
            structured: null,
          };
        }
      },
      { answer: "Document chat unavailable", sources: [], reasoning: [], structured: null }
    );
  },

  interpretCommand: async (text, context = {}) => {
    const userId = await getUserId();

    const normalizeCommand = (payload) => {
      if (!payload) return null;
      if (payload.intent) return payload;
      if (payload.data && payload.data.intent) return payload.data;
      if (payload.result && payload.result.intent) return payload.result;
      return null;
    };

    return safe(
      async () => {
        try {
          const res = await api.post("/api/ai/interpret", {
            text,
            context,
            userId,
          });

          const command = normalizeCommand(res);
          if (command && command.intent) return command;
        } catch (error) {
          console.warn("AI interpret backend failed, falling back to local Ollama.", error.message);
        }

        const fallback = await callLocalOllama(
          `Interpret this user command and return only JSON with keys intent, action, parameters, confidence. User input: ${text}`,
          {
            system:
              "You are an offline assistant that returns structured command JSON only. Do not add explanatory text.",
            temperature: 0.2,
            max_tokens: 120,
          }
        );

        const parsed = fallback?.structured;
        if (parsed && parsed.intent) {
          return {
            intent: parsed.intent || "unknown",
            action: parsed.action || "answer",
            parameters: parsed.parameters || {},
            confidence: parsed.confidence || 0,
          };
        }

        return {
          intent: "unknown",
          action: "answer",
          parameters: {},
          confidence: 0,
        };
      },
      {
        intent: "unknown",
        action: "answer",
        parameters: {},
        confidence: 0,
      }
    );
  },

  /* -------- MEMORY -------- */

  getMemories: async () => {
    const userId = await getUserId();

    return safe(
      () => api.get(`/api/memory?userId=${encodeURIComponent(userId)}`),
      { researchMemories: [] }
    );
  },

  saveResearchMemory: async (ideas = [], experiments = [], notes = "") => {
    const userId = await getUserId();

    return safe(
      async () => {
        const res = await api.post(`/api/memory/research/${userId}`, {
          ideas: Array.isArray(ideas) ? ideas : [],
          experiments: Array.isArray(experiments) ? experiments : [],
          notes: typeof notes === "string" ? notes : "",
        });
        return res;
      },
      { success: false, message: "Memory save unavailable" }
    );
  },

  /* -------- PUBMED SEARCH -------- */

  searchPubMed: async (query) => {
    const userId = await getUserId();

    return safe(
      async () => {
        const res = await api.post("/api/research/search-pubmed", {
          userId,
          query,
        });
        // Handle both { papers: [] } and direct array responses
        return {
          papers: Array.isArray(res) ? res : (res?.papers || []),
          source: "pubmed",
        };
      },
      { papers: [] }
    );
  },

  /* -------- ARXIV SEARCH -------- */

  searchArxiv: async (query) => {
    const userId = await getUserId();

    return safe(
      async () => {
        const res = await api.post("/api/research/search-arxiv", {
          userId,
          query,
        });
        // Handle both { papers: [] } and direct array responses
        return {
          papers: Array.isArray(res) ? res : (res?.papers || []),
          source: "arxiv",
        };
      },
      { papers: [] }
    );
  },

  /* -------- SCHOLAR SEARCH -------- */

  searchScholar: async (query) => {
    const userId = await getUserId();

    return safe(
      async () => {
        const res = await api.post("/api/research/search-scholar", {
          userId,
          query,
        });
        // Handle both { papers: [] } and direct array responses
        return {
          papers: Array.isArray(res) ? res : (res?.papers || []),
          source: "scholar",
        };
      },
      { papers: [] }
    );
  },

  /* -------- MULTI-SOURCE SEARCH -------- */

  searchMultiSource: async (query) => {
    const userId = await getUserId();

    return safe(
      async () => {
        const res = await api.post("/api/research/search-multi", {
          userId,
          query,
        });
        return {
          papers: Array.isArray(res?.papers) ? res.papers : [],
          sources: res?.results || {},
          total: res?.total || 0,
        };
      },
      { papers: [], sources: {}, total: 0 }
    );
  },

  /* -------- SCIENTIFIC SYNTHESIS -------- */

  generateScientificSynthesis: async (papers = []) => {
    const userId = await getUserId();

    return safe(
      async () => {
        const res = await api.post("/api/research/synthesize", {
          userId,
          papers: Array.isArray(papers) ? papers : [],
        });
        return res || { synthesis: "", hypothesis: "" };
      },
      { synthesis: "", hypothesis: "" }
    );
  },

  /* -------- RESEARCH -------- */

  runScientificAnalysis: async (query) => {
    const userId = await getUserId();

    return safe(() =>
      api.post("/api/research/analyze", {
        userId,
        query,
        mode: "scientific_synthesis",
        sources: ["pubmed", "arxiv"],
      }),
      {
        papers: [],
        synthesis: "",
        hypothesis: "",
      }
    );
  },

  /* -------- JOBS -------- */

  getJobsForCurrentUser: async () => {
    const userId = await getUserId();

    return safe(
      () => api.get(`/api/analysis/jobs?userId=${userId}`),
      { count: 0 }
    );
  },

  /* -------- BACKEND HEALTH -------- */

  checkBackendHealth: async () => {
    return safe(
      async () => {
        const res = await api.get("/health");
        return {
          status: res?.status || "unknown",
          message: res?.message || "Backend is responding",
          version: res?.version || "unknown",
        };
      },
      {
        status: "offline",
        message: "Backend is not responding",
        version: "unknown",
      }
    );
  },
};

export default apiService;