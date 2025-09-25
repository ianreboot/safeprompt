/**
 * SafePrompt Check Endpoint with AI Validation
 * POST /api/v1/check-with-ai
 *
 * Validates prompts using regex + AI for high accuracy
 * Phase 2: Includes AI validation with FREE models
 * Phase 19: Added caching support for improved performance
 */

import { validatePrompt, needsAIValidation, CONFIDENCE_THRESHOLDS } from '../../lib/prompt-validator.js';
import { validateWithAI, selectModel } from '../../lib/ai-validator.js';
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
    let mode = 'standard';  // 'standard', 'fast', 'paranoid'
    let useAI = true;       // Can be disabled for testing

    if (typeof req.body === 'string') {
      prompt = req.body;
    } else if (req.body && typeof req.body === 'object') {
      prompt = req.body.prompt || req.body.text || req.body.input;
      mode = req.body.mode || 'standard';
      useAI = req.body.useAI !== false;
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

    const startTime = Date.now();

    // Step 1: Regex validation
    const regexResult = validatePrompt(prompt);

    // Determine if AI validation is needed
    const needsAI = useAI && needsAIValidation(regexResult.confidence, mode);

    let finalResult = {
      safe: regexResult.safe,
      confidence: regexResult.confidence,
      threats: regexResult.threats || [],
      processingTime: regexResult.processingTime,
      validationType: 'regex'
    };

    // Step 2: AI validation if needed
    if (needsAI) {
      try {
        // Select appropriate model based on confidence and mode
        const model = selectModel(regexResult.confidence, {
          mode: 'free',  // Always use FREE models for now
          preferSpeed: mode === 'fast'
        });

        // Validate with AI
        const aiResult = await validateWithAI(prompt, {
          model,
          timeout: mode === 'fast' ? 3000 : 5000
        });

        // Combine results - be conservative
        finalResult = {
          safe: regexResult.safe && aiResult.safe,
          confidence: (regexResult.confidence + aiResult.confidence) / 2,
          threats: [...new Set([...regexResult.threats, ...aiResult.threats])],
          processingTime: Date.now() - startTime,
          validationType: 'hybrid',
          details: {
            regex: {
              safe: regexResult.safe,
              confidence: regexResult.confidence,
              threats: regexResult.threats,
              time: regexResult.processingTime
            },
            ai: {
              safe: aiResult.safe,
              confidence: aiResult.confidence,
              threats: aiResult.threats,
              model: aiResult.model,
              time: aiResult.processingTime,
              cost: aiResult.cost,
              reasoning: aiResult.reasoning
            }
          }
        };

      } catch (aiError) {
        console.error('AI validation error:', aiError);

        // Fall back to regex result if AI fails
        finalResult.aiError = aiError.message;
        finalResult.validationType = 'regex-fallback';
      }
    }

    // Determine action recommendation
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
      processingTime: finalResult.processingTime,
      validationType: finalResult.validationType,
      cached: false
    };

    // Cache the result before returning
    cache.set(prompt, response);

    // Add details in non-production mode
    if (process.env.NODE_ENV !== 'production' || req.body.debug) {
      response.details = finalResult.details;
      response.debug = {
        promptLength: prompt.length,
        mode: mode,
        aiUsed: needsAI,
        aiError: finalResult.aiError,
        cacheStats: cache.getStats()
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