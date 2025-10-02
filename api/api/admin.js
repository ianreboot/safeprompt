// Consolidated admin endpoint for system management
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Cache stats removed - in-memory caching doesn't work on serverless
// Use Redis/Upstash for real distributed caching

async function handleUserApiKey(req, res) {
  // Get authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Create new profile if doesn't exist
      const newApiKey = generateApiKey();
      const keyHint = newApiKey.slice(-4);

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          api_key: newApiKey,
          api_key_hint: keyHint,
          subscription_tier: 'free',
          api_requests_limit: 10000,
          api_requests_used: 0,
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      // Return the full API key
      return res.status(200).json({
        api_key: newApiKey,
        key_hint: keyHint,
        subscription_tier: 'free',
        usage: { current: 0, limit: 10000, percentage: 0 },
        created_at: newProfile.created_at
      });
    }

    if (!profile) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    const usagePercentage = profile.api_requests_limit > 0
      ? Math.round((profile.api_requests_used / profile.api_requests_limit) * 100)
      : 0;

    return res.status(200).json({
      api_key: profile.api_key || null,
      api_key_hint: profile.api_key_hint,
      subscription_tier: profile.subscription_tier,
      subscription_status: profile.subscription_status,
      usage: {
        current: profile.api_requests_used || 0,
        limit: profile.api_requests_limit || 10000,
        percentage: usagePercentage
      },
      created_at: profile.created_at,
      last_used_at: profile.last_used_at
    });
  } catch (error) {
    console.error('User API key error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateCheckout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, email, priceId, successUrl, cancelUrl } = req.body;

  if (!userId || !email) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'MISSING_FIELDS'
    });
  }

  try {
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_BETA_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl || 'https://dashboard.safeprompt.dev?welcome=true',
      cancel_url: cancelUrl || 'https://safeprompt.dev/signup',
      metadata: {
        supabase_user_id: userId
      }
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      code: 'STRIPE_ERROR'
    });
  }
}

async function sendApprovalEmail(email, apiKey) {
  try {
    const approvalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your SafePrompt Account is Approved!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="text-align: center; padding: 30px 0 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #6366f1;">SafePrompt</div>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">AI Security Made Simple</div>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0;">
            <h1 style="margin: 0 0 20px; font-size: 24px; color: #111;">Your account is ready! 🎉</h1>

            <p style="margin: 0 0 15px; color: #555;">Great news! You've been approved from the SafePrompt waitlist. Your API key has been generated and you can start protecting your AI applications right away.</p>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Your API Key</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #111; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px;">${apiKey}</div>
              <div style="font-size: 12px; color: #ef4444; margin-top: 10px;">⚠️ Save this key now - it won't be shown again!</div>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
              <div style="font-weight: 600; color: #111; margin-bottom: 8px;">Your Plan: Free Tier</div>
              <div style="font-size: 14px; color: #555;">
                ✨ 10,000 requests/month<br>
                ✨ Community support<br>
                ✨ Full protection features
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
              <a href="https://dashboard.safeprompt.dev" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Access Dashboard</a>
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
      subject: 'Your SafePrompt Account is Ready! 🚀',
      html: approvalHtml
    });

    console.log(`Approval email sent to ${email}`);
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;  // Fail the approval if email fails
  }
}

async function handleApproveWaitlist(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Add admin authentication check here
  // For now, require a secret key
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      code: 'MISSING_EMAIL'
    });
  }

  try {
    // Check if user exists in waitlist
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email)
      .single();

    if (waitlistError || !waitlistEntry) {
      return res.status(404).json({
        error: 'User not found in waitlist',
        code: 'NOT_FOUND'
      });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHint = apiKey.slice(-4);

    // Check if user exists in auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      return res.status(404).json({
        error: 'User not found in authentication system',
        code: 'AUTH_NOT_FOUND'
      });
    }

    // Confirm email if not already confirmed
    if (!authUser.email_confirmed_at) {
      await supabase.auth.admin.updateUserById(authUser.id, {
        email_confirm: true
      });
    }

    // Create or update profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      await supabase
        .from('profiles')
        .update({
          api_key: apiKey,
          api_key_hint: keyHint,
          subscription_tier: 'free',
          api_requests_limit: 10000,
          subscription_status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);
    } else {
      await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: email,
          api_key: apiKey,
          api_key_hint: keyHint,
          subscription_tier: 'free',
          api_requests_limit: 10000,
          api_requests_used: 0,
          subscription_status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // Update waitlist entry
    await supabase
      .from('waitlist')
      .update({
        converted_to_profile_id: authUser.id,
        approved_at: new Date().toISOString()
      })
      .eq('email', email);

    // Send approval email with API key
    await sendApprovalEmail(email, apiKey);

    return res.status(200).json({
      success: true,
      message: `User ${email} approved and email sent`,
      api_key_hint: keyHint
    });

  } catch (error) {
    console.error('Waitlist approval error:', error);
    return res.status(500).json({
      error: 'Failed to approve user',
      code: 'APPROVAL_ERROR',
      details: error.message
    });
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;

  // Special handling for user actions (requires auth)
  if (action === 'user-api-key') {
    return handleUserApiKey(req, res);
  }

  // Stripe checkout (POST only, no auth needed for initial creation)
  if (action === 'create-checkout') {
    return handleCreateCheckout(req, res);
  }

  // Waitlist approval (requires admin key)
  if (action === 'approve-waitlist') {
    return handleApproveWaitlist(req, res);
  }

  try {
    switch (action) {
      case 'health':
        // Health check
        return res.status(200).json({
          status: 'healthy',
          service: 'SafePrompt API',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
          version: '1.0.0'
        });

      case 'status':
        // System status
        const { data: profiles } = await supabase
          .from('profiles')
          .select('subscription_tier', { count: 'exact' });

        const { data: waitlist } = await supabase
          .from('waitlist')
          .select('id', { count: 'exact' });

        return res.status(200).json({
          status: 'operational',
          timestamp: new Date().toISOString(),
          stats: {
            total_users: profiles?.length || 0,
            waitlist_count: waitlist?.length || 0,
            active_subscriptions: profiles?.filter(p => p.subscription_tier !== 'free').length || 0
          },
          services: {
            api: 'operational',
            database: 'operational',
            cache: 'operational',
            ai: 'operational'
          }
        });

      case 'cache':
        // Cache statistics - disabled (in-memory cache ineffective on serverless)
        return res.status(501).json({
          error: 'Cache statistics not implemented',
          message: 'In-memory caching not supported on serverless. Use Redis/Upstash for distributed caching.',
          timestamp: new Date().toISOString()
        });

      default:
        // Default to health check
        return res.status(200).json({
          status: 'healthy',
          service: 'SafePrompt API',
          timestamp: new Date().toISOString(),
          available_actions: ['health', 'status', 'cache']
        });
    }
  } catch (error) {
    console.error('Admin endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}