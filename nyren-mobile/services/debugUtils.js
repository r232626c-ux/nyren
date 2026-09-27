/**
 * Debugging utilities for network and API debugging
 * Use this for console logging, network analysis, and troubleshooting
 */

import { CONFIG } from './config';

const DEBUG_ENABLED = __DEV__; // Enabled in development mode

export const debugLog = (tag, message, data = null) => {
  if (!DEBUG_ENABLED) return;

  const timestamp = new Date().toLocaleTimeString();
  const tagColor = getTagColor(tag);
  const prefix = `[${timestamp}] ${tag}`;

  if (data) {
    console.log(`%c${prefix}`, tagColor, message, data);
  } else {
    console.log(`%c${prefix}`, tagColor, message);
  }
};

const getTagColor = (tag) => {
  const colors = {
    API: 'color: #007AFF; font-weight: bold;',
    NETWORK: 'color: #5A8DFF; font-weight: bold;',
    ERROR: 'color: #FF3B30; font-weight: bold;',
    SUCCESS: 'color: #4CAF50; font-weight: bold;',
    WARNING: 'color: #FFA500; font-weight: bold;',
    DEBUG: 'color: #666; font-weight: bold;',
  };
  return colors[tag] || 'color: #666;';
};

/**
 * Log network request details
 */
export const logNetworkRequest = (method, url, headers, data = null) => {
  debugLog('NETWORK', `${method} REQUEST: ${url}`, {
    headers,
    data,
  });
};

/**
 * Log network response details
 */
export const logNetworkResponse = (status, url, responseTime, data = null) => {
  const statusColor = status >= 200 && status < 300 ? 'SUCCESS' : 'ERROR';
  debugLog(statusColor, `${status} RESPONSE: ${url} (${responseTime}ms)`, data);
};

/**
 * Log API errors with detailed information
 */
export const logAPIError = (error, context = {}) => {
  const {
    method = 'UNKNOWN',
    url = 'UNKNOWN',
    statusCode = 'UNKNOWN',
    message = error.message,
  } = context;

  debugLog('ERROR', `API ERROR: ${method} ${url}`, {
    status: statusCode,
    message,
    error: error.toString(),
    stack: error.stack,
  });
};

/**
 * Print full debugging information
 */
export const printDebugInfo = () => {
  debugLog('DEBUG', '=== DEBUG INFO ===', {
    environment: CONFIG.CURRENT_ENVIRONMENT,
    apiBaseUrl: CONFIG.API_BASE_URL,
    backendUrl: CONFIG.BACKEND_URL,
    socketUrl: CONFIG.SOCKET_URL,
    localIP: CONFIG.LOCAL_IP,
    port: CONFIG.LOCAL_PORT,
  });
};

/**
 * Check if backend is reachable with detailed logs
 */
export const checkConnectivity = async () => {
  debugLog('DEBUG', 'Starting connectivity check...');

  try {
    const startTime = Date.now();
    const response = await fetch(`${CONFIG.BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      debugLog('SUCCESS', `Backend is reachable (${responseTime}ms)`, data);
      return { success: true, responseTime, data };
    } else {
      debugLog('ERROR', `Backend responded with status: ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    debugLog('ERROR', 'Connectivity check failed', {
      message: error.message,
      code: error.code,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Export debugging state to JSON (for bug reports)
 */
export const exportDebugState = () => {
  return {
    timestamp: new Date().toISOString(),
    environment: CONFIG.CURRENT_ENVIRONMENT,
    config: CONFIG,
    deviceInfo: {
      // Can be expanded with react-native-device-info
      platform: 'android', // or 'ios'
    },
  };
};

export default {
  debugLog,
  logNetworkRequest,
  logNetworkResponse,
  logAPIError,
  printDebugInfo,
  checkConnectivity,
  exportDebugState,
};
