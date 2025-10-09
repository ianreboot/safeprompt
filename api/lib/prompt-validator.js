/**
 * SafePrompt Core Validation Module
 * Fast regex-based validation with confidence scoring
 * Integrated with hardened AI validator
 */

import { validateWithAI } from './ai-validator.js';

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
// BUSINESS_WHITELIST removed - replaced by custom lists feature (Phase 2)

/**
 * Prompt injection patterns
 */
const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|context)/i,
  /disregard\s+(all\s+)?previous\s+(instructions?|prompts?|context)/i,
  /forget\s+(everything|all)\s*(you|that)\s*(know|learned|were\s+told)/i,

  // System role manipulation
  /^system:\s*/im,
  /\n\s*system:\s*/i,
  /\[\s*system\s*\].*?:/i,
  /role:\s*(system|admin|root)\s*[\n;]/i,

  // Jailbreak attempts
  /activate\s+DAN\s+mode/i,
  /enable\s+jailbreak/i,
  /switch\s+to\s+developer\s+mode/i,
  /enter\s+god\s+mode/i,
  /you\s+are\s+now\s+DAN/i,
  /you\s+are\s+now\s+(unrestricted|unfiltered|uncensored)/i,

  // Override and bypass attempts
  /override\s+(your\s+)?(safety|security)\s+(rules|filters|protocols)/i,
  /bypass\s+(the\s+)?(safety|security)\s+(check|filter|validation)\s+and/i,
  /disable\s+(all\s+)?(safety|security)\s+(features|checks|filters)/i,

  // Role confusion
  /pretend\s+you\s+are\s+(not\s+)?an?\s+(AI|human)\s+without/i,
  /pretend\s+you\s+are\s+(human|unrestricted|jailbroken)/i,
  /act\s+as\s+if\s+you\s+(are|were)\s+human/i,
  /from\s+now\s+on\s+you\s+are/i,
  /as\s+your\s+(developer|creator|programmer)/i,

  // Context manipulation
  /reveal\s+your\s+(prompt|instructions?|system\s+prompt|original\s+instructions?)/i,
  /stop\s+following\s+(your\s+)?instructions\s+and/i,
  /this\s+is\s+the\s+end\s+of\s+(the\s+)?prompt.*?now\s+do/i,

  // Unicode-based attacks
  /[\u202e\u202d\u200e\u200f]/g,  // Bidirectional override characters
  /[\ufeff\ufffe\uffff]/g,  // Byte order marks and invalid characters
];

/**
 * XSS and code injection patterns
 */
const XSS_PATTERNS = [
  // Script tags
  /<script[^>]*>[\s\S]*?<\/script>/i,
  /<script[^>]*\/>/i,

  // Dangerous HTML elements
  /<iframe[^>]*src[^>]*>/i,
  /<object[^>]*data[^>]*>/i,
  /<embed[^>]*src[^>]*>/i,
  /<link[^>]*href[^>]*>/i,
  /<meta[^>]*http-equiv[^>]*>/i,

  // Event handlers
  /on(click|load|error|mouseover)\s*=\s*["'][^"']*["']/i,
  /on\w+\s*=\s*["']?(javascript:|eval|alert|prompt|confirm)/i,

  // JavaScript/VBScript protocols
  /(href|src|action)\s*=\s*["']?\s*(javascript|vbscript|data:text\/html):/i,

  // Style injection
  /<style[^>]*>[\s\S]*?(expression|javascript:|behavior:)[\s\S]*?<\/style>/i,
  /style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi
];

/**
 * Polyglot payload patterns
 * Includes HTML+JavaScript and Markdown+HTML hybrids
 */
const POLYGLOT_PATTERNS = [
  // HTML comment + script
  /<!--[\s\S]*?-->\s*<script/i,
  /<script[^>]*>[\s\S]*?<!--/i,

  // CSS comment + script
  /\/\*[\s\S]*?\*\/\s*<script/i,
  /expression\s*\([\s\S]*?\)/i,

  // CDATA + script
  /<!\[CDATA\[[\s\S]*?<script/i,

  // String escape + function call
  /"\s*;\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/i,

  // Data URI (existing - catches some Markdown attacks)
  /data:[\w\/]+;base64,[\w+\/=]+/gi,

  // Markdown link with javascript: protocol
  /\[[\s\S]*?\]\s*\(\s*javascript:/i,

  // Markdown link with data: URI
  /\[[\s\S]*?\]\s*\(\s*data:/i,

  // Markdown image with onerror
  /!\[[\s\S]*?\]\s*\([^)]*["\s]onerror\s*=/i,

  // Markdown image with javascript:
  /!\[[\s\S]*?\]\s*\(\s*javascript:/i,

  // Markdown reference-style link with javascript:
  /\[[\s\S]*?\]:\s*javascript:/i,

  // Universal polyglot patterns (test multiple contexts simultaneously)
  /["']\s*[;!]?\s*--\s*["']?\s*<[^>]*>\s*=\s*[&{(]/i,  // Matches: "';!--"<XSS>=&{()}
  /["'][;!<>&{()\[\]]+["'][<>&{()\[\]]+/i              // Generalized multi-context break
];

/**
 * Validate a prompt using pattern matching only (sync)
 */
export function validatePromptSync(prompt) {
  const startTime = Date.now();

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

    // Check for obvious attack patterns
    const containsObviousAttack = /ignore\s+(all\s+)?previous\s+instructions|reveal\s+your\s+(prompt|system|instructions)/i.test(normalizedPrompt);

    const threats = [];
    let mixedSignals = false;

    // Check for polyglot payloads
    for (const pattern of POLYGLOT_PATTERNS) {
      if (pattern.test(normalizedPrompt)) {
        threats.push('polyglot_payload');
        break;
      }
    }

    // Check for prompt injection
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(normalizedPrompt)) {
        threats.push('prompt_injection');
        break;
      }
    }

    // Check if obvious attack (for mixed signals detection)
    if (containsObviousAttack) {
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
      /&lt;script&gt;/i,
      /&#x3c;script&#x3e;/i,
      /&#60;script&#62;/i,
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
      mixedSignals
    });

    // Determine safety
    const safe = threats.length === 0;

    return {
      safe,
      threats,
      confidence,
      processingTime: Date.now() - startTime,
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