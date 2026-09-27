const express = require('express');
const router = express.Router();

// Server-side plan catalog mapping to provider-specific price IDs (empty IDs for manual mapping)
const PLANS = {
  coli_free: { id: 'coli_free', name: 'Coli Free', priceCents: 0, stripePriceId: null },
  coli_go: { id: 'coli_go', name: 'Coli Go', priceCents: 700, stripePriceId: process.env.STRIPE_COLI_GO_PRICE_ID || null },
  coli_plus: { id: 'coli_plus', name: 'Coli Plus', priceCents: 1500, stripePriceId: process.env.STRIPE_COLI_PLUS_PRICE_ID || null },
  coli_premium: { id: 'coli_premium', name: 'Coli Premium', priceCents: 2900, stripePriceId: process.env.STRIPE_COLI_PREMIUM_PRICE_ID || null },
  coli_pro: { id: 'coli_pro', name: 'Coli Pro', priceCents: 7900, stripePriceId: process.env.STRIPE_COLI_PRO_PRICE_ID || null },
  coli_api_platform: { id: 'coli_api_platform', name: 'Coli API Platform', priceCents: null, stripePriceId: process.env.STRIPE_COLI_API_PRICE_ID || null },
};

router.get('/plans', (req, res) => {
  res.json(Object.values(PLANS));
});

// Simple institution quote endpoint — accepts institution info and returns a suggested quote
router.post('/institution/quote', express.json(), (req, res) => {
  const { institutionType, seats = 10, basePlan = 'coli_premium' } = req.body || {};

  const plan = PLANS[basePlan] || PLANS.coli_premium;
  // Basic discount rules: hospitals get 20% off, universities 30% off, startups 10% off
  let discount = 0;
  if (/hospital/i.test(institutionType)) discount = 0.2;
  if (/university|college/i.test(institutionType)) discount = 0.3;
  if (/startup/i.test(institutionType)) discount = 0.1;

  const unit = plan.priceCents || 0;
  const subtotal = unit * seats;
  const total = Math.round(subtotal * (1 - discount));

  res.json({
    institutionType,
    seats,
    basePlan: plan.id,
    discount,
    subtotalCents: subtotal,
    totalCents: total,
    notes: 'This is an automated quote. Contact sales@coli.ai for a formal proposal.'
  });
});

module.exports = router;
