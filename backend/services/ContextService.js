// ContextService: thin wrapper around context.dev SDK for COLI
const ContextDev = require('context.dev');

function makeClient() {
  if (!process.env.CONTEXT_DEV_API_KEY) {
    throw new Error('CONTEXT_DEV_API_KEY not set');
  }
  return new ContextDev({ apiKey: process.env.CONTEXT_DEV_API_KEY });
}

async function retrieveByDomain(domain, options = {}) {
  const client = makeClient();
  return client.brand.retrieve({ domain, ...options });
}

async function retrieveByEmail(email, options = {}) {
  const client = makeClient();
  return client.brand.retrieveByEmail({ email, ...options });
}

async function retrieveByName(name, options = {}) {
  const client = makeClient();
  return client.brand.retrieveByName({ name, ...options });
}

async function retrieveByTicker(ticker, options = {}) {
  const client = makeClient();
  return client.brand.retrieveByTicker({ ticker, ...options });
}

function normalizeBrandToColi(brand) {
  if (!brand) return null;
  return {
    domain: brand.domain || null,
    name: brand.title || brand.name || null,
    description: brand.description || null,
    tagline: brand.slogan || null,
    primaryColor: (brand.colors && brand.colors[0] && brand.colors[0].hex) || null,
    logos: (brand.logos || []).map((l) => ({ url: l.url, width: l.resolution?.width || null, height: l.resolution?.height || null })),
    socials: (brand.socials || []).map((s) => s.url),
    industries: brand.industries || null,
    address: brand.address || null,
    raw: brand,
  };
}

module.exports = {
  retrieveByDomain,
  retrieveByEmail,
  retrieveByName,
  retrieveByTicker,
  normalizeBrandToColi,
};
