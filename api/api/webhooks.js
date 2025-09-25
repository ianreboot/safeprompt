// Consolidated webhooks endpoint for all external services
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

const generateApiKey = () => {
  return `sp_live_${crypto.randomBytes(32).toString('hex')}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source } = req.query;

  try {
    switch (source) {
      case 'stripe':
        return handleStripeWebhook(req, res);

      case 'resend':
        // Future: Handle Resend webhooks for email events
        return res.status(200).json({ received: true });

      default:
        return res.status(400).json({ error: 'Unknown webhook source' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Processing Stripe webhook:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!customerEmail) {
        return res.status(400).json({ error: 'Customer email required' });
      }

      const apiKey = generateApiKey();
      const hashedKey = hashApiKey(apiKey);
      const keyHint = apiKey.slice(-4);

      // Determine tier from price ID
      const priceId = session.line_items?.data?.[0]?.price?.id || session.price;
      let tier = 'free';
      let requestLimit = 10000;

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

      // Check if user exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (existingProfile) {
        await supabase
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
      } else {
        await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            email: customerEmail,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            api_key: apiKey,
            api_key_hash: hashedKey,
            api_key_hint: keyHint,
            api_requests_limit: requestLimit,
            api_requests_used: 0,
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      console.log(`API key generated for ${customerEmail}`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          subscription_tier: 'free',
          api_requests_limit: 10000,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', invoice.customer);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}