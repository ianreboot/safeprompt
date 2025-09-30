// Consolidated validation endpoint that handles all check types
import { validatePrompt } from '../../lib/prompt-validator.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Simple in-memory cache
const cache = new Map();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(prompt, mode) {
  return crypto.createHash('md5').update(`${prompt}:${mode}`).digest('hex');
}

// Internal test API key for dogfooding
const INTERNAL_API_KEY = 'sp_test_unlimited_dogfood_key_2025';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    let isInternalUser = false;
    let profileId = null;

    // Check for internal test API key
    if (apiKey === INTERNAL_API_KEY) {
      isInternalUser = true;
      console.log('[SafePrompt] Internal test API key used - unlimited access');

      // Get internal user profile for logging
      const { data: internalProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('api_key', INTERNAL_API_KEY)
        .single();

      if (internalProfile) {
        profileId = internalProfile.id;
      }
    }
    // Validate API key
    else if (apiKey && apiKey !== 'demo_key') {
      const hashedKey = hashApiKey(apiKey);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, api_requests_used, api_requests_limit, subscription_status')
        .eq('api_key_hash', hashedKey)
        .single();

      if (error || !profile) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      if (profile.subscription_status !== 'active') {
        return res.status(403).json({ error: 'Subscription inactive' });
      }

      if (profile.api_requests_used >= profile.api_requests_limit) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      profileId = profile.id;

      // Increment usage
      await supabase
        .from('profiles')
        .update({
          api_requests_used: profile.api_requests_used + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', profile.id);
    }

    // Get request parameters
    const {
      prompt,
      prompts, // For batch processing
      mode = 'standard', // standard, optimized, ai-only, with-cache
      include_stats = false
    } = req.body;

    // Handle batch processing
    if (prompts && Array.isArray(prompts)) {
      const results = await Promise.all(
        prompts.map(async (p) => {
          const batchStartTime = Date.now();
          const cacheKey = getCacheKey(p, mode);
          const cached = cache.get(cacheKey);

          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return { prompt: p, ...cached.result, cached: true };
          }

          const result = await validatePrompt(p, {
            useAI: mode === 'ai-only' || mode === 'optimized',
            includeStats: include_stats
          });
          const batchProcessingTime = Date.now() - batchStartTime;

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
    const cacheKey = getCacheKey(prompt, mode);
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

    // Validate the prompt
    const startTime = Date.now();
    const result = await validatePrompt(prompt, {
      useAI: mode === 'ai-only' || mode === 'optimized',
      includeStats: include_stats
    });
    const processingTime = Date.now() - startTime;

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

    // Add cache stats if requested
    if (include_stats) {
      result.stats = {
        ...result.stats,
        cache_size: cache.size,
        cache_hit_rate: '0%', // Would need to track this properly
        processing_time_ms: processingTime
      };
    }

    const response = {
      ...result,
      mode,
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Add internal user flag if applicable
    if (isInternalUser) {
      response.internal_account = true;
      response.usage_tracking = 'unlimited';
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      safe: false,
      confidence: 0
    });
  }
}