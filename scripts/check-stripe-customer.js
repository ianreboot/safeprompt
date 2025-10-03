#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ path: '/home/projects/.env' });

const email = 'yuenho.8@gmail.com';
const stripeKey = process.env.STRIPE_PROD_SECRET_KEY;

const response = await fetch(
  `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=10`,
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

if (data.data.length === 0) {
  console.log('❌ No Stripe customer found for', email);
  process.exit(0);
}

const customer = data.data[0];
console.log('✅ Stripe Customer Found:');
console.log('  ID:', customer.id);
console.log('  Email:', customer.email);
console.log('  Created:', new Date(customer.created * 1000).toISOString());
console.log('  Metadata:', customer.metadata);

// Get subscriptions
const subResponse = await fetch(
  `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&limit=10`,
  {
    headers: {
      'Authorization': `Bearer ${stripeKey}`
    }
  }
);

const subData = await subResponse.json();

console.log('\n📊 Subscriptions:', subData.data.length);
for (const sub of subData.data) {
  console.log('\n  Subscription ID:', sub.id);
  console.log('  Status:', sub.status);
  console.log('  Price ID:', sub.items.data[0].price.id);
  console.log('  Amount:', sub.items.data[0].price.unit_amount / 100, 'USD');
  console.log('  Created:', new Date(sub.created * 1000).toISOString());
  console.log('  Metadata:', sub.metadata);
}
