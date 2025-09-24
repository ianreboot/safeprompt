/**
 * SafePrompt Protected Check Endpoint
 * POST /api/v1/check
 *
 * Production endpoint with API key authentication and usage tracking
 */

import { validatePrompt, CONFIDENCE_THRESHOLDS } from '../../lib/prompt-validator.js';
import { validateWithAI } from '../../lib/ai-validator.js';
import { getCache } from '../../lib/cache-manager.js';
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

  // Hash the key
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Look up the key with user info
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
    return { valid: false, error: 'Invalid API key' };
  }

  // Check rate limits
  if (keyData.monthly_requests >= keyData.users.monthly_limit) {
    return {
      valid: false,
      error: 'Monthly limit exceeded',
      limit: keyData.users.monthly_limit,
      used: keyData.monthly_requests
    };
  }

  return {
    valid: true,
    keyId: keyData.id,
    keyHash,
    tier: keyData.users.tier,
    email: keyData.users.email
  };
}

/**
 * Track API usage
 */
async function trackUsage(keyHash, endpoint, result, responseTime, threats = []) {
  try {
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

export default async function handler(req, res) {
  const startTime = Date.now();

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use POST to check prompts'
    });
  }

  // Get API key from headers
  const apiKey = req.headers['authorization']?.replace('Bearer ', '') ||
                 req.headers['x-api-key'] ||
                 req.body?.api_key;

  // Authenticate request
  const auth = await authenticateRequest(apiKey);
  if (!auth.valid) {
    return res.status(401).json({
      error: auth.error,
      ...(auth.limit && { limit: auth.limit, used: auth.used })
    });
  }

  try {
    // Parse request body
    let prompt;
    let useCache = true;
    let useOptimizations = true;
    let forceAI = false;

    if (typeof req.body === 'string') {
      prompt = req.body;
    } else {
      prompt = req.body.prompt || req.body.text || req.body.input;
      useCache = req.body.useCache !== false;
      useOptimizations = req.body.optimize !== false;
      forceAI = req.body.forceAI === true;
    }

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Prompt must be a non-empty string'
      });
    }

    // Length check
    if (prompt.length > 10000) {
      return res.status(400).json({
        error: 'Prompt too long',
        message: 'Maximum prompt length is 10,000 characters'
      });
    }

    // Check cache first
    if (useCache) {
      const cached = cache.get(prompt);
      if (cached) {
        const result = {
          ...cached,
          cached: true,
          processingTime: Date.now() - startTime,
          tier: auth.tier
        };

        // Track usage even for cached responses
        await trackUsage(auth.keyHash, '/api/v1/check', result, result.processingTime, cached.threats || []);

        return res.status(200).json(result);
      }
    }

    // Run regex validation first
    const regexResult = validatePrompt(prompt);

    // Determine if we need AI validation
    let needsAI = forceAI;

    if (useOptimizations && !forceAI) {
      // Skip AI for very high confidence safe results
      if (regexResult.confidence >= OPTIMIZATION_THRESHOLDS.SKIP_AI_HIGH && regexResult.safe) {
        needsAI = false;
      }
      // Skip AI for very high confidence unsafe results
      else if (regexResult.confidence <= OPTIMIZATION_THRESHOLDS.SKIP_AI_LOW && !regexResult.safe) {
        needsAI = false;
      }
      // Use AI for uncertain results
      else if (regexResult.confidence >= 0.3 && regexResult.confidence <= 0.7) {
        needsAI = true;
      }
    }

    let finalResult = {
      safe: regexResult.safe,
      threats: regexResult.threats,
      confidence: regexResult.confidence,
      validationType: 'regex',
      cached: false,
      tier: auth.tier
    };

    // Use AI for enhanced validation if needed
    if (needsAI) {
      try {
        const aiResult = await validateWithAI(prompt, {
          timeout: 5000,
          model: 'google/gemini-2.0-flash-exp:free'
        });

        // Combine results - AI takes precedence but we keep regex threats too
        finalResult = {
          safe: aiResult.safe,
          threats: [...new Set([...regexResult.threats, ...aiResult.threats])],
          confidence: aiResult.confidence,
          validationType: 'ai_enhanced',
          regexConfidence: regexResult.confidence,
          aiConfidence: aiResult.confidence,
          cached: false,
          usedAI: true,
          tier: auth.tier
        };
      } catch (aiError) {
        console.error('AI validation error:', aiError);
        // Fall back to regex result if AI fails
        finalResult.aiError = 'AI validation unavailable, using regex only';
      }
    }

    // Add metadata
    finalResult.processingTime = Date.now() - startTime;

    // Cache the result
    if (useCache) {
      cache.set(prompt, {
        safe: finalResult.safe,
        threats: finalResult.threats,
        confidence: finalResult.confidence,
        validationType: finalResult.validationType
      });
    }

    // Track usage
    await trackUsage(auth.keyHash, '/api/v1/check', finalResult, finalResult.processingTime, finalResult.threats);

    // Return result
    return res.status(200).json(finalResult);

  } catch (error) {
    console.error('Validation error:', error);

    // Track error
    if (auth.keyHash) {
      await trackUsage(auth.keyHash, '/api/v1/check', { safe: false, error: true }, Date.now() - startTime, ['error']);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      safe: false,
      processingTime: Date.now() - startTime
    });
  }
}