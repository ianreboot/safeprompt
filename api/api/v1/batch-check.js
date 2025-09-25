/**
 * SafePrompt Batch Check Endpoint
 * POST /api/v1/batch-check
 *
 * Validates multiple prompts in a single request
 * Phase 19: Critical for CI/CD integration and bulk testing
 */

import { validatePrompt, CONFIDENCE_THRESHOLDS } from '../../lib/prompt-validator.js';
import { validateWithAI } from '../../lib/ai-validator.js';
import { getCache } from '../../lib/cache-manager.js';

// Initialize cache
const cache = getCache();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    const startTime = Date.now();

    // Parse request body
    let prompts = [];
    let useAI = false;  // Default to regex only for speed

    if (Array.isArray(req.body)) {
      // Direct array of prompts
      prompts = req.body;
    } else if (req.body && typeof req.body === 'object') {
      prompts = req.body.prompts || [];
      useAI = req.body.useAI === true;
    } else {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Request body must be an array of prompts or object with prompts array'
      });
    }

    // Validate input
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No prompts provided for validation'
      });
    }

    // Limit batch size
    if (prompts.length > 100) {
      return res.status(413).json({
        error: 'Batch too large',
        message: 'Maximum batch size is 100 prompts'
      });
    }

    // Check which prompts are cached
    const cacheCheck = cache.batchCheck(prompts);
    const results = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Process each prompt
    for (const prompt of prompts) {
      // Validate prompt type
      if (typeof prompt !== 'string') {
        results.push({
          prompt: prompt,
          error: 'Invalid prompt type',
          safe: false,
          action: 'block'
        });
        continue;
      }

      // Check length
      if (prompt.length > 50000) {
        results.push({
          prompt: prompt.substring(0, 100) + '...',
          error: 'Prompt too long',
          safe: false,
          action: 'block'
        });
        continue;
      }

      // Check cache first
      const cachedResult = cache.get(prompt);
      if (cachedResult) {
        results.push({
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          ...cachedResult,
          cached: true
        });
        cacheHits++;
        continue;
      }

      // Perform validation
      const validationResult = validatePrompt(prompt);

      // Determine if AI is needed (only if requested and confidence is uncertain)
      const needsAI = useAI &&
        validationResult.confidence > 0.3 &&
        validationResult.confidence < 0.7;

      let finalResult = {
        safe: validationResult.safe,
        confidence: validationResult.confidence,
        threats: validationResult.threats || [],
        processingTime: validationResult.processingTime,
        validationType: 'regex'
      };

      // Use AI if needed and requested
      if (needsAI) {
        try {
          const aiResult = await validateWithAI(prompt, {
            model: 'google/gemini-2.0-flash-exp:free',
            timeout: 2000  // Shorter timeout for batch processing
          });

          // Combine results conservatively
          finalResult = {
            safe: validationResult.safe && aiResult.safe,
            confidence: (validationResult.confidence + aiResult.confidence) / 2,
            threats: [...new Set([...validationResult.threats, ...aiResult.threats])],
            processingTime: Date.now() - startTime,
            validationType: 'hybrid'
          };
        } catch (aiError) {
          // Continue with regex result if AI fails
          console.error('AI validation failed for prompt:', aiError);
          finalResult.aiError = true;
        }
      }

      // Determine action
      let action = 'allow';
      if (!finalResult.safe) {
        if (finalResult.confidence >= CONFIDENCE_THRESHOLDS.DEFINITELY_UNSAFE) {
          action = 'block';
        } else if (finalResult.confidence >= CONFIDENCE_THRESHOLDS.PROBABLY_UNSAFE) {
          action = 'review';
        } else {
          action = 'caution';
        }
      }

      // Build result
      const result = {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        safe: finalResult.safe,
        action: action,
        confidence: finalResult.confidence,
        threats: finalResult.threats,
        validationType: finalResult.validationType,
        cached: false
      };

      // Cache the result
      cache.set(prompt, result);
      cacheMisses++;

      results.push(result);
    }

    // Build response
    const response = {
      results: results,
      summary: {
        total: prompts.length,
        safe: results.filter(r => r.safe).length,
        unsafe: results.filter(r => !r.safe).length,
        errors: results.filter(r => r.error).length,
        cacheHits: cacheHits,
        cacheMisses: cacheMisses,
        cacheHitRate: prompts.length > 0 ?
          ((cacheHits / prompts.length) * 100).toFixed(1) + '%' : '0%'
      },
      processingTime: Date.now() - startTime
    };

    // Add cache stats in debug mode
    if (process.env.NODE_ENV !== 'production') {
      response.cacheStats = cache.getStats();
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Batch validation error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : 'Failed to process batch'
    });
  }
}

/**
 * Configuration for Vercel
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'  // Larger limit for batch requests
    }
  }
};