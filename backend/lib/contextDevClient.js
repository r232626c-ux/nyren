/* Server-side Context.dev wrapper for COLI
 * - Reads API key from process.env.CONTEXT_DEV_API_KEY
 * - Prefers official SDK if installed, falls back to direct HTTP calls
 * - Optional Redis caching if REDIS_URL provided (TTL ms via CONTEXT_BRAND_TTL_MS)
 */
const axios = require('axios');
const debug = false;

const CONTEXT_API_BASE = 'https://api.context.dev/v1';

let sdkClient = null;
function getSdkClient() {
  if (sdkClient) return sdkClient;
  try {
    // Try to load official SDK if installed
    // eslint-disable-next-line global-require
    const ContextDev = require('context.dev');
    // SDK examples show default export is a constructor
    sdkClient = new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY });
    return sdkClient;
  } catch (err) {
    if (debug) console.info('context.dev SDK not installed, falling back to HTTP');
    return null;
  }
}

// Optional Redis client (lazy)
let redis = null;
function getRedis() {
  if (redis) return redis;
  try {
    const IORedis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || process.env.REDIS;
    if (!redisUrl) return null;
    redis = new IORedis(redisUrl);
    return redis;
  } catch (e) {
    return null;
  }
}

function validateApiKey() {
  if (!process.env.CONTEXT_DEV_API_KEY) {
    const err = new Error('Missing CONTEXT_DEV_API_KEY environment variable');
    err.code = 'MISSING_API_KEY';
    throw err;
  }
}

function cacheKeyForInput(input) {
  if (input.domain) return `context:brand:domain:${input.domain}`;
  if (input.email) return `context:brand:email:${input.email}`;
  if (input.name) return `context:brand:name:${input.name}`;
  if (input.ticker) return `context:brand:ticker:${input.ticker}`;
  return null;
}

async function getCached(key) {
  const r = getRedis();
  if (!r) return null;
  try {
    const v = await r.get(key);
    if (!v) return null;
    return JSON.parse(v);
  } catch (e) {
    return null;
  }
}

async function setCached(key, value, ttlMs) {
  const r = getRedis();
  if (!r) return;
  try {
    const ttlSec = Math.max(1, Math.round((ttlMs || defaultTtlMs) / 1000));
    await r.set(key, JSON.stringify(value), 'EX', ttlSec);
  } catch (e) {
    // ignore cache errors
  }
}

const defaultTtlMs = parseInt(process.env.CONTEXT_BRAND_TTL_MS || `${24 * 60 * 60 * 1000}`, 10);

/**
 * retrieveBrandProfile
 * input: { domain?, email?, name?, ticker?, options? }
 * returns: { status, brand, code }
 */
async function retrieveBrandProfile(input = {}) {
  validateApiKey();

  if (!input.domain && !input.email && !input.name && !input.ticker) {
    throw new Error('One of domain, email, name or ticker must be provided');
  }

  const cacheKey = cacheKeyForInput(input);
  if (cacheKey) {
    const cached = await getCached(cacheKey);
    if (cached) return cached;
  }

  // Prefer SDK when present
  const client = getSdkClient();
  let result = null;
  if (client && client.brand) {
    if (input.domain && typeof client.brand.retrieve === 'function') {
      result = await client.brand.retrieve({ domain: input.domain, ...(input.options || {}) });
    } else if (input.email && typeof client.brand.retrieveByEmail === 'function') {
      result = await client.brand.retrieveByEmail({ email: input.email, ...(input.options || {}) });
    } else if (input.name && typeof client.brand.retrieveByName === 'function') {
      result = await client.brand.retrieveByName({ name: input.name, ...(input.options || {}) });
    } else if (input.ticker && typeof client.brand.retrieveByTicker === 'function') {
      result = await client.brand.retrieveByTicker({ ticker: input.ticker, ...(input.options || {}) });
    } else {
      // Last resort: call generic retrieve with whichever param exists
      result = await client.brand.retrieve(input);
    }
  } else {
    // SDK not present - use HTTP
    const url = `${CONTEXT_API_BASE}/brand/retrieve`;
    const body = {};
    if (input.domain) body.domain = input.domain;
    if (input.email) body.email = input.email;
    if (input.name) body.name = input.name;
    if (input.ticker) body.ticker = input.ticker;
    if (input.options) Object.assign(body, input.options);

    const headers = {
      Authorization: `Bearer ${process.env.CONTEXT_DEV_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const resp = await axios.post(url, body, { headers, timeout: input.options?.timeoutMS || 60_000 });
    result = resp.data;
  }

  // Cache result if caching available
  if (cacheKey && result) {
    try {
      await setCached(cacheKey, result, input.options?.maxAgeMs || defaultTtlMs);
    } catch (e) {
      // ignore
    }
  }

  return result;
}

module.exports = {
  retrieveBrandProfile,
  validateApiKey,
};
