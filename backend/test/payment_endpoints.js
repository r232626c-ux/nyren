const request = require('supertest');
const express = require('express');

process.env.CLIENT_URL = 'http://localhost:5173';
process.env.STRIPE_SECRET_KEY = '';
process.env.FLUTTERWAVE_PUBLIC_KEY = '';
process.env.FLUTTERWAVE_SECRET_KEY = '';

const billing = require('../billing/routes');
const app = express();
app.use(express.json());
app.use('/api/billing', billing);

(async ()=> {
  try {
    let res = await request(app).post('/api/billing/stripe/checkout').send({price:700});
    if(res.status !== 200) throw new Error('stripe status '+res.status);
    if(!res.body.url) throw new Error('stripe missing url');
    console.log('Stripe checkout fallback OK', res.body.url);

    res = await request(app).post('/api/billing/flutterwave/pay').send({email:'a@b.com', amount:7});
    if(res.status !== 200) throw new Error('flw status '+res.status);
    if(!(res.body.data || res.body.link)) {
      throw new Error('flutterwave missing link');
    }
    console.log('Flutterwave fallback OK', JSON.stringify(res.body).slice(0,200));

    console.log('All payment endpoint tests passed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
})();
