/**
 * AntibacterialAPI Service
 * Crash-safe frontend API client for antibacterial analysis
 * Production hardened version
 */

import { getApiBaseUrl, isOnline } from "../../../services/config";
import { getUserId } from "../../../services/apiService";

const DEFAULT_TIMEOUT = 25000;

/* =========================================================
   SAFE HELPERS
========================================================= */

const createFallbackResponse = (
  endpoint,
  error = "Service unavailable"
) => ({
  success: false,
  fallback: true,
  endpoint,
  timestamp: new Date().toISOString(),

  error,

  data: {
    smiles: "Unknown",
    analysis: {
      descriptors: {
        physicochemical: {
          mw: 0,
          tpsa: 0,
          logp: 0,
          hbd: 0,
          hba: 0,
          rotBonds: 0,
          rings: 0,
          formalCharge: 0,
        },
      },
      targetPrediction: {
        primaryTarget: "Unknown",
        confidence: 0,
        secondaryTargets: [],
      },
      antibioticLikeness: {
        score: 0,
        details: {
          structural: { label: "Structural Features", value: "Analysis unavailable" },
          physicochemical: { label: "Physicochemical", value: "Analysis unavailable" },
        },
      },
      resistanceAnalysis: {
        risk: "Unknown",
        mechanisms: [],
        recommendations: ["Analysis unavailable"],
      },
    },
    summary: {
      overallScore: 0,
      developmentPotential: "Unknown",
      primaryTarget: "Unknown",
      targetConfidence: 0,
      resistanceRisk: "Unknown",
      keyRecommendations: ["Analysis unavailable"],
    },
  },
});

const safeParseJson = async (response) => {
  try {
    const text = await response.text();

    if (!text || !text.trim()) {
      return {
        success: response.ok,
        data: null,
        error: "Empty response",
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: response.ok,
        data: text,
        error: "Invalid JSON response",
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error?.message || "Response parse failed",
    };
  }
};

const validateBaseUrl = () => {
  try {
    const url = getApiBaseUrl();

    if (!url || typeof url !== "string") {
      console.warn(
        "[AntibacterialAPI] Invalid API base URL"
      );

      return null;
    }

    return url.replace(/\/$/, "");
  } catch (error) {
    console.error(
      "[AntibacterialAPI] getApiBaseUrl failed:",
      error
    );

    return null;
  }
};

const fetchWithTimeout = async (
  url,
  options = {}
) => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT);

  try {
    const response = await fetch(
      url,
      {
        ...options,
        signal: controller.signal,
      }
    );

    const payload = await safeParseJson(response);

    if (!response.ok) {
      console.error(
        `[AntibacterialAPI] HTTP ${response.status}:`,
        payload
      );

      return {
        ...createFallbackResponse(
          url,
          payload?.error ||
            response.statusText ||
            "Request failed"
        ),

        status: response.status,
      };
    }

    return {
      success: true,
      fallback: false,
      ...payload,
    };
  } catch (error) {
    console.error(
      `[AntibacterialAPI] fetch failed (${url}):`,
      error
    );

    // ABORT
    if (error?.name === "AbortError") {
      return createFallbackResponse(
        url,
        "Request timeout"
      );
    }

    // NETWORK FAIL
    if (
      error?.message?.includes("Network request failed")
    ) {
      return createFallbackResponse(
        url,
        "Network unavailable"
      );
    }

    // GENERIC FAILSAFE
    return createFallbackResponse(
      url,
      error?.message || "Unknown error"
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

/* =========================================================
   SAFE POST WRAPPER
========================================================= */

const safePost = async (
  endpoint,
  body = {}
) => {
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
  return fetchWithTimeout(fullUrl, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body || {}),
  });
};

/* =========================================================
   API
========================================================= */

export const AntibacterialAPI = {
  /**
   * Complete compound analysis
   */
  analyzeCompound: async (smiles) => {
    try {
      if (!smiles || typeof smiles !== "string") {
        return createFallbackResponse(
          "/api/analysis/jobs",
          "Invalid SMILES input"
        );
      }

      // Check if online, return fallback if offline
      const online = await isOnline();
      if (!online) {
        return createFallbackResponse(
          "/analysis/jobs",
          "Offline mode - analysis unavailable"
        );
      }

      // Get user ID for backend request
      const userId = await getUserId();

      // Call the backend antibacterial analysis endpoint
      return await safePost(
        `${getApiBaseUrl()}/api/scientific/antibacterial/analyze`,
        { smiles }
      );
    } catch (error) {
      console.error(
        "[AntibacterialAPI] analyzeCompound fatal:",
        error
      );

      return createFallbackResponse(
        "/api/analysis/jobs",
        error?.message
      );
    }
  },

  /**
   * Predict target class
   */
  predictTargetClass: async (smiles) => {
    try {
      const userId = await getUserId();
      return await safePost(
        `${getApiBaseUrl()}/api/scientific/antibacterial/predict-target`,
        { smiles }
      );
    } catch (error) {
      console.error(
        "[AntibacterialAPI] predictTargetClass fatal:",
        error
      );

      return createFallbackResponse(
        "/api/analysis/jobs",
        error?.message
      );
    }
  },

  /**
   * Score antibiotic likeness
   */
  scoreAntibioticLikeness: async (
    smiles,
    targetClass = "proteinTargeting"
  ) => {
    try {
      const userId = await getUserId();
      return await safePost(
        `${getApiBaseUrl()}/api/scientific/antibacterial/score-likeness`,
        { smiles, targetClass }
      );
    } catch (error) {
      console.error(
        "[AntibacterialAPI] scoreAntibioticLikeness fatal:",
        error
      );

      return createFallbackResponse(
        "/api/analysis/jobs",
        error?.message
      );
    }
  },

  /**
   * Resistance analysis
   */
  analyzeResistance: async (smiles) => {
    try {
      const userId = await getUserId();
      return await safePost(
        `${getApiBaseUrl()}/api/scientific/antibacterial/analyze-resistance`,
        { smiles }
      );
    } catch (error) {
      console.error(
        "[AntibacterialAPI] analyzeResistance fatal:",
        error
      );

      return createFallbackResponse(
        "/api/analysis/jobs",
        error?.message
      );
    }
  },

  /**
   * Optimization engine
   */
  optimizeCompound: async (smiles) => {
    try {
      const userId = await getUserId();
      return await safePost(
        `${getApiBaseUrl()}/api/scientific/antibacterial/optimize`,
        { smiles }
      );
    } catch (error) {
      console.error(
        "[AntibacterialAPI] optimizeCompound fatal:",
        error
      );

      return createFallbackResponse(
        "/api/analysis/jobs",
        error?.message
      );
    }
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    try {
      const online = await isOnline();
      if (!online) {
        return createFallbackResponse(
          "/api/analysis/jobs",
          "Offline mode"
        );
      }

      return await fetchWithTimeout(
        `${getApiBaseUrl()}/api/scientific/antibacterial/health`,
        {
          method: "GET",
        }
      );
    } catch (error) {
      console.error(
        "[AntibacterialAPI] healthCheck fatal:",
        error
      );

      return createFallbackResponse(
        "/api/analysis/jobs",
        error?.message
      );
    }
  },
};

export default AntibacterialAPI;