const express = require('express');
const router = express.Router();

const Stripe = require('stripe');
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

router.post('/checkout', async (req, res) => {
  try {
    if (!stripeSecret) {
      console.error('[STRIPE] Missing STRIPE_SECRET_KEY in backend environment');
      return res.status(500).json({ error: 'Stripe secret key is not configured. Set STRIPE_SECRET_KEY in backend .env or environment.' });
    }

    const stripe = new Stripe(stripeSecret);
    const { price = 4900, userId = null, planId = 'coli_premium' } = req.body || {};
    const priceValue = typeof price === 'number' ? price : parseInt(price, 10);

    if (!priceValue || priceValue <= 0) {
      return res.status(400).json({ error: 'Invalid price value. Stripe checkout requires a positive amount in cents.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: userId || undefined,
      metadata: {
        userId: userId || 'guest',
        plan: planId,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'COLI Subscription' },
            unit_amount: priceValue,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[STRIPE] checkout error', err && err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
