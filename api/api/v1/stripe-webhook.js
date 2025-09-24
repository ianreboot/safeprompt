/**
 * SafePrompt Stripe Webhook Handler
 * Processes payment events and manages subscriptions
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/projects/.env' });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Resend client for email notifications
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Webhook endpoint secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Generate API key for new subscriber
 */
async function generateApiKeyForUser(email: string, customerId: string) {
  const keyPrefix = 'sp_live_';
  const randomBytes = crypto.randomBytes(32);
  const randomPart = randomBytes.toString('base64')
    .replace(/\//g, '')
    .replace(/\+/g, '')
    .substring(0, 32);

  const fullKey = `${keyPrefix}${randomPart}`;
  const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
  const keyHint = fullKey.substring(fullKey.length - 4);

  // Get or create user
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        email,
        stripe_customer_id: customerId,
        tier: 'beta',
        is_beta_user: true,
        beta_price: 5.00,
        monthly_limit: 50000
      })
      .select()
      .single();

    user = newUser;
  }

  // Create API key
  const { data: apiKey } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      key_hint: keyHint,
      name: 'Beta Access Key',
      description: `Generated for ${email}`
    })
    .select()
    .single();

  return fullKey;
}

/**
 * Handle successful checkout
 */
async function handleCheckoutComplete(session: any) {
  const email = session.customer_email || session.customer_details?.email;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Update user record
  const { error: updateError } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
      tier: 'beta',
      is_beta_user: true,
      beta_price: 5.00,
      monthly_limit: 50000
    })
    .eq('email', email);

  if (updateError) {
    console.error('Error updating user:', updateError);
    return;
  }

  // Generate API key (stored in database, not emailed)
  await generateApiKeyForUser(email, customerId);

  // Send welcome email (NO API KEY - direct to dashboard)
  try {
    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: email,
      subject: 'Welcome to SafePrompt - Your Account is Ready!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00FF41;">Welcome to SafePrompt!</h1>
          <p>Your account has been successfully created and your API key is ready.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Access Your Dashboard</h2>
            <p>Your API key and usage metrics are available in your secure dashboard:</p>
            <a href="https://dashboard.safeprompt.dev" style="display: inline-block; background: #00FF41; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
          </div>

          <h3>Quick Start:</h3>
          <ol>
            <li>Log in to your dashboard at dashboard.safeprompt.dev</li>
            <li>Copy your API key (securely displayed)</li>
            <li>Install our SDK: <code>npm install @safeprompt/js</code></li>
            <li>Start protecting your AI applications!</li>
          </ol>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or visit our docs at safeprompt.dev/docs
          </p>
        </div>
      `
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't fail the webhook if email fails - user can still access dashboard
  }

  // Remove from waitlist if exists
  await supabase
    .from('waitlist')
    .update({
      converted_to_user_id: (await supabase.from('users').select('id').eq('email', email).single()).data?.id,
      converted_at: new Date().toISOString()
    })
    .eq('email', email);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: any) {
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_ends_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDelete(subscription: any) {
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_ends_at: new Date().toISOString(),
      tier: 'free',
      monthly_limit: 100
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  }

  // Deactivate API keys
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (user) {
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', user.id);
  }
}

/**
 * Main webhook handler
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDelete(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        // Log successful payment
        await supabase
          .from('billing_events')
          .insert({
            stripe_event_id: event.id,
            event_type: event.type,
            amount: event.data.object.amount_paid / 100,
            currency: event.data.object.currency,
            status: 'succeeded',
            raw_data: event.data.object
          });
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        console.error('Payment failed for customer:', event.data.object.customer);

        // Send payment failure notification
        try {
          const customerEmail = event.data.object.customer_email;
          if (customerEmail) {
            await resend.emails.send({
              from: 'SafePrompt <noreply@safeprompt.dev>',
              to: customerEmail,
              subject: 'Payment Failed - Action Required',
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #FF0000;">Payment Failed</h1>
                  <p>We were unable to process your payment for SafePrompt.</p>
                  <p>Please update your payment method to continue using the service:</p>
                  <a href="https://dashboard.safeprompt.dev/billing" style="display: inline-block; background: #00FF41; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Update Payment Method</a>
                  <p style="color: #666; margin-top: 20px;">Your API access will remain active for 7 days while we retry the payment.</p>
                </div>
              `
            });
          }
        } catch (emailError) {
          console.error('Failed to send payment failure email:', emailError);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Record all events for audit
    await supabase
      .from('billing_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        raw_data: event.data.object,
        processed_at: new Date().toISOString()
      });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}