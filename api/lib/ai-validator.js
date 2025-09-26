/**
 * SafePrompt AI Validator - PRODUCTION
 * Uses hardened 2-pass validation with external reference detection
 *
 * Performance: 92.9% accuracy at $0.50/100K requests
 * Replaces: GPT-3.5 implementation ($150/100K)
 * Deployed: 2025-09-26
 */

import { validateHardened } from './ai-validator-hardened.js';
import dotenv from 'dotenv';

// Load environment variables - works both locally and on Vercel
dotenv.config();

// Testing backdoor configuration
const TESTING_MODE = process.env.SAFEPROMPT_TESTING === 'true';
const TESTING_BACKDOORS = {
  FORCE_AI_SAFE: 'SAFEPROMPT_AI_SAFE',
  FORCE_AI_MALICIOUS: 'SAFEPROMPT_AI_MALICIOUS',
  FORCE_AI_TIMEOUT: 'SAFEPROMPT_AI_TIMEOUT',
  FORCE_AI_ERROR: 'SAFEPROMPT_AI_ERROR'
};

/**
 * Main AI validation function
 * Called by prompt-validator.js when AI validation is needed
 *
 * @param {string} prompt - The prompt to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
export async function validateWithAI(prompt, options = {}) {
  const startTime = Date.now();

  // Handle testing backdoors for backward compatibility
  if (TESTING_MODE) {
    if (prompt === TESTING_BACKDOORS.FORCE_AI_SAFE) {
      return {
        safe: true,
        threats: [],
        confidence: 1.0,
        processingTime: Date.now() - startTime,
        testing: true,
        backdoor: 'force_safe',
        model: 'testing'
      };
    }

    if (prompt === TESTING_BACKDOORS.FORCE_AI_MALICIOUS) {
      return {
        safe: false,
        threats: ['test_injection', 'backdoor_triggered'],
        confidence: 1.0,
        processingTime: Date.now() - startTime,
        testing: true,
        backdoor: 'force_malicious',
        model: 'testing'
      };
    }

    if (prompt === TESTING_BACKDOORS.FORCE_AI_TIMEOUT) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      throw new Error('AI validation timeout (testing)');
    }

    if (prompt === TESTING_BACKDOORS.FORCE_AI_ERROR) {
      throw new Error('AI validation error (testing)');
    }
  }

  try {
    // Call the hardened validator with production settings
    const result = await validateHardened(prompt, {
      skipPatterns: false,      // Use pattern matching for instant detection ($0 cost)
      skipExternalCheck: false, // Check for external references (95% accuracy)
      preFilterThreshold: {
        high: 0.9,  // Block if Pass 1 says high risk with 90%+ confidence
        low: 0.7    // Allow if Pass 1 says low risk with 70%+ confidence
      },
      ...options
    });

    // Transform result to match existing interface
    const threats = [];

    // Map threats from hardened validator
    if (result.externalReferences) {
      threats.push('external_references');
    }

    if (result.threats && result.threats.length > 0) {
      threats.push(...result.threats);
    }

    if (!result.safe && threats.length === 0) {
      // Generic threat if none specified
      threats.push('ai_detected_manipulation');
    }

    // External references should mark as unsafe
    const safe = result.safe && !result.externalReferences;

    // Return in existing format for backward compatibility
    return {
      safe,
      threats,
      confidence: result.confidence,
      processingTime: Date.now() - startTime,
      model: result.model || 'hardened-2pass',

      // Additional fields from hardened version
      stage: result.stage,
      reasoning: result.reasoning,
      externalReferences: result.externalReferences,
      referenceTypes: result.referenceTypes,
      obfuscationDetected: result.obfuscationDetected,
      recommendation: result.recommendation,
      cost: result.cost
    };

  } catch (error) {
    console.error('[AI Validator] Production error:', error.message);

    // Fail closed on error - mark as unsafe
    return {
      safe: false,
      threats: ['validation_error'],
      confidence: 0.01,
      error: error.message,
      processingTime: Date.now() - startTime,
      model: 'error'
    };
  }
}

// Default export for compatibility
export default validateWithAI;