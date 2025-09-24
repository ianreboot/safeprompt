/**
 * Get Stripe Price IDs for SafePrompt products
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/projects/.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function getPrices() {
  console.log('🔍 Fetching Stripe prices...\n');

  const products = {
    beta: process.env.STRIPE_BETA_PRODUCT_ID,
    starter: process.env.STRIPE_STARTER_PRODUCT_ID,
    business: process.env.STRIPE_BUSINESS_PRODUCT_ID
  };

  const priceIds = {};

  for (const [name, productId] of Object.entries(products)) {
    try {
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10
      });

      if (prices.data.length > 0) {
        const price = prices.data[0]; // Get the first active price
        priceIds[name] = price.id;

        const amount = price.unit_amount / 100;
        const interval = price.recurring?.interval || 'one-time';

        console.log(`✅ ${name.toUpperCase()} Plan`);
        console.log(`   Product: ${productId}`);
        console.log(`   Price ID: ${price.id}`);
        console.log(`   Amount: $${amount}/${interval}`);
        console.log('');
      } else {
        console.log(`❌ No prices found for ${name} (${productId})`);
        console.log(`   You need to create a price for this product in Stripe Dashboard`);
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Error fetching ${name}: ${error.message}`);
    }
  }

  // Output environment variables to add
  console.log('\n📝 Add these to your .env file:\n');
  console.log(`STRIPE_BETA_PRICE_ID=${priceIds.beta || 'CREATE_PRICE_IN_STRIPE'}`);
  console.log(`STRIPE_STARTER_PRICE_ID=${priceIds.starter || 'CREATE_PRICE_IN_STRIPE'}`);
  console.log(`STRIPE_BUSINESS_PRICE_ID=${priceIds.business || 'CREATE_PRICE_IN_STRIPE'}`);

  return priceIds;
}

getPrices().catch(console.error);