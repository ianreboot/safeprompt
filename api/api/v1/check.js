/**
 * SafePrompt Check Endpoint
 * POST /api/v1/check
 *
 * Validates prompts for injection attacks
 * Phase 1: Regex validation only (no AI)
 * Phase 19: Added caching support for improved performance
 */

import { validatePrompt, needsAIValidation, CONFIDENCE_THRESHOLDS } from '../../lib/prompt-validator.js';
import { getCache } from '../../lib/cache-manager.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

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

  try {
    // Parse request body
    let prompt;

    if (typeof req.body === 'string') {
      // Plain text prompt
      prompt = req.body;
    } else if (req.body && typeof req.body === 'object') {
      // JSON with prompt field
      prompt = req.body.prompt || req.body.text || req.body.input;
    }

    // Validate input
    if (!prompt) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing prompt in request body'
      });
    }

    // Check prompt length
    if (prompt.length > 50000) {
      return res.status(413).json({
        error: 'Prompt too long',
        message: 'Maximum prompt length is 50,000 characters'
      });
    }

    // Get cache instance
    const cache = getCache();

    // Check cache first
    const cachedResult = cache.get(prompt);
    if (cachedResult) {
      // Return cached response with cache metadata
      return res.status(200).json({
        ...cachedResult,
        cached: true,
        cacheAge: cachedResult.cacheAge
      });
    }

    // Perform validation
    const validationResult = validatePrompt(prompt);

    // Determine action based on confidence
    let action = 'allow';
    let requiresAI = false;

    if (!validationResult.safe) {
      // Threats detected
      if (validationResult.confidence <= CONFIDENCE_THRESHOLDS.DEFINITELY_UNSAFE) {
        action = 'block';
      } else if (validationResult.confidence <= CONFIDENCE_THRESHOLDS.UNCERTAIN) {
        action = 'review';
        requiresAI = true;
      } else {
        action = 'caution';
      }
    } else {
      // No threats, but check confidence
      if (validationResult.confidence < CONFIDENCE_THRESHOLDS.PROBABLY_SAFE) {
        requiresAI = true;
      }
    }

    // Build response
    const response = {
      safe: validationResult.safe,
      action: action,
      confidence: validationResult.confidence,
      threats: validationResult.threats || [],
      processingTime: validationResult.processingTime,
      validationType: 'regex',
      requiresAI: requiresAI,
      cached: false
    };

    // Cache the result before returning
    cache.set(prompt, response);

    // Add details for debugging (can be removed in production)
    if (process.env.NODE_ENV !== 'production') {
      response.debug = {
        promptLength: prompt.length,
        isLegitimateBusinessUse: validationResult.isLegitimateBusinessUse,
        mixedSignals: validationResult.mixedSignals,
        cacheStats: cache.getStats()
      };
    }

    // Return response
    return res.status(200).json(response);

  } catch (error) {
    console.error('Validation error:', error);

    // Fail closed on errors
    return res.status(500).json({
      safe: false,
      action: 'block',
      confidence: 0.01,
      threats: ['internal_error'],
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Configuration for Vercel
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb'
    }
  }
};