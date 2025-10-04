// Stripe Checkout - Create checkout sessions for plan upgrades
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRateLimitHeaders, getClientIP } from '../lib/rate-limiter.js';

const stripe = new Stripe(
  process.env.STRIPE_PROD_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2024-11-20.acacia' }
);

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL || process.env.SAFEPROMPT_SUPABASE_URL || '',
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY || process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || ''
);

// Price ID mapping (from environment variables or hardcoded)
const PRICE_IDS = {
  early_bird: process.env.STRIPE_PROD_BETA_PRICE_ID || 'price_1SDqd8Exyn6XfOJwatOsrebN',
  starter: process.env.STRIPE_PROD_STARTER_PRICE_ID || 'price_1SDqeFExyn6XfOJwZUDEwZPL',
  business: process.env.STRIPE_PROD_BUSINESS_PRICE_ID || 'price_1SDqeiExyn6XfOJwuR8TPaFe'
};

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    'https://dashboard.safeprompt.dev',
    'https://dev-dashboard.safeprompt.dev',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin || req.headers.referer;
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting (5/min, 20/hour, 50/day)
  const clientIP = getClientIP(req);
  const rateLimit = await checkRateLimit(clientIP, 'stripe-checkout', {
    perMinute: 5,
    perHour: 20,
    perDay: 50
  });

  // Add rate limit headers
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${rateLimit.resetAt.minute} seconds.`,
      retryAfter: rateLimit.resetAt.minute
    });
  }

  try {
    // Get user from Supabase auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No auth token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Get requested plan from body
    const { planId } = req.body;

    if (!planId || !PRICE_IDS[planId]) {
      return res.status(400).json({
        error: 'Invalid plan ID',
        validPlans: Object.keys(PRICE_IDS)
      });
    }

    // Get user's profile to check for existing Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Determine return URLs based on environment
    const isDev = origin?.includes('dev-dashboard') || origin?.includes('localhost');
    const successUrl = isDev
      ? 'https://dev-dashboard.safeprompt.dev?checkout=success'
      : 'https://dashboard.safeprompt.dev?checkout=success';
    const cancelUrl = isDev
      ? 'https://dev-dashboard.safeprompt.dev?checkout=cancelled'
      : 'https://dashboard.safeprompt.dev?checkout=cancelled';

    // Create checkout session parameters
    const sessionParams = {
      mode: 'subscription',
      line_items: [
        {
          price: PRICE_IDS[planId],
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: profile.id, // Link back to our profile
      customer_email: profile.email,
    };

    // If user already has a Stripe customer ID, use it
    if (profile.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
      // Don't include customer_email when customer ID is provided
      delete sessionParams.customer_email;
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}
