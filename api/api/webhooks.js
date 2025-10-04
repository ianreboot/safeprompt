// Consolidated webhooks endpoint for all external services
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';
import { alertStripeWebhookFailure } from '../lib/alert-notifier.js';

// Use production Stripe keys in production, fall back to test keys for dev
const stripeKey = process.env.STRIPE_PROD_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeKey);
const resend = new Resend(process.env.RESEND_API_KEY);

// Use production Supabase in production, fall back to dev for local
const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL || process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY || process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

const generateApiKey = () => {
  return `sp_live_${crypto.randomBytes(32).toString('hex')}`;
};

async function sendWelcomeEmail(email, apiKey, tier) {
  try {
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SafePrompt</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="text-align: center; padding: 30px 0 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #6366f1;">SafePrompt</div>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">AI Security Made Simple</div>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0;">
            <h1 style="margin: 0 0 20px; font-size: 24px; color: #111;">Welcome to SafePrompt! 🎉</h1>

            <p style="margin: 0 0 15px; color: #555;">Your account is ready and your API key has been generated. You can start protecting your AI applications right away.</p>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Your API Key</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #111; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px;">${apiKey}</div>
              <div style="font-size: 12px; color: #ef4444; margin-top: 10px;">⚠️ Save this key now - it won't be shown again!</div>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
              <div style="font-weight: 600; color: #111; margin-bottom: 8px;">Your Plan: ${tier === 'early_bird' ? 'Early Bird ($5/month)' : tier}</div>
              <div style="font-size: 14px; color: #555;">
                ${tier === 'early_bird' ? '✨ 100,000 requests/month<br>✨ Priority support<br>✨ Price locked in forever at $5/month' : ''}
              </div>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <h2 style="font-size: 18px; color: #111; margin-bottom: 15px;">Quick Start Guide</h2>

            <div style="margin-bottom: 15px;">
              <div style="font-weight: 600; color: #111; margin-bottom: 5px;">1. Install the Package</div>
              <div style="background: #1f2937; color: #f3f4f6; font-family: 'Courier New', monospace; font-size: 13px; padding: 12px; border-radius: 6px; overflow-x: auto;">npm install @safeprompt/core</div>
            </div>

            <div style="margin-bottom: 15px;">
              <div style="font-weight: 600; color: #111; margin-bottom: 5px;">2. Protect Your AI</div>
              <div style="background: #1f2937; color: #f3f4f6; font-family: 'Courier New', monospace; font-size: 13px; padding: 12px; border-radius: 6px; overflow-x: auto;">
import { validatePrompt } from '@safeprompt/core'

const result = await validatePrompt(userInput, {
  apiKey: '${apiKey.substring(0, 20)}...'
})

if (!result.safe) {
  console.log('Blocked threats:', result.threats)
}
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://dashboard.safeprompt.dev" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
            </div>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;"><strong>Need Help?</strong></p>
            <p style="font-size: 14px; color: #666; margin: 0;">
              • 📚 <a href="https://safeprompt.dev/#docs" style="color: #6366f1; text-decoration: none;">Documentation</a><br>
              • 💬 <a href="https://safeprompt.dev/contact" style="color: #6366f1; text-decoration: none;">Contact Support</a><br>
              • 📊 <a href="https://dashboard.safeprompt.dev" style="color: #6366f1; text-decoration: none;">View Dashboard</a>
            </p>
          </div>

          <div style="text-align: center; padding: 30px 0 20px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
            <div style="font-size: 13px; color: #999;">
              <strong>SafePrompt</strong> by Reboot Media, Inc.<br>
              Protecting AI applications from prompt injection attacks
            </div>
          </div>

        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: email,
      subject: 'Welcome to SafePrompt! Your API Key is Ready 🚀',
      html: welcomeHtml
    });

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't fail the webhook if email fails
  }
}

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
  const webhookSecret = process.env.STRIPE_PROD_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

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

  try {
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
      let requestLimit = 1000;

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

        // Auto-confirm email for paid users (payment validates identity)
        await supabase.auth.admin.updateUserById(existingProfile.id, {
          email_confirm: true
        });

        // Send welcome email with API key
        await sendWelcomeEmail(customerEmail, apiKey, tier);
        console.log(`API key generated and emailed to ${customerEmail}`);
      } else {
        const newUserId = crypto.randomUUID();

        await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            email: customerEmail,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            api_key_hash: hashedKey,
            api_key_hint: keyHint,
            api_requests_limit: requestLimit,
            api_requests_used: 0,
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        // Try to find and auto-confirm the user in auth
        // Note: User might not exist in auth if they signed up without email confirmation
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === customerEmail);

        if (authUser) {
          await supabase.auth.admin.updateUserById(authUser.id, {
            email_confirm: true
          });
        }

        // Send welcome email with API key
        await sendWelcomeEmail(customerEmail, apiKey, tier);
        console.log(`API key generated and emailed to ${customerEmail}`);
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
          api_requests_limit: 1000,
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

  } catch (webhookError) {
    console.error('Stripe webhook processing error:', webhookError);

    // Send alert notification
    await alertStripeWebhookFailure(
      event.id,
      webhookError.message
    );

    return res.status(500).json({
      error: 'Webhook processing failed',
      message: webhookError.message
    });
  }
}