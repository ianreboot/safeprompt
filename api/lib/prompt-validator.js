/**
 * SafePrompt Core Validation Module
 * Fast regex-based validation with confidence scoring
 * Integrated with hardened AI validator
 */

import { validateWithAI } from './ai-validator.js';

// Testing backdoor configuration
const TESTING_MODE = process.env.SAFEPROMPT_TESTING === 'true';
const TESTING_BACKDOORS = {
  // Special test prompts that bypass validation
  FORCE_SAFE: 'SAFEPROMPT_TEST_FORCE_SAFE',
  FORCE_MALICIOUS: 'SAFEPROMPT_TEST_FORCE_MALICIOUS',
  FORCE_ERROR: 'SAFEPROMPT_TEST_FORCE_ERROR',
  FORCE_TIMEOUT: 'SAFEPROMPT_TEST_FORCE_TIMEOUT',
  // Special patterns to test edge cases
  DISABLE_PATTERN: 'SAFEPROMPT_DISABLE_PATTERN:',
  TRIGGER_PATTERN: 'SAFEPROMPT_TRIGGER_PATTERN:'
};

// Confidence thresholds for decision making
export const CONFIDENCE_THRESHOLDS = {
  DEFINITELY_SAFE: 0.95,      // Skip AI check
  PROBABLY_SAFE: 0.80,         // Skip AI unless paranoid mode
  UNCERTAIN: 0.60,             // Check with AI
  PROBABLY_UNSAFE: 0.40,       // Check with AI to confirm
  DEFINITELY_UNSAFE: 0.10      // Block immediately
};

/**
 * Decodes common encoding bypasses used in injection attacks
 */
function decodeEncodingBypasses(input) {
  let decoded = input;

  try {
    // Unicode escape sequences (\u0041 -> A)
    decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });

    // Hex escape sequences (\x41 -> A)
    decoded = decoded.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // URL encoding (%41 -> A, %3C -> <)
    decoded = decoded.replace(/%([0-9a-fA-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // HTML numeric entities (&#65; -> A, &#x41; -> A)
    decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 10));
    });
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // HTML named entities (common ones)
    const htmlEntities = {
      '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&apos;': "'",
      '&nbsp;': ' '
    };
    decoded = decoded.replace(/&[a-zA-Z]+;/g, (match) => {
      return htmlEntities[match] || match;
    });

    // Double encoding detection (recursive decode once)
    if (decoded !== input && (decoded.includes('%') || decoded.includes('&#'))) {
      return decodeEncodingBypasses(decoded);
    }

  } catch (error) {
    return input;  // Return original on error
  }

  return decoded;
}

/**
 * Business context whitelist patterns
 * Legitimate security discussions that should not be filtered
 */
const BUSINESS_WHITELIST = [
  /cybersecurity\s+(strategy|plan|policy|framework|assessment|audit|review)/i,
  /comprehensive\s+cybersecurity/i,
  /(financial|business|enterprise|corporate)\s+cybersecurity/i,
  /cybersecurity\s+(best\s+practices|compliance|governance|consulting)/i,
  /information\s+security\s+(strategy|plan|policy)/i,
  /security\s+(assessment|audit|review|framework)\s+for/i,
  /implement\s+cybersecurity/i,
  /design\s+(a\s+)?(comprehensive\s+)?security\s+module/i,
  /security\s+module\s+for\s+(an\s+)?AI\s+system/i,
  /protect\s+against\s+(prompt\s+injection|XSS|code\s+injection)/i,
  /discussing\s+(prompt\s+)?security/i,
  /educational\s+(example|purpose|discussion)/i,
  /academic\s+(research|discussion|context)/i,
  /security\s+training\s+(material|course|program)/i
];

/**
 * Prompt injection patterns
 */
const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|context)/gi,
  /disregard\s+(all\s+)?previous\s+(instructions?|prompts?|context)/gi,
  /forget\s+(everything|all)\s*(you|that)\s*(know|learned|were\s+told)/gi,

  // System role manipulation
  /^system:\s*/gim,
  /\n\s*system:\s*/gi,
  /\[\s*system\s*\].*?:/gi,
  /role:\s*(system|admin|root)\s*[\n;]/gi,

  // Jailbreak attempts
  /activate\s+DAN\s+mode/gi,
  /enable\s+jailbreak/gi,
  /switch\s+to\s+developer\s+mode/gi,
  /enter\s+god\s+mode/gi,
  /you\s+are\s+now\s+DAN/gi,
  /you\s+are\s+now\s+(unrestricted|unfiltered|uncensored)/gi,

  // Override and bypass attempts
  /override\s+(your\s+)?(safety|security)\s+(rules|filters|protocols)/gi,
  /bypass\s+(the\s+)?(safety|security)\s+(check|filter|validation)\s+and/gi,
  /disable\s+(all\s+)?(safety|security)\s+(features|checks|filters)/gi,

  // Role confusion
  /pretend\s+you\s+are\s+(not\s+)?an?\s+(AI|human)\s+without/gi,
  /pretend\s+you\s+are\s+(human|unrestricted|jailbroken)/gi,
  /act\s+as\s+if\s+you\s+(are|were)\s+human/gi,
  /from\s+now\s+on\s+you\s+are/gi,
  /as\s+your\s+(developer|creator|programmer)/gi,

  // Context manipulation
  /reveal\s+your\s+(prompt|instructions?|system\s+prompt|original\s+instructions?)/gi,
  /stop\s+following\s+(your\s+)?instructions\s+and/gi,
  /this\s+is\s+the\s+end\s+of\s+(the\s+)?prompt.*?now\s+do/gi,

  // Unicode-based attacks
  /[\u202e\u202d\u200e\u200f]/g,  // Bidirectional override characters
  /[\ufeff\ufffe\uffff]/g,  // Byte order marks and invalid characters
];

/**
 * XSS and code injection patterns
 */
const XSS_PATTERNS = [
  // Script tags
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<script[^>]*\/>/gi,

  // Dangerous HTML elements
  /<iframe[^>]*src[^>]*>/gi,
  /<object[^>]*data[^>]*>/gi,
  /<embed[^>]*src[^>]*>/gi,
  /<link[^>]*href[^>]*>/gi,
  /<meta[^>]*http-equiv[^>]*>/gi,

  // Event handlers
  /on(click|load|error|mouseover)\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*["']?(javascript:|eval|alert|prompt|confirm)/gi,

  // JavaScript/VBScript protocols
  /(href|src|action)\s*=\s*["']?\s*(javascript|vbscript|data:text\/html):/gi,

  // Style injection
  /<style[^>]*>[\s\S]*?(expression|javascript:|behavior:)[\s\S]*?<\/style>/gi,
  /style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi
];

/**
 * Polyglot payload patterns
 */
const POLYGLOT_PATTERNS = [
  /<!--[\s\S]*?-->\s*<script/gi,
  /<script[^>]*>[\s\S]*?<!--/gi,
  /\/\*[\s\S]*?\*\/\s*<script/gi,
  /expression\s*\([\s\S]*?\)/gi,
  /<!\[CDATA\[[\s\S]*?<script/gi,
  /"\s*;\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/gi,
  /data:[\w\/]+;base64,[\w+\/=]+/gi
];

/**
 * Validate a prompt using pattern matching only (sync)
 */
export function validatePromptSync(prompt) {
  const startTime = Date.now();

  // Testing backdoor handling
  if (TESTING_MODE) {
    // Force safe result for testing
    if (prompt === TESTING_BACKDOORS.FORCE_SAFE) {
      return {
        safe: true,
        threats: [],
        confidence: 1.0,
        processingTime: Date.now() - startTime,
        testing: true,
        backdoor: 'force_safe'
      };
    }

    // Force malicious result for testing
    if (prompt === TESTING_BACKDOORS.FORCE_MALICIOUS) {
      return {
        safe: false,
        threats: ['test_injection', 'backdoor_triggered'],
        confidence: 1.0,
        processingTime: Date.now() - startTime,
        testing: true,
        backdoor: 'force_malicious'
      };
    }

    // Force error for testing
    if (prompt === TESTING_BACKDOORS.FORCE_ERROR) {
      throw new Error('Test error triggered by backdoor');
    }

    // Disable specific pattern for testing
    if (prompt.startsWith(TESTING_BACKDOORS.DISABLE_PATTERN)) {
      const pattern = prompt.substring(TESTING_BACKDOORS.DISABLE_PATTERN.length);
      console.log(`[TESTING] Disabling pattern: ${pattern}`);
      // Continue with normal validation but log the disabled pattern
    }

    // Trigger specific pattern for testing
    if (prompt.startsWith(TESTING_BACKDOORS.TRIGGER_PATTERN)) {
      const pattern = prompt.substring(TESTING_BACKDOORS.TRIGGER_PATTERN.length);
      return {
        safe: false,
        threats: [pattern],
        confidence: 1.0,
        processingTime: Date.now() - startTime,
        testing: true,
        backdoor: 'trigger_pattern'
      };
    }
  }

  try {
    // Normalize input
    let normalizedPrompt = prompt.normalize('NFKC');
    normalizedPrompt = decodeEncodingBypasses(normalizedPrompt);

    // Check for control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalizedPrompt)) {
      return {
        safe: false,
        threats: ['control_characters'],
        confidence: 0.95,
        processingTime: Date.now() - startTime
      };
    }

    // Check if it's a legitimate business use
    const isBusinessUse = BUSINESS_WHITELIST.some(pattern => pattern.test(normalizedPrompt));
    const containsObviousAttack = /ignore\s+(all\s+)?previous\s+instructions|reveal\s+your\s+(prompt|system|instructions)/i.test(normalizedPrompt);
    const isLegitimate = isBusinessUse && !containsObviousAttack;

    const threats = [];
    let mixedSignals = false;

    // Check for polyglot payloads
    for (const pattern of POLYGLOT_PATTERNS) {
      if (pattern.test(normalizedPrompt)) {
        threats.push('polyglot_payload');
        break;
      }
    }

    // Check for prompt injection (skip if legitimate business use)
    if (!isLegitimate) {
      for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(normalizedPrompt)) {
          threats.push('prompt_injection');
          break;
        }
      }
    } else if (containsObviousAttack) {
      mixedSignals = true;
    }

    // Check for XSS patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(normalizedPrompt)) {
        threats.push('xss_attempt');
        break;
      }
    }

    // Additional HTML tag check
    const hasHtmlTags = /<[^>]+>/.test(normalizedPrompt);
    if (hasHtmlTags && !threats.includes('xss_attempt')) {
      const safeTagPattern = /^<\/?(?:b|i|u|em|strong|code|pre|br|p|div|span)\s*\/?>$/i;
      const tags = normalizedPrompt.match(/<[^>]+>/g) || [];
      const hasUnsafeTags = tags.some(tag => !safeTagPattern.test(tag));

      if (hasUnsafeTags) {
        threats.push('html_injection');
      }
    }

    // Check for encoded attacks
    const encodedPatterns = [
      /&lt;script&gt;/gi,
      /&#x3c;script&#x3e;/gi,
      /&#60;script&#62;/gi,
      /%3Cscript%3E/gi
    ];

    for (const pattern of encodedPatterns) {
      if (pattern.test(normalizedPrompt)) {
        threats.push('encoded_attack');
        break;
      }
    }

    // Calculate confidence
    const confidence = calculateConfidence({
      threats,
      inputLength: prompt.length,
      isLegitimateBusinessUse: isLegitimate,
      mixedSignals
    });

    // Determine safety
    const safe = threats.length === 0;

    return {
      safe,
      threats,
      confidence,
      processingTime: Date.now() - startTime,
      isLegitimateBusinessUse: isLegitimate,
      mixedSignals
    };

  } catch (error) {
    // On error, fail closed
    return {
      safe: false,
      threats: ['validation_error'],
      confidence: 0.01,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Calculate confidence score based on validation results
 */
export function calculateConfidence(validationResult) {
  // Start with base confidence
  let confidence = 0.5;

  // Adjust based on threats detected
  if (validationResult.threats.length === 0) {
    confidence = 0.95;  // No threats found

    // Slightly lower if it's very short (could be incomplete)
    if (validationResult.inputLength < 10) {
      confidence = 0.90;
    }

    // Perfect confidence for legitimate business use
    if (validationResult.isLegitimateBusinessUse) {
      confidence = 0.98;
    }
  } else {
    // Calculate based on threat severity
    const threatSeverity = {
      'control_characters': 0.95,
      'prompt_injection': 0.90,
      'xss_attempt': 0.85,
      'polyglot_payload': 0.95,
      'html_injection': 0.70,
      'encoded_attack': 0.80,
      'validation_error': 0.99
    };

    // Use highest severity threat
    let maxSeverity = 0;
    for (const threat of validationResult.threats) {
      const severity = threatSeverity[threat] || 0.75;
      maxSeverity = Math.max(maxSeverity, severity);
    }

    // Invert for confidence (high severity = low confidence it's safe)
    confidence = 1 - maxSeverity;
  }

  // Adjust for mixed signals
  if (validationResult.mixedSignals) {
    confidence *= 0.7;
  }

  // Ensure confidence is in valid range
  return Math.max(0.01, Math.min(0.99, confidence));
}

/**
 * Determine if AI validation is needed based on confidence
 */
export function needsAIValidation(confidence, mode = 'standard') {
  if (mode === 'paranoid') {
    return true;  // Always use AI in paranoid mode
  }

  if (mode === 'fast') {
    return confidence < CONFIDENCE_THRESHOLDS.UNCERTAIN;  // Only uncertain cases
  }

  // Standard mode
  return confidence < CONFIDENCE_THRESHOLDS.PROBABLY_SAFE;
}

/**
 * Validate a prompt with integrated hardened AI validator (async)
 * This is the main export that should be used in production
 */
export async function validatePrompt(prompt, options = {}) {
  const { mode = 'optimized' } = options;

  // For ai-only mode, use the hardened validator directly
  if (mode === 'ai-only') {
    return validateWithAI(prompt, {
      skipPatterns: true,
      skipExternalCheck: false
    });
  }

  // For standard and optimized modes, ALWAYS use AI validator
  // Pattern matching is done inside the hardened validator anyway
  if (mode === 'standard' || mode === 'optimized') {
    // Use hardened AI validator which includes pattern matching
    const aiResult = await validateWithAI(prompt, {
      skipPatterns: false,  // Use patterns for quick detection
      skipExternalCheck: false  // Check external references
    });

    return {
      ...aiResult,
      mode
    };
  }

  // Default fallback
  return validatePromptSync(prompt);
}