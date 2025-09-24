/**
 * SafePrompt Protected Check Endpoint - NEW VERSION
 * POST /api/v1/check
 *
 * Production endpoint with API key authentication using profiles table
 */

import { validatePrompt, CONFIDENCE_THRESHOLDS } from '../../lib/prompt-validator.js';
import { validateWithAI } from '../../lib/ai-validator.js';
import { getCache } from '../../lib/cache-manager.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/projects/.env' });

// Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || ''
);

// Initialize cache
const cache = getCache({
  maxSize: 10000,
  ttl: 3600000 // 1 hour
});

// Confidence thresholds for optimization
const OPTIMIZATION_THRESHOLDS = {
  SKIP_AI_HIGH: 0.95,    // Skip AI if regex confidence >= 95%
  SKIP_AI_LOW: 0.05,     // Skip AI if regex confidence <= 5%
  ALWAYS_AI: 0.3         // Always use AI if confidence between 30-70%
};

/**
 * Validate API key and check rate limits
 */
async function authenticateRequest(apiKey) {
  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }

  // Look up profile by API key
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      api_key,
      api_calls_this_month,
      subscription_status,
      subscription_plan_id,
      is_active,
      stripe_customer_id
    `)
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (profileError || !profile) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Get subscription plan limits
  let monthlyLimit = 10000; // Default free tier
  if (profile.subscription_plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('api_calls_limit')
      .eq('stripe_price_id', profile.subscription_plan_id)
      .single();

    if (plan) {
      monthlyLimit = plan.api_calls_limit;
    }
  } else if (profile.stripe_customer_id) {
    // Has Stripe customer but no plan ID - default to starter
    monthlyLimit = 50000;
  }

  // Check rate limits
  if (profile.api_calls_this_month >= monthlyLimit) {
    return {
      valid: false,
      error: 'Monthly limit exceeded',
      limit: monthlyLimit,
      used: profile.api_calls_this_month
    };
  }

  return {
    valid: true,
    profileId: profile.id,
    apiKey: profile.api_key,
    tier: profile.subscription_status || 'free',
    email: profile.email
  };
}

/**
 * Track API usage
 */
async function trackUsage(profileId, endpoint, result, responseTime, promptLength) {
  try {
    // Increment API call counter
    await supabase
      .from('profiles')
      .update({
        api_calls_this_month: supabase.sql`api_calls_this_month + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    // Log the API call
    await supabase
      .from('api_logs')
      .insert({
        profile_id: profileId,
        endpoint: endpoint,
        prompt_length: promptLength,
        response_time_ms: responseTime,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to track usage:', error);
    // Don't fail the request if tracking fails
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  // Get API key from headers
  const apiKey = req.headers['authorization']?.replace('Bearer ', '');

  // Authenticate
  const auth = await authenticateRequest(apiKey);
  if (!auth.valid) {
    return res.status(401).json({
      error: auth.error,
      limit: auth.limit,
      used: auth.used
    });
  }

  // Parse request
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid request: prompt required' });
  }

  if (prompt.length > 10000) {
    return res.status(400).json({ error: 'Prompt too long (max 10000 characters)' });
  }

  try {
    // Check cache first
    const cacheKey = `check:${prompt.substring(0, 100)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      const responseTime = Date.now() - startTime;
      await trackUsage(auth.profileId, '/v1/check', cached, responseTime, prompt.length);
      return res.status(200).json({
        ...cached,
        cached: true,
        processing_time: responseTime
      });
    }

    // Run regex validation
    const regexResult = validatePrompt(prompt);

    // Decide if AI validation needed
    let finalResult = regexResult;
    let usedAI = false;

    if (regexResult.confidence >= OPTIMIZATION_THRESHOLDS.SKIP_AI_HIGH) {
      // Very high confidence it's malicious - skip AI
      finalResult = { ...regexResult, safe: false };
    } else if (regexResult.confidence <= OPTIMIZATION_THRESHOLDS.SKIP_AI_LOW) {
      // Very high confidence it's safe - skip AI
      finalResult = { ...regexResult, safe: true };
    } else if (regexResult.confidence >= OPTIMIZATION_THRESHOLDS.ALWAYS_AI) {
      // Medium confidence - use AI for final decision
      const aiResult = await validateWithAI(prompt, regexResult.threats);
      finalResult = {
        ...regexResult,
        safe: aiResult.safe,
        confidence: (regexResult.confidence + aiResult.confidence) / 2,
        ai_analysis: aiResult.analysis
      };
      usedAI = true;
    }

    // Cache the result
    cache.set(cacheKey, finalResult);

    // Track usage
    const responseTime = Date.now() - startTime;
    await trackUsage(auth.profileId, '/v1/check', finalResult, responseTime, prompt.length);

    // Return result
    return res.status(200).json({
      ...finalResult,
      usedAI,
      processing_time: responseTime
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: 'Internal validation error',
      safe: false // Fail secure
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50kb'
    }
  }
};