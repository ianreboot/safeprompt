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

    // Validate API key
    if (apiKey && apiKey !== 'demo_key') {
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
          const cacheKey = getCacheKey(p, mode);
          const cached = cache.get(cacheKey);

          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return { prompt: p, ...cached.result, cached: true };
          }

          const result = await validatePrompt(p, {
            useAI: mode === 'ai-only' || mode === 'optimized',
            includeStats: include_stats
          });

          // Cache the result
          if (cache.size >= CACHE_MAX_SIZE) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          cache.set(cacheKey, { result, timestamp: Date.now() });

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

    // Add cache stats if requested
    if (include_stats) {
      result.stats = {
        ...result.stats,
        cache_size: cache.size,
        cache_hit_rate: '0%', // Would need to track this properly
        processing_time_ms: processingTime
      };
    }

    return res.status(200).json({
      ...result,
      mode,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      safe: false,
      confidence: 0
    });
  }
}