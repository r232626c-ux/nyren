import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const CONFIGURED_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_API_HOST = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
const API_BASE_URL = CONFIGURED_API_BASE_URL || `http://${DEFAULT_API_HOST}:5000`;
const OPENROUTER_BASE_URL = "https://openrouter.ai/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const CONFIGURED_OLLAMA_BASE_URL = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL;
const DEFAULT_OLLAMA_HOSTS = Platform.OS === "android"
  ? ["http://10.0.2.2:11434", "http://127.0.0.1:11434"]
  : ["http://127.0.0.1:11434", "http://localhost:11434"];
const OLLAMA_BASE_URLS = [
  CONFIGURED_OLLAMA_BASE_URL,
  ...DEFAULT_OLLAMA_HOSTS,
].filter((url, index, urls) => url && urls.indexOf(url) === index);

// Configuration object for app settings
export const CONFIG = {
  API_BASE_URL,
  ENVIRONMENT_NAME: "Development",
  OPENROUTER_API_KEY,
};

// Simple backend bootstrap function for mobile app initialization
export const bootstrapBackend = async () => {
  console.log('[Config] Backend bootstrap - mobile app ready');
  return Promise.resolve();
};

// Get API base URL
export const getApiBaseUrl = () => API_BASE_URL;

// OpenRouter settings
export const getOpenRouterBaseUrl = () => OPENROUTER_BASE_URL;
export const getOpenRouterApiKey = () => OPENROUTER_API_KEY;

// Local Ollama endpoint candidates for offline access
export const getOllamaBaseUrls = () => OLLAMA_BASE_URLS;

// Ensure backend is ready (placeholder for mobile)
export const ensureBackendReady = async () => {
  return Promise.resolve();
};

// Check if we're online (simple connectivity check)
export const isOnline = async () => {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    return navigator.onLine;
  }

  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    return false;
  }
};

export default API_BASE_URL;
