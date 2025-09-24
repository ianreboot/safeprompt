/**
 * SafePrompt Optimized Check Endpoint
 * POST /api/v1/check-optimized
 *
 * Implements caching and confidence-based routing for maximum performance
 */

import { validatePrompt, CONFIDENCE_THRESHOLDS } from '../../lib/prompt-validator.js';
import { validateWithAI } from '../../lib/ai-validator.js';
import { getCache } from '../../lib/cache-manager.js';

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
    let useCache = true;
    let useOptimizations = true;
    let forceAI = false;

    if (typeof req.body === 'string') {
      prompt = req.body;
    } else if (req.body && typeof req.body === 'object') {
      prompt = req.body.prompt || req.body.text || req.body.input;
      useCache = req.body.useCache !== false;
      useOptimizations = req.body.useOptimizations !== false;
      forceAI = req.body.forceAI === true;
    }

    // Validate input
    if (!prompt) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing prompt in request body'
      });
    }

    if (prompt.length > 50000) {
      return res.status(413).json({
        error: 'Prompt too long',
        message: 'Maximum prompt length is 50,000 characters'
      });
    }

    const startTime = Date.now();

    // Step 1: Check cache
    if (useCache) {
      const cachedResult = cache.get(prompt);
      if (cachedResult) {
        return res.status(200).json({
          ...cachedResult,
          processingTime: Date.now() - startTime,
          optimizations: ['cache_hit']
        });
      }
    }

    // Step 2: Regex validation
    const regexResult = validatePrompt(prompt);

    // Step 3: Determine if AI is needed (confidence-based routing)
    let needsAI = forceAI;
    let skipReason = null;

    if (!forceAI && useOptimizations) {
      // Very high confidence in safety - skip AI
      if (regexResult.safe && regexResult.confidence >= OPTIMIZATION_THRESHOLDS.SKIP_AI_HIGH) {
        needsAI = false;
        skipReason = 'high_confidence_safe';
      }
      // Very high confidence in unsafety - skip AI
      else if (!regexResult.safe && regexResult.confidence >= OPTIMIZATION_THRESHOLDS.SKIP_AI_HIGH) {
        needsAI = false;
        skipReason = 'high_confidence_unsafe';
      }
      // Medium confidence - always use AI
      else if (regexResult.confidence >= OPTIMIZATION_THRESHOLDS.ALWAYS_AI &&
               regexResult.confidence <= (1 - OPTIMIZATION_THRESHOLDS.ALWAYS_AI)) {
        needsAI = true;
      }
    }

    let finalResult = {
      safe: regexResult.safe,
      confidence: regexResult.confidence,
      threats: regexResult.threats || [],
      processingTime: regexResult.processingTime,
      validationType: 'regex',
      optimizations: []
    };

    // Step 4: AI validation if needed
    if (needsAI) {
      try {
        const aiResult = await validateWithAI(prompt, {
          model: 'google/gemini-2.0-flash-exp:free',
          timeout: 5000
        });

        // Combine results conservatively
        const combinedSafe = regexResult.safe && aiResult.safe;
        const avgConfidence = (regexResult.confidence + aiResult.confidence) / 2;

        finalResult = {
          safe: combinedSafe,
          confidence: avgConfidence,
          threats: [...new Set([...regexResult.threats, ...aiResult.threats])],
          processingTime: Date.now() - startTime,
          validationType: 'hybrid',
          optimizations: [],
          details: {
            regex: {
              safe: regexResult.safe,
              confidence: regexResult.confidence,
              time: regexResult.processingTime
            },
            ai: {
              safe: aiResult.safe,
              confidence: aiResult.confidence,
              time: aiResult.processingTime,
              model: aiResult.model
            }
          }
        };
      } catch (aiError) {
        // Fall back to regex if AI fails
        console.error('AI validation error:', aiError);
        finalResult.aiError = aiError.message;
        finalResult.validationType = 'regex-fallback';
        finalResult.optimizations.push('ai_fallback');
      }
    } else {
      // AI was skipped
      finalResult.optimizations.push(skipReason || 'ai_skipped');
    }

    // Step 5: Cache the result
    if (useCache) {
      cache.set(prompt, {
        safe: finalResult.safe,
        confidence: finalResult.confidence,
        threats: finalResult.threats,
        validationType: finalResult.validationType
      });
    }

    // Step 6: Determine action recommendation
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

    // Build response
    const response = {
      safe: finalResult.safe,
      action: action,
      confidence: finalResult.confidence,
      threats: finalResult.threats,
      processingTime: Date.now() - startTime,
      validationType: finalResult.validationType,
      optimizations: finalResult.optimizations
    };

    // Add debug info if requested
    if (req.body?.debug) {
      response.debug = {
        promptLength: prompt.length,
        cacheUsed: useCache,
        optimizationsUsed: useOptimizations,
        aiSkipped: !needsAI,
        skipReason: skipReason,
        cacheStats: cache.getStats(),
        details: finalResult.details
      };
    }

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb'
    }
  }
};