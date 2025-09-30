// Consolidated admin endpoint for system management
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
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
      const hashedKey = hashApiKey(newApiKey);
      const keyHint = newApiKey.slice(-4);

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          api_key_hash: hashedKey,
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

      // Return the API key only on creation (user should save it)
      return res.status(200).json({
        api_key: newApiKey,
        key_hint: keyHint,
        subscription_tier: 'free',
        usage: { current: 0, limit: 10000, percentage: 0 },
        created_at: newProfile.created_at,
        warning: 'Save this API key now - it will not be shown again'
      });
    }

    if (!profile) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    const usagePercentage = profile.api_requests_limit > 0
      ? Math.round((profile.api_requests_used / profile.api_requests_limit) * 100)
      : 0;

    return res.status(200).json({
      api_key_hint: profile.api_key_hint,
      api_key_preview: `sp_live_${'•'.repeat(60)}${profile.api_key_hint}`,
      subscription_tier: profile.subscription_tier,
      subscription_status: profile.subscription_status,
      usage: {
        current: profile.api_requests_used || 0,
        limit: profile.api_requests_limit || 10000,
        percentage: usagePercentage
      },
      created_at: profile.created_at,
      last_used_at: profile.last_used_at,
      note: 'API key is hashed for security. If lost, regenerate a new key.'
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