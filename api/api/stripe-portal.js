// Stripe Customer Portal - Allow users to manage subscriptions
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

export default async function handler(req, res) {
  // Environment-based CORS (no localhost in production)
  const isProd = process.env.NODE_ENV === 'production' ||
                 process.env.VERCEL_ENV === 'production';

  const allowedOrigins = isProd
    ? [
        'https://dashboard.safeprompt.dev',
        'https://safeprompt.dev'
      ]
    : [
        'https://dev-dashboard.safeprompt.dev',
        'https://dev.safeprompt.dev',
        'http://localhost:3000',
        'http://localhost:5173'
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
  const rateLimit = await checkRateLimit(clientIP, 'stripe-portal', {
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

    // Get user's profile to find Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.stripe_customer_id) {
      return res.status(400).json({
        error: 'No subscription found',
        message: 'You need an active subscription to access the billing portal.'
      });
    }

    // Determine return URL based on environment
    const isDev = origin?.includes('dev-dashboard') || origin?.includes('localhost');
    const returnUrl = isDev
      ? 'https://dev-dashboard.safeprompt.dev'
      : 'https://dashboard.safeprompt.dev';

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.status(200).json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe portal error:', error);
    return res.status(500).json({
      error: 'Failed to create billing portal session',
      message: error.message
    });
  }
}
