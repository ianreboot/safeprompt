/**
 * SafePrompt API Key Management Endpoints
 * Handles key generation, validation, and usage tracking
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/projects/.env' });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * CORS headers for API responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/**
 * Generate a new API key for a user
 * POST /api/v1/keys/generate
 */
export async function generateKey(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS_HEADERS).end();
  }

  try {
    const { email, tier = 'free', stripe_customer_id = null } = req.body;

    if (!email) {
      return res.status(400).set(CORS_HEADERS).json({
        error: 'Email is required'
      });
    }

    // Check if user exists
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          tier,
          stripe_customer_id,
          monthly_limit: tier === 'free' ? 100 : tier === 'beta' ? 50000 : 50000,
          is_beta_user: tier === 'beta',
          beta_price: tier === 'beta' ? 5.00 : null
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).set(CORS_HEADERS).json({
          error: 'Failed to create user',
          details: createError.message
        });
      }

      user = newUser;
    }

    // Generate API key
    const keyType = tier === 'free' ? 'test' : 'live';
    const keyPrefix = keyType === 'test' ? 'sp_test_' : 'sp_live_';
    const randomBytes = crypto.randomBytes(32);
    const randomPart = randomBytes.toString('base64')
      .replace(/\//g, '')
      .replace(/\+/g, '')
      .substring(0, 32);

    const fullKey = `${keyPrefix}${randomPart}`;
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    const keyHint = fullKey.substring(fullKey.length - 4);

    // Store key in database
    const { data: apiKey, error: keyError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        key_hint: keyHint,
        name: `${tier} API Key`,
        description: `Generated for ${email}`
      })
      .select()
      .single();

    if (keyError) {
      return res.status(500).set(CORS_HEADERS).json({
        error: 'Failed to generate API key',
        details: keyError.message
      });
    }

    // Return the key (only shown once!)
    return res.status(200).set(CORS_HEADERS).json({
      success: true,
      api_key: fullKey,
      key_id: apiKey.id,
      tier,
      monthly_limit: user.monthly_limit,
      message: 'Save this key securely - it will not be shown again!'
    });

  } catch (error) {
    console.error('Key generation error:', error);
    return res.status(500).set(CORS_HEADERS).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Validate an API key and return user info
 * POST /api/v1/keys/validate
 */
export async function validateKey(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS_HEADERS).end();
  }

  try {
    const apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.api_key;

    if (!apiKey) {
      return res.status(401).set(CORS_HEADERS).json({
        error: 'API key required',
        valid: false
      });
    }

    // Hash the key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Look up the key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select(`
        *,
        users (
          email,
          tier,
          monthly_limit,
          is_beta_user
        )
      `)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return res.status(401).set(CORS_HEADERS).json({
        error: 'Invalid API key',
        valid: false
      });
    }

    // Check rate limits
    const { data: canProceed } = await supabase
      .rpc('check_rate_limit', {
        p_api_key_hash: keyHash
      });

    if (!canProceed) {
      return res.status(429).set(CORS_HEADERS).json({
        error: 'Rate limit exceeded',
        valid: false,
        tier: keyData.users.tier,
        limit: keyData.users.monthly_limit
      });
    }

    // Return validation result
    return res.status(200).set(CORS_HEADERS).json({
      valid: true,
      key_id: keyData.id,
      user: {
        email: keyData.users.email,
        tier: keyData.users.tier,
        is_beta: keyData.users.is_beta_user
      },
      usage: {
        total: keyData.total_requests,
        monthly: keyData.monthly_requests,
        limit: keyData.users.monthly_limit
      }
    });

  } catch (error) {
    console.error('Key validation error:', error);
    return res.status(500).set(CORS_HEADERS).json({
      error: 'Internal server error',
      valid: false
    });
  }
}

/**
 * Get usage statistics for an API key
 * GET /api/v1/keys/usage
 */
export async function getUsage(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS_HEADERS).end();
  }

  try {
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).set(CORS_HEADERS).json({
        error: 'API key required'
      });
    }

    // Hash the key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Get API key info
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select(`
        *,
        users (
          email,
          tier,
          monthly_limit
        )
      `)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return res.status(401).set(CORS_HEADERS).json({
        error: 'Invalid API key'
      });
    }

    // Get recent usage logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usageLogs, error: logsError } = await supabase
      .from('usage_logs')
      .select('timestamp, endpoint, response_time_ms, validation_result, used_ai')
      .eq('api_key_id', keyData.id)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);

    // Calculate statistics
    const stats = {
      total_requests: keyData.total_requests,
      monthly_requests: keyData.monthly_requests,
      monthly_limit: keyData.users.monthly_limit,
      percentage_used: Math.round((keyData.monthly_requests / keyData.users.monthly_limit) * 100),

      recent_activity: usageLogs?.map(log => ({
        timestamp: log.timestamp,
        endpoint: log.endpoint,
        response_time: log.response_time_ms,
        result: log.validation_result,
        ai_used: log.used_ai
      })) || [],

      performance: {
        avg_response_time: usageLogs?.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / (usageLogs?.length || 1),
        ai_usage_rate: usageLogs?.filter(log => log.used_ai).length / (usageLogs?.length || 1)
      }
    };

    return res.status(200).set(CORS_HEADERS).json(stats);

  } catch (error) {
    console.error('Usage retrieval error:', error);
    return res.status(500).set(CORS_HEADERS).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Track API usage (internal function)
 */
export async function trackUsage(apiKey, endpoint, result, responseTime, threats = []) {
  try {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    await supabase.rpc('track_api_usage', {
      p_api_key_hash: keyHash,
      p_endpoint: endpoint,
      p_response_time_ms: responseTime,
      p_validation_result: result.safe ? 'safe' : 'unsafe',
      p_used_cache: result.cached || false,
      p_used_ai: result.usedAI || false,
      p_threats: threats
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't throw - tracking failure shouldn't break the API
  }
}

/**
 * Main handler for Vercel
 */
export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Route to appropriate handler
  if (pathname === '/api/v1/keys/generate' && req.method === 'POST') {
    return generateKey(req, res);
  } else if (pathname === '/api/v1/keys/validate' && req.method === 'POST') {
    return validateKey(req, res);
  } else if (pathname === '/api/v1/keys/usage' && req.method === 'GET') {
    return getUsage(req, res);
  } else {
    return res.status(404).set(CORS_HEADERS).json({
      error: 'Endpoint not found'
    });
  }
}