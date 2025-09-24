#!/usr/bin/env node

import https from 'https';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_ENDPOINT_URL = 'https://api.safeprompt.dev/api/v1/stripe-webhook';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

console.log('🔧 Setting up Stripe webhook...');
console.log('Endpoint URL:', WEBHOOK_ENDPOINT_URL);

const data = JSON.stringify({
  url: WEBHOOK_ENDPOINT_URL,
  enabled_events: [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ],
  description: 'SafePrompt API webhook for subscription events'
});

const options = {
  hostname: 'api.stripe.com',
  path: '/v1/webhook_endpoints',
  method: 'POST',
  auth: STRIPE_SECRET_KEY + ':',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data)
  }
};

// Convert JSON to URL-encoded format
const urlEncodedData = Object.entries(JSON.parse(data))
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(v => `enabled_events[]=${encodeURIComponent(v)}`).join('&');
    }
    return `${key}=${encodeURIComponent(value)}`;
  })
  .join('&');

options.headers['Content-Length'] = Buffer.byteLength(urlEncodedData);

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(responseData);

    if (res.statusCode === 200) {
      console.log('✅ Webhook endpoint created successfully!');
      console.log('');
      console.log('=== IMPORTANT: Save this webhook secret ===');
      console.log('STRIPE_WEBHOOK_SECRET=' + result.secret);
      console.log('');
      console.log('Webhook ID:', result.id);
      console.log('Status:', result.status);
      console.log('URL:', result.url);
      console.log('');
      console.log('Next steps:');
      console.log('1. Add STRIPE_WEBHOOK_SECRET to Vercel environment variables');
      console.log('2. Redeploy the API with the webhook secret');
    } else {
      console.error('❌ Failed to create webhook:', result.error?.message || result);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(urlEncodedData);
req.end();