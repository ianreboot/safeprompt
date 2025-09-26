/**
 * SafePrompt Core Validation Module - REFACTORED
 * Handles ONLY structural/technical validation
 * Semantic validation delegated to AI
 */

// Testing backdoor configuration (keep as-is)
const TESTING_MODE = process.env.SAFEPROMPT_TESTING === 'true';
const TESTING_BACKDOORS = {
  FORCE_SAFE: 'SAFEPROMPT_TEST_FORCE_SAFE',
  FORCE_MALICIOUS: 'SAFEPROMPT_TEST_FORCE_MALICIOUS',
  FORCE_ERROR: 'SAFEPROMPT_TEST_FORCE_ERROR'
};

/**
 * Decodes common encoding bypasses - KEEP THIS, it's structural
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
 * STRUCTURAL THREATS ONLY - Things code can detect deterministically
 */

// XSS and code injection patterns (KEEP - these are structural)
const XSS_PATTERNS = [
  // Script tags
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<script[^>]*\/>/gi,

  // Dangerous HTML elements
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<frame[^>]*>/gi,
  /<frameset[^>]*>/gi,
  /<applet[^>]*>/gi,

  // Event handlers
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^>\s]+/gi,

  // Dangerous protocols
  /(href|src|action|formaction|data|code|codebase)\s*=\s*["']?\s*(javascript|vbscript|data:text\/html|data:application)/gi,

  // Style injection with expression/behavior
  /style\s*=\s*["'][^"']*\s*(expression|behavior|javascript:)[^"']*["']/gi
];

// SQL injection patterns (STRUCTURAL - looking for SQL syntax, not meaning)
const SQL_PATTERNS = [
  // Classic SQL injection syntax
  /\bUNION\s+(ALL\s+)?SELECT\b/gi,
  /\bDROP\s+(TABLE|DATABASE)\b/gi,
  /\bEXEC(UTE)?\s+\w+/gi,
  /\bINSERT\s+INTO\s+\w+\s+VALUES/gi,
  /\bUPDATE\s+\w+\s+SET\s+\w+\s*=/gi,
  /\bDELETE\s+FROM\s+\w+/gi,

  // SQL comments that might hide injections
  /--[^\n]*$/gm,
  /\/\*[\s\S]*?\*\//g,

  // Common injection patterns
  /'\s*OR\s+'[^']*'\s*=\s*'[^']*'/gi,
  /"\s*OR\s+"[^"]*"\s*=\s*"[^"]*"/gi,
  /\d+\s*=\s*\d+\s*(AND|OR)\s+/gi
];

// Command injection patterns (STRUCTURAL)
const COMMAND_PATTERNS = [
  // Unix command chaining
  /;\s*(ls|cat|wget|curl|nc|bash|sh|python|perl|ruby|php)\b/gi,
  /\|\s*(ls|cat|wget|curl|nc|bash|sh|python|perl|ruby|php)\b/gi,
  /&&\s*(ls|cat|wget|curl|nc|bash|sh|python|perl|ruby|php)\b/gi,
  /\|\|\s*(ls|cat|wget|curl|nc|bash|sh|python|perl|ruby|php)\b/gi,

  // Command substitution
  /\$\([^)]+\)/g,
  /`[^`]+`/g,

  // Path traversal
  /\.\.\/|\.\.\\|\.\.%2[fF]|\.\.%5[cC]/g
];

// LDAP injection patterns (STRUCTURAL)
const LDAP_PATTERNS = [
  /\(\s*[&|!]\s*\(/g,
  /\)\s*\(\s*[&|!]/g,
  /\*\s*\)\s*\(/g
];

// XML injection patterns (STRUCTURAL)
const XML_PATTERNS = [
  /<!DOCTYPE[^>]+\[<!ENTITY/gi,
  /<!ENTITY\s+\w+\s+SYSTEM/gi,
  /<!\[CDATA\[[\s\S]*?\]\]>/g
];

// Polyglot patterns (STRUCTURAL - multi-context payloads)
const POLYGLOT_PATTERNS = [
  /<!--[\s\S]*?-->\s*<script/gi,
  /\/\*[\s\S]*?\*\/\s*<script/gi,
  /<!\[CDATA\[[\s\S]*?<script/gi,
  /data:[\w\/]+;base64,[\w+\/=]{100,}/gi  // Long base64 payloads
];

/**
 * Extract structural metadata for AI analysis
 */
function extractStructuralMetadata(prompt, normalized) {
  return {
    // Size characteristics
    length: prompt.length,
    lineCount: (prompt.match(/\n/g) || []).length + 1,

    // Character distribution
    hasControlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalized),
    hasBidiChars: /[\u202a-\u202e\u2066-\u2069]/.test(normalized),
    hasZeroWidth: /[\u200b-\u200f\u2060\ufeff]/.test(normalized),

    // Encoding indicators
    hasBase64: /[A-Za-z0-9+\/]{50,}={0,2}/.test(normalized),
    hasHexSequences: /(?:0x[0-9a-fA-F]{2,}|\\x[0-9a-fA-F]{2,})/.test(normalized),
    hasUnicodeEscapes: /\\u[0-9a-fA-F]{4}/.test(normalized),

    // Code-like characteristics
    hasHTMLTags: /<[^>]+>/.test(normalized),
    hasCodeBlockMarkers: /```[\s\S]*```/.test(normalized),
    hasCurlyBraces: /\{[\s\S]*\}/.test(normalized),
    hasSquareBrackets: /\[[\s\S]*\]/.test(normalized),

    // Suspicious patterns
    hasURLs: /https?:\/\/[^\s]+/.test(normalized),
    hasEmailAddresses: /[\w.-]+@[\w.-]+\.\w+/.test(normalized),
    hasIPAddresses: /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(normalized),

    // Statistical anomalies
    uppercaseRatio: (prompt.match(/[A-Z]/g) || []).length / prompt.length,
    specialCharRatio: (prompt.match(/[^a-zA-Z0-9\s]/g) || []).length / prompt.length,
    whitespaceRatio: (prompt.match(/\s/g) || []).length / prompt.length,

    // Repetition patterns
    hasRepeatingChars: /(.)\1{9,}/.test(normalized),  // Same char 10+ times
    hasRepeatingWords: /\b(\w+)\b(?:\s+\1\b){4,}/.test(normalized),  // Same word 5+ times

    // Decoded form differs from original
    wasEncoded: normalized !== prompt,
    decodedLength: normalized.length
  };
}

/**
 * Validate prompt - STRUCTURAL ONLY
 */
export function validatePromptStructure(prompt) {
  const startTime = Date.now();

  // Testing backdoors (keep for testing)
  if (TESTING_MODE) {
    if (prompt === TESTING_BACKDOORS.FORCE_SAFE) {
      return {
        safe: true,
        threats: [],
        confidence: 1.0,
        metadata: {},
        processingTime: Date.now() - startTime,
        testing: true
      };
    }
    if (prompt === TESTING_BACKDOORS.FORCE_MALICIOUS) {
      return {
        safe: false,
        threats: ['test_injection'],
        confidence: 1.0,
        metadata: {},
        processingTime: Date.now() - startTime,
        testing: true
      };
    }
    if (prompt === TESTING_BACKDOORS.FORCE_ERROR) {
      throw new Error('Test error triggered');
    }
  }

  try {
    // Normalize input
    let normalized = prompt.normalize('NFKC');
    normalized = decodeEncodingBypasses(normalized);

    const threats = [];

    // Check control characters (ALWAYS BAD)
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalized)) {
      threats.push('control_characters');
    }

    // Check XSS patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push('xss_attempt');
        break;
      }
    }

    // Check SQL injection
    for (const pattern of SQL_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push('sql_injection');
        break;
      }
    }

    // Check command injection
    for (const pattern of COMMAND_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push('command_injection');
        break;
      }
    }

    // Check LDAP injection
    for (const pattern of LDAP_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push('ldap_injection');
        break;
      }
    }

    // Check XML injection
    for (const pattern of XML_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push('xml_injection');
        break;
      }
    }

    // Check polyglot payloads
    for (const pattern of POLYGLOT_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push('polyglot_payload');
        break;
      }
    }

    // Check for safe HTML tags (not a threat, but metadata for AI)
    const hasHTMLTags = /<[^>]+>/.test(normalized);
    const safeTagPattern = /^<\/?(?:b|i|u|em|strong|code|pre|br|p|div|span|h[1-6]|a|ul|ol|li)\s*\/?>$/i;

    if (hasHTMLTags && !threats.includes('xss_attempt')) {
      const tags = normalized.match(/<[^>]+>/g) || [];
      const hasUnsafeTags = tags.some(tag => !safeTagPattern.test(tag));

      if (hasUnsafeTags) {
        threats.push('unsafe_html');
      }
    }

    // Extract metadata for AI
    const metadata = extractStructuralMetadata(prompt, normalized);

    // Calculate structural confidence
    let confidence = 0.5;
    if (threats.length === 0) {
      confidence = 0.2;  // Low confidence - need AI to check semantics
    } else if (threats.includes('xss_attempt') || threats.includes('sql_injection')) {
      confidence = 0.95;  // High confidence it's malicious
    } else {
      confidence = 0.7;  // Medium confidence
    }

    return {
      safe: threats.length === 0,
      threats,
      confidence,
      metadata,
      normalized,  // Pass normalized version to AI
      processingTime: Date.now() - startTime
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
 * Determine if AI validation is needed
 */
export function needsAIValidation(structuralResult, mode = 'standard') {
  // Always use AI in paranoid mode
  if (mode === 'paranoid') return true;

  // If structural validation found clear technical threats, maybe skip AI
  if (structuralResult.threats.includes('xss_attempt') ||
      structuralResult.threats.includes('sql_injection') ||
      structuralResult.threats.includes('command_injection')) {
    return mode !== 'fast';  // Skip AI in fast mode for obvious technical threats
  }

  // For everything else, we need AI to check semantics
  return true;
}