const express = require('express');
const router = express.Router();

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let Stripe;
    try { Stripe = require('stripe'); } catch (e) { Stripe = null; }

    if (!Stripe || !stripeSecret) {
      console.warn('Stripe webhook received but no webhook secret configured. Ignoring.');
      return res.status(400).send('no webhook secret');
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed.', err && err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Stripe checkout completed for session', session.id);
      // Try to upsert subscription using metadata or client_reference_id
      const { Subscription, User } = require('../models');
      const userId = session.metadata?.userId || session.client_reference_id || null;
      const providerSubscriptionId = session.subscription || session.id;
      const plan = session.metadata?.plan || session.metadata?.price || 'unknown';

      try {
        if (userId) {
          // create or update subscription
          const [sub, created] = await Subscription.findOrCreate({
            where: { providerSubscriptionId },
            defaults: {
              userId,
              plan,
              status: 'active',
              provider: 'stripe',
              providerSubscriptionId,
              expiresAt: null,
            }
          });

          if (!created) {
            sub.plan = plan;
            sub.status = 'active';
            sub.provider = 'stripe';
            sub.providerSubscriptionId = providerSubscriptionId;
            await sub.save();
          }
        } else {
          console.warn('Stripe webhook: no userId found in session metadata');
        }
      } catch (dbErr) {
        console.error('Failed to upsert subscription from stripe webhook', dbErr && dbErr.message);
      }
    }

    // invoice.payment_succeeded -> mark subscription active and update expiry
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      const { Subscription } = require('../models');
      try {
        const sub = await Subscription.findOne({ where: { providerSubscriptionId: subId } });
        if (sub) {
          sub.status = 'active';
          sub.expiresAt = new Date(invoice.lines?.data[0]?.period?.end * 1000) || sub.expiresAt;
          await sub.save();
        }
      } catch (dbErr) {
        console.error('Failed to update subscription from invoice event', dbErr && dbErr.message);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error', err && err.message);
    res.status(500).send('internal error');
  }
});

// Flutterwave webhook handler
router.post('/flutterwave', express.json(), async (req, res) => {
  try {
    const event = req.body;
    console.log('Flutterwave webhook received', event);

    const { Subscription } = require('../models');

    // Basic handling: when transaction status is 'successful', upsert subscription
    const tx = event.data || event;
    const txRef = tx.tx_ref || tx?.data?.tx_ref || null;
    const status = tx.status || tx?.data?.status || null;

    try {
      if (status === 'successful' || status === 'success') {
        const providerSubscriptionId = tx.id || tx?.data?.id || txRef;
        // Try to find a subscription by providerSubscriptionId
        let sub = null;
        if (providerSubscriptionId) sub = await Subscription.findOne({ where: { providerSubscriptionId } });

        if (!sub && tx.customer && tx.customer.email) {
          // We don't have user mapping; leave userId null — sales can link later
          sub = await Subscription.create({
            userId: tx.customer?.id || null,
            plan: 'flutterwave_manual',
            status: 'active',
            provider: 'flutterwave',
            providerSubscriptionId,
            expiresAt: null,
          });
        }

        if (sub) {
          sub.status = 'active';
          await sub.save();
        }
      }
    } catch (dbErr) {
      console.error('Failed to upsert subscription from flutterwave webhook', dbErr && dbErr.message);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Flutterwave webhook handler error', err && err.message);
    res.status(500).send('internal error');
  }
});

module.exports = router;
