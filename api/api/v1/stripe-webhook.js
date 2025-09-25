import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Initialize Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hash API key for storage
const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Generate API key
const generateApiKey = () => {
  return `sp_live_${crypto.randomBytes(32).toString('hex')}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Construct the event using the raw body and signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Processing webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        // Extract customer email and subscription details
        const customerEmail = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!customerEmail) {
          console.error('No customer email in checkout session');
          return res.status(400).json({ error: 'Customer email required' });
        }

        // Generate API key for new customer
        const apiKey = generateApiKey();
        const hashedKey = hashApiKey(apiKey);
        const keyHint = apiKey.slice(-4);

        // Get subscription tier from price ID
        const priceId = session.line_items?.data?.[0]?.price?.id || session.price;
        let tier = 'free';
        let requestLimit = 10000;

        // Map price IDs to tiers
        if (priceId === 'price_1SAaJGIceoFuMr41bDK1egBY') {
          tier = 'early_bird';
          requestLimit = 100000;
        } else if (priceId === 'price_1SAaK4IceoFuMr41rq9yNrbo') {
          tier = 'starter';
          requestLimit = 100000;
        } else if (priceId === 'price_1SAaKZIceoFuMr41JPNPtZ73') {
          tier = 'business';
          requestLimit = 1000000;
        }

        // Check if user already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .single();

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              api_key_hash: hashedKey,
              api_key_hint: keyHint,
              api_requests_limit: requestLimit,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            return res.status(500).json({ error: 'Failed to update profile' });
          }
        } else {
          // Create new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: crypto.randomUUID(),
              email: customerEmail,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              api_key: apiKey, // Store the actual key once for initial email
              api_key_hash: hashedKey,
              api_key_hint: keyHint,
              api_requests_limit: requestLimit,
              api_requests_used: 0,
              subscription_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            return res.status(500).json({ error: 'Failed to create profile' });
          }
        }

        // TODO: Send welcome email with API key using Resend
        console.log(`API key generated for ${customerEmail}: ${apiKey}`);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Update subscription status in database
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating subscription:', error);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Cancel subscription in database
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_tier: 'free',
            api_requests_limit: 10000,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error canceling subscription:', error);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Mark subscription as past_due
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating payment status:', error);
        }

        // TODO: Send payment failed email

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}