const express = require('express');
const router = express.Router();

const { retrieveBrandProfile } = require('../lib/contextDevClient');
const ContextService = require('../services/ContextService');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { CompanyProfile } = require('../models');

// Per-user limiter: 200 intelligence lookups per 24 hours per user
const userIntelligenceLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => (req.user && (req.user.uuid || req.user.id)) || req.ip,
  message: { error: 'Intelligence lookup quota exceeded for today.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/intelligence/domain
// Body: { domain: string, options?: { maxAgeMs, timeoutMS, ... } }
router.post('/domain', authenticateToken, userIntelligenceLimiter, async (req, res, next) => {
  try {
    const { domain, options } = req.body || {};
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'domain is required' });
    }

    // Use lib client which supports caching + SDK fallback
    const result = await retrieveBrandProfile({ domain, options });

    // Normalize to COLI shape using ContextService helper
    const brand = result && result.brand ? result.brand : result;
    const normalized = ContextService.normalizeBrandToColi(brand);

    // Persist into company_profiles (upsert by domain)
    try {
      if (normalized && (normalized.domain || normalized.name)) {
        const where = {};
        if (normalized.domain) where.domain = normalized.domain;
        else where.name = normalized.name;

        await CompanyProfile.upsert({
          domain: normalized.domain,
          name: normalized.name,
          description: normalized.description,
          tagline: normalized.tagline,
          primaryColor: normalized.primaryColor,
          logos: normalized.logos,
          socials: normalized.socials,
          industries: normalized.industries,
          address: normalized.address,
          raw: normalized.raw,
        });
      }
    } catch (dbErr) {
      console.warn('[Intelligence] Failed to persist company profile:', dbErr.message);
    }

    return res.json({ status: 'ok', brand: normalized, raw: brand });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
