#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ path: '/home/projects/.env' });

const stripeKey = process.env.STRIPE_PROD_SECRET_KEY;

const response = await fetch(
  'https://api.stripe.com/v1/webhook_endpoints',
  {
    headers: {
      'Authorization': `Bearer ${stripeKey}`
    }
  }
);

const data = await response.json();

if (data.error) {
  console.error('Stripe Error:', data.error.message);
  process.exit(1);
}

console.log('📡 Stripe Webhooks Configured:', data.data.length);
console.log('');

if (data.data.length === 0) {
  console.log('❌ NO WEBHOOKS CONFIGURED');
  console.log('');
  console.log('This is a critical issue! Webhooks are needed to:');
  console.log('  - Update user subscription status after payment');
  console.log('  - Handle subscription cancellations');
  console.log('  - Process refunds');
  console.log('');
  console.log('You need to configure a webhook at:');
  console.log('  https://api.safeprompt.dev/api/webhooks?source=stripe');
  console.log('');
  console.log('Events to listen for:');
  console.log('  - checkout.session.completed');
  console.log('  - customer.subscription.created');
  console.log('  - customer.subscription.updated');
  console.log('  - customer.subscription.deleted');
  process.exit(1);
}

for (const wh of data.data) {
  console.log('Webhook:', wh.id);
  console.log('  URL:', wh.url);
  console.log('  Status:', wh.status);
  console.log('  Events:', wh.enabled_events.join(', '));
  console.log('  Created:', new Date(wh.created * 1000).toISOString());
  console.log('');
}
