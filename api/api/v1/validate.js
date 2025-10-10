// Consolidated validation endpoint that handles all check types
import { validateWithMultiTurn } from '../../lib/multi-turn-validator.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sanitizeResponseWithMode } from '../../lib/response-sanitizer.js';
import { logError, logCost } from '../../lib/alert-notifier.js';
import { sanitizeCustomRules } from '../../lib/custom-lists-sanitizer.js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Adapt Vercel request to Express-style request for validateWithMultiTurn
 */
function adaptVercelRequest(req, userIP) {
  return {
    ip: userIP,
    connection: { remoteAddress: userIP },
    headers: req.headers
  };
}

// Simple in-memory cache
const cache = new Map();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(prompt, mode, profileId) {
  // 🔒 SECURITY: Include profileId to prevent cache leakage between users
  return crypto.createHash('md5').update(`${profileId}:${prompt}:${mode}`).digest('hex');
}

export default async function handler(req, res) {
  // Environment-based CORS (no localhost in production)
  // AI: NODE_ENV takes precedence over VERCEL_ENV to allow explicit environment override
  const isProd = process.env.NODE_ENV
    ? process.env.NODE_ENV === 'production'
    : process.env.VERCEL_ENV === 'production';

  const allowedOrigins = isProd
    ? [
        'https://safeprompt.dev',
        'https://www.safeprompt.dev',
        'https://dashboard.safeprompt.dev'
      ]
    : [
        'https://dev.safeprompt.dev',
        'https://dev-dashboard.safeprompt.dev',
        'http://localhost:3000',
        'http://localhost:5173'
      ];

  const origin = req.headers.origin || req.headers.referer;
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-User-IP');
  // OpenRouter API key updated 2025-10-03

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    const userIP = req.headers['x-user-ip'];
    let profileId = null;

    // 🔒 CRITICAL: API key is REQUIRED
    if (!apiKey || apiKey.trim() === '') {
      return res.status(401).json({ error: 'API key required' });
    }

    // 🔒 CRITICAL: User IP is REQUIRED for threat intelligence
    // This must be the END USER's IP (attacker), not the API caller's server IP
    if (!userIP || userIP.trim() === '') {
      return res.status(400).json({
        error: 'X-User-IP header required',
        message: 'Please provide the end user\'s IP address via X-User-IP header for threat intelligence tracking'
      });
    }

    // Validate API key against database (all users including internal)
    // Try plaintext match first (standard SaaS approach)
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('id, api_requests_used, api_requests_limit, subscription_status, subscription_tier, preferences, custom_whitelist, custom_blacklist, removed_defaults, uses_default_whitelist, uses_default_blacklist')
      .eq('api_key', apiKey)
      .single();

    // Fallback to hashed key for backward compatibility (during migration)
    if (error || !profile) {
      const hashedKey = hashApiKey(apiKey);
      const result = await supabase
        .from('profiles')
        .select('id, api_requests_used, api_requests_limit, subscription_status, subscription_tier, preferences, custom_whitelist, custom_blacklist, removed_defaults, uses_default_whitelist, uses_default_blacklist')
        .eq('api_key_hash', hashedKey)
        .single();

      profile = result.data;
      error = result.error;
    }

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check subscription status (skip for internal users)
    const isInternalUser = profile.subscription_tier === 'internal';
    if (!isInternalUser && profile.subscription_status !== 'active') {
      return res.status(403).json({ error: 'Subscription inactive' });
    }

    if (profile.api_requests_used >= profile.api_requests_limit) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    profileId = profile.id;

    // Increment usage (tracks all requests, including internal)
    await supabase
      .from('profiles')
      .update({
        api_requests_used: profile.api_requests_used + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    // Get request parameters
    const {
      prompt,
      prompts, // For batch processing
      mode = 'standard', // standard, optimized, ai-only, with-cache
      include_stats = false,
      session_token = null, // For multi-turn attack detection
      customRules = null // Custom whitelist/blacklist from request
    } = req.body;

    // Sanitize custom rules if provided
    let sanitizedCustomRules = null;
    if (customRules) {
      const sanitizeResult = sanitizeCustomRules(customRules, profile.subscription_tier);
      if (!sanitizeResult.valid) {
        return res.status(400).json({
          error: 'Invalid custom rules',
          details: sanitizeResult.errors
        });
      }
      sanitizedCustomRules = sanitizeResult.sanitized;
    }

    // Handle batch processing
    if (prompts && Array.isArray(prompts)) {
      const results = await Promise.all(
        prompts.map(async (p) => {
          const batchStartTime = Date.now();
          const cacheKey = getCacheKey(p, mode, profileId);
          const cached = cache.get(cacheKey);

          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return { prompt: p, ...cached.result, cached: true };
          }

          const adaptedReq = adaptVercelRequest(req, userIP);
          const result = await validateWithMultiTurn(p, {
            req: adaptedReq,
            userId: profileId,
            enableMultiTurn: !!session_token,
            whitelist: sanitizedCustomRules?.whitelist || [],
            blacklist: sanitizedCustomRules?.blacklist || []
          });
          const batchProcessingTime = Date.now() - batchStartTime;

          // Add processing time to result
          result.processingTime = batchProcessingTime;

          // Cache the result
          if (cache.size >= CACHE_MAX_SIZE) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          cache.set(cacheKey, { result, timestamp: Date.now() });

          // Log each batch item to database
          if (profileId) {
            try {
              await supabase
                .from('api_logs')
                .insert({
                  profile_id: profileId,
                  endpoint: '/api/v1/validate/batch',
                  response_time_ms: batchProcessingTime,
                  safe: result.safe,
                  threats: result.threats || [],
                  prompt_length: p.length
                });
            } catch (logError) {
              console.error('[SafePrompt] Failed to log batch request:', logError);
            }
          }

          return { prompt: p, ...result };
        })
      );

      return res.status(200).json({
        success: true,
        results,
        mode,
        timestamp: new Date().toISOString()
      });
    }

    // Single prompt validation
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check cache for single prompt
    const cacheKey = getCacheKey(prompt, mode, profileId);
    const cached = cache.get(cacheKey);

    if (mode === 'with-cache' && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json({
        ...cached.result,
        cached: true,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000),
        mode,
        timestamp: new Date().toISOString()
      });
    }

    // Validate the prompt with session tracking
    // Session validator handles: IP reputation, context priming, threat intelligence
    const preferences = profile.preferences || {};
    const startTime = Date.now();
    const adaptedReq = adaptVercelRequest(req, userIP);
    const result = await validateWithMultiTurn(prompt, {
      req: adaptedReq,
      userId: profileId,
      enableMultiTurn: !!session_token,
      whitelist: sanitizedCustomRules?.whitelist || [],
      blacklist: sanitizedCustomRules?.blacklist || []
    });
    const processingTime = Date.now() - startTime;

    // Add processing time to result (session validator also adds this, but ensure it's set)
    result.processingTime = result.processingTime || processingTime;

    // Cache the result
    if (cache.size >= CACHE_MAX_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, { result, timestamp: Date.now() });

    // Log to database (for both internal and regular users)
    if (profileId) {
      try {
        await supabase
          .from('api_logs')
          .insert({
            profile_id: profileId,
            endpoint: '/api/v1/validate',
            response_time_ms: processingTime,
            safe: result.safe,
            threats: result.threats || [],
            prompt_length: prompt.length
          });
      } catch (logError) {
        console.error('[SafePrompt] Failed to log request:', logError);
        // Don't fail the request if logging fails
      }
    }

    // Log cost if AI was used (for monitoring OpenRouter spend)
    if (result.stats && result.stats.totalCost && result.stats.totalCost > 0) {
      await logCost({
        service: 'openrouter',
        amountUsd: result.stats.totalCost,
        metadata: {
          model: result.stats.model,
          detection_method: result.detectionMethod,
          prompt_length: prompt.length
        },
        profileId
      });
    }

    // Add cache stats if requested
    if (include_stats) {
      result.stats = {
        ...result.stats,
        cache_size: cache.size,
        cache_hit_rate: '0%', // Would need to track this properly
        processing_time_ms: processingTime
      };
    }

    // Sanitize response to hide internal implementation details
    const sanitizedResult = sanitizeResponseWithMode(result);

    const response = {
      ...sanitizedResult,
      mode,
      cached: false,
      timestamp: new Date().toISOString(),
      // Multi-turn session information (from validateWithMultiTurn)
      sessionToken: result.session_id || null,
      sessionAnalysis: result.session_id ? {
        sessionId: result.session_id,
        riskScore: result.session_risk_score || 0,
        historyCount: (result.session_request_count || 1) - 1, // -1 because current request is included
        detectedPatterns: result.detected_patterns || [],
        blocked: result.blocked || false
      } : null
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('🚨 [SafePrompt] Validation error:', error);
    console.error('🚨 [SafePrompt] Error name:', error.name);
    console.error('🚨 [SafePrompt] Error message:', error.message);
    console.error('🚨 [SafePrompt] Error stack:', error.stack);
    console.error('🚨 [SafePrompt] Request body:', JSON.stringify(req.body).substring(0, 200));
    console.error('🚨 [SafePrompt] Env check - SUPABASE_URL:', process.env.SAFEPROMPT_SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('🚨 [SafePrompt] Env check - SERVICE_ROLE_KEY:', process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

    // Log error for monitoring
    try {
      await logError({
        endpoint: '/api/v1/validate',
        errorMessage: error.message,
        errorStack: error.stack,
        requestMethod: req.method,
        requestHeaders: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent']
        },
        ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress,
        metadata: {
          prompt_length: req.body?.prompt?.length || 0,
          mode: req.body?.mode || 'unknown'
        }
      });
    } catch (logErr) {
      console.error('🚨 [SafePrompt] Failed to log error:', logErr.message);
    }

    return res.status(500).json({
      error: 'Internal server error',
      safe: false,
      confidence: 0,
      // Include error details for debugging (will remove after fixing)
      debug: process.env.NODE_ENV === 'production' ? undefined : {
        message: error.message,
        name: error.name
      }
    });
  }
}