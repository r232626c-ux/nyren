const express = require('express');
const axios = require('axios');
const router = express.Router();

const flutterwavePublicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

router.post('/pay', async (req, res) => {
  try {
    const {
      email = '',
      name = '',
      amount = 49,
      userId = null,
      planId = 'coli_premium',
    } = req.body || {};

    const amountValue = typeof amount === 'number' ? amount : parseFloat(amount)
    const safeEmail = (email || '').trim() || 'guest@coli.app'
    const safeName = (name || '').trim() || 'Coli Guest'

    if (!flutterwavePublicKey || !flutterwaveSecretKey) {
      console.warn('[FLW] Missing Flutterwave keys, returning mock checkout link');
      return res.json({ data: { link: `${clientUrl}/success?mock=true`, mock: true } });
    }

    const txRef = `COLI-${userId || 'guest'}-${Date.now()}`
    if (!amountValue || amountValue <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount. Flutterwave requires an amount greater than 0.' })
    }

    const payload = {
      tx_ref: txRef,
      amount: amountValue,
      currency: 'USD',
      redirect_url: `${clientUrl}/success?tx_ref=${txRef}`,
      customer: { email: safeEmail, name: safeName },
      customizations: {
        title: 'COLI Subscription',
        description: `COLI ${planId} plan`,
      },
      meta: { userId, planId },
    };

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (response.data?.status !== 'success') {
      console.error('[FLW] unexpected response', JSON.stringify(response.data));
      return res.status(502).json({
        error: 'Flutterwave payment gateway did not return a successful response',
        details: response.data,
      });
    }

    return res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const errorMessage = err.response?.data?.message || err.message || 'Unknown Flutterwave error';

    console.error('[FLW] create payment error', {
      status,
      message: errorMessage,
      body: err.response?.data,
    });

    if (status === 401) {
      return res.status(401).json({
        error: 'Flutterwave authentication failed. Check FLUTTERWAVE_SECRET_KEY and FLUTTERWAVE_PUBLIC_KEY in your backend environment.',
        details: err.response?.data,
      });
    }

    return res.status(status).json({ error: errorMessage, details: err.response?.data });
  }
});

module.exports = router;
