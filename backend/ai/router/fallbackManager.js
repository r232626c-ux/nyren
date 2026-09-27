/**
 * Fallback Manager - Handles provider failures gracefully
 * Implements automatic retry chain when a provider fails
 */

const groqProvider = require("../providers/groqProvider");
const openrouterProvider = require("../providers/openrouterProvider");
const ollamaProvider = require("../providers/ollamaProvider");
const hfProvider = require("../providers/hfProvider");

/**
 * Provider registry with configurations
 */
const PROVIDER_REGISTRY = {
  groq: {
    name: "groq",
    call: groqProvider.callGroq,
    timeout: 30000,
    priority: 1,
    available: groqProvider.checkGroqHealth,
  },
  openrouter: {
    name: "openrouter",
    call: openrouterProvider.callOpenRouter,
    timeout: 60000,
    priority: 2,
    available: () => !!process.env.OPENROUTER_API_KEY,
  },
  ollama: {
    name: "ollama",
    call: ollamaProvider.callOllama,
    timeout: 120000,
    priority: 3,
    available: ollamaProvider.checkOllamaHealth,
  },
  huggingface: {
    name: "huggingface",
    call: hfProvider.callHuggingFace,
    timeout: 60000,
    priority: 4,
    available: () => !!process.env.HUGGINGFACE_API_KEY,
  },
};

/**
 * Build fallback chain based on primary provider
 * If primary fails, tries alternatives in priority order
 */
async function getFallbackChain(primaryProvider, localOnly = false) {
  if (localOnly) return [primaryProvider];

  const chain = [primaryProvider];

  // Add other available providers as fallback
  const fallbackOrder = ["groq", "openrouter", "ollama", "huggingface"];

  for (const providerName of fallbackOrder) {
    if (providerName === primaryProvider) continue;

    const provider = PROVIDER_REGISTRY[providerName];
    if (!provider) continue;

    try {
      const available = await provider.available();
      if (available) {
        chain.push(providerName);
      }
    } catch (err) {
      console.warn(
        `[FALLBACK] Skipping unavailable provider ${providerName}: ${err.message}`
      );
    }
  }

  return chain;
}

/**
 * Execute AI call with automatic fallback
 * If primary provider fails, automatically tries fallback providers
 */
async function withFallback(primaryProvider, messages, options = {}) {
  const chain = await getFallbackChain(primaryProvider, options.localOnly === true);
  const results = [];

  for (let i = 0; i < chain.length; i++) {
    const providerName = chain[i];
    const provider = PROVIDER_REGISTRY[providerName];

    if (!provider) {
      console.error(
        `[FALLBACK] Provider '${providerName}' not found in registry`
      );
      continue;
    }

    try {
      console.log(
        `[FALLBACK] Attempting provider: ${providerName} (attempt ${i + 1}/${chain.length})`
      );

      const providerOptions = {
        ...options,
        timeout: provider.timeout,
      };

      if (providerName !== primaryProvider) {
        delete providerOptions.model;
      }

      const result = await provider.call(messages, providerOptions);

      console.log(
        `[FALLBACK] ✓ Success with ${providerName} (attempt ${i + 1})`
      );

      return {
        ...result,
        provider: providerName,
        attemptNumber: i + 1,
        totalAttempts: chain.length,
      };
    } catch (err) {
      console.error(
        `[FALLBACK] ✗ Failed with ${providerName}: ${err.message}`
      );
      results.push({
        provider: providerName,
        error: err.message,
      });

      if (i < chain.length - 1) {
        console.log(`[FALLBACK] Falling back to next provider...`);
      }
    }
  }

  throw new Error(
    `All AI providers failed. Attempts: ${JSON.stringify(results)}`
  );
}

/**
 * Get list of available providers for debugging
 */
async function getAvailableProviders() {
  const availableProviders = [];

  for (const [name, provider] of Object.entries(PROVIDER_REGISTRY)) {
    try {
      if (await provider.available()) {
        availableProviders.push(name);
      }
    } catch (err) {
      console.warn(`[FALLBACK] Provider availability check failed for ${name}: ${err.message}`);
    }
  }

  return availableProviders;
}

module.exports = {
  withFallback,
  getFallbackChain,
  getAvailableProviders,
  PROVIDER_REGISTRY,
};
