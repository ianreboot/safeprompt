/**
 * Unified Pattern Detection Module - Phase 2.3
 * Consolidates 7 pattern checks + external references into single stage
 *
 * Replaces scattered pattern detection in ai-validator-hardened.js with:
 * - Single context analysis (educational/business)
 * - All pattern checks in parallel
 * - Unified decision logic
 * - Clear 3-state output: SAFE | UNSAFE | SUSPICIOUS (requires AI)
 */

import { ExternalReferenceDetector } from './external-reference-detector.js';

/**
 * Pattern Detection Results
 * @typedef {Object} PatternDetectionResult
 * @property {boolean} safe - Whether input is safe (true = allow, false = block)
 * @property {number} confidence - Confidence level (0.0-1.0)
 * @property {string[]} threats - Array of detected threat types
 * @property {boolean} requiresAI - Whether AI validation is needed
 * @property {Object|null} context - Context information for AI validation
 * @property {string} reasoning - Human-readable explanation
 * @property {Object} metadata - Additional detection metadata
 */

// ============================================================================
// PATTERN DEFINITIONS (from ai-validator-hardened.js)
// ============================================================================

// Jailbreak patterns (common AI manipulation attempts)
const JAILBREAK_PATTERNS = [
  // Named jailbreaks
  /\bstan\b.*?\bstands for\b/i,
  /\baim\b.*?always intelligent and machiavellian/i,
  /\bdevmode\b.*?developer/i,
  /you are now.*?(dan|unrestricted|jailbroken)/i,
  /pretend to be.*?(dan|stan|aim|devmode)/i,
  /you are going to pretend to be/i,

  // Direct manipulation
  /^ignore all previous instructions/i,
  /^you are now (dan|jailbroken)/i,
  /^reveal your system prompt$/i,
  /^bypass (all )?safety checks?/i,
  /as your (developer|creator) at (anthropic|openai)/i,

  // Multi-language "ignore instructions" (obfuscation technique)
  /ignora.*?instrucciones anteriores/i, // Spanish
  /以前の指示を無視/i, // Japanese
  /忽略.*?说明/i, // Chinese
  /ignorez.*?instructions précédentes/i, // French
  /ignoriere.*?vorherigen anweisungen/i, // German
];

// Repetition/padding patterns (filter bypass attempts)
const REPETITION_PATTERNS = [
  /(.)\1{20,}/, // Same character repeated 20+ times
  /(\w+\s+)\1{8,}/, // Same word repeated 8+ times
];

// Enhanced XSS detection patterns
const XSS_ATTACK_PATTERNS = [
  // Script tags and variations
  /<script[^>]*>[\s\S]*?<\/script>/i,
  /<script[^>]*\/>/i,
  /javascript:\s*[^"\s]/i,

  // Event handlers
  /<[^>]+on\w+\s*=\s*[^>]*>/i,
  /on(load|error|click|mouseover|focus|blur|change)\s*=/i,

  // Dangerous elements
  /<(iframe|embed|object|svg)[^>]*>/i,

  // JavaScript execution methods
  /String\.fromCharCode\s*\(/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,

  // Common XSS vectors
  /<svg[^>]*on\w+/i,
  /<img[^>]*on\w+/i,
  /<body[^>]*on\w+/i,

  // Alert/prompt/confirm
  /alert\s*\([^)]*\)/i,
  /prompt\s*\([^)]*\)/i,
  /confirm\s*\([^)]*\)/i,

  // Data URIs with script content
  /data:text\/html[^"'\s]*script/gi
];

// Template injection patterns
const TEMPLATE_INJECTION_PATTERNS = [
  /\{\{[^}]*\}\}/,           // Jinja2/Angular
  /\$\{[^}]*\}/,             // JavaScript template literals
  /#\{[^}]*\}/,              // Ruby
  /<%[^%]*%>/,               // ERB/ASP
  /@\{[^}]*\}/,              // Razor
  /\[\[[^\]]*\]\]/,          // MediaWiki
  /\$\([^)]*\)/,             // Shell/Perl
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /'\s*(OR|AND)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /'\s*OR\s+\d+\s*=\s*\d+\s*--/i,
  /'\s*;\s*DROP\s+TABLE/i,
  /'\s*;\s*DELETE\s+FROM/i,
  /'\s*;\s*INSERT\s+INTO/i,
  /'\s*;\s*UPDATE\s+\w+\s+SET/i,
  /UNION\s+SELECT/i,
  /'\s*;\s*EXEC\s*\(/i,
  /'\s*;\s*EXECUTE\s*\(/i,
  /--\s*$/,
  /\/\*[\s\S]*?\*\//,
];

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /;\s*(ls|cat|rm|wget|curl|nc|bash|sh|python|perl|ruby|php)\s/i,
  /\|\s*(ls|cat|rm|wget|curl|nc|bash|sh|python|perl|ruby|php)\s/i,
  /`[^`]*`/,
  /\$\(.*?\)/,
  /&&\s*(ls|cat|rm|wget|curl|nc|bash|sh)\s/i,
  /\|\|\s*(ls|cat|rm|wget|curl|nc|bash|sh)\s/i,
];

// Semantic extraction patterns (indirect information retrieval)
const SEMANTIC_EXTRACTION_PATTERNS = [
  /tell me a (riddle|puzzle|game)\s+(where|that|whose)\s+(the\s+)?answer\s+(is|contains)/i,
  /what (word|phrase|term)\s+rhymes\s+with\s+(the\s+)?(password|secret|key|token)/i,
  /define\s+(the\s+)?(word|term)\s+that\s+(is|has).{0,50}(password|secret|key|letter)/i,
  /spell\s+out\s+(the\s+)?(password|secret|key|word)/i,
  /first\s+letter\s+of\s+(the\s+|each\s+)?(password|secret|word)/i,
  /hint\s+about\s+(the\s+)?(password|secret|key)/i,
  /acronym\s+(for|of)\s+(the\s+)?(password|secret)/i,
  /sounds\s+like\s+(the\s+)?(password|secret)/i,
];

// Execution command patterns (fetch and execute)
const EXECUTION_COMMAND_PATTERNS = [
  /(fetch|get|retrieve|download|load|pull).{0,30}(execute|run|eval|process)/i,
  /(visit|navigate|go to).{0,30}(execute|run|follow instructions)/i,
  /decode.{0,20}(execute|run|eval)/i,
  /translate.{0,20}(execute|run|eval)/i,
];

// Business context indicators (legitimate use of trigger words)
const BUSINESS_CONTEXT_KEYWORDS = [
  'meeting', 'discussed', 'yesterday', 'approved', 'emergency',
  'process', 'standard', 'policy', 'procedure', 'management',
  'directive', 'quarterly', 'budget', 'projection', 'order #',
  'ticket #', 'refund', 'subscription', 'support team', 'supervisor'
];

// Educational/security training context
const EDUCATIONAL_CONTEXT_KEYWORDS = [
  'educational', 'example', 'explain', 'training', 'course', 'lesson',
  'tutorial', 'demonstrate', 'learn', 'teach', 'academic', 'research',
  'paper', 'thesis', 'study', 'security team', 'for my', 'how does',
  'what is', 'can you explain'
];

// ============================================================================
// PATTERN CHECK FUNCTIONS
// ============================================================================

/**
 * Check for XSS attack patterns
 */
function checkXSSPatterns(text) {
  for (const pattern of XSS_ATTACK_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for template injection patterns
 */
function checkTemplateInjection(text) {
  for (const pattern of TEMPLATE_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for SQL injection patterns
 */
function checkSQLInjection(text) {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for command injection patterns
 */
function checkCommandInjection(text) {
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for semantic extraction patterns
 */
function checkSemanticExtraction(text) {
  for (const pattern of SEMANTIC_EXTRACTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for execution command patterns
 */
function checkExecutionCommands(text) {
  for (const pattern of EXECUTION_COMMAND_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for jailbreak patterns
 */
function checkJailbreakPatterns(text) {
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for repetition/padding patterns
 */
function checkRepetitionPatterns(text) {
  for (const pattern of REPETITION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for business context (legitimate use of trigger words)
 * Requires at least 2 business keywords for positive match
 */
function hasBusinessContext(text) {
  const lowerText = text.toLowerCase();
  let matchCount = 0;

  for (const keyword of BUSINESS_CONTEXT_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchCount++;
      if (matchCount >= 2) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for educational/training context
 * Only needs 1 educational keyword for positive match
 */
function hasEducationalContext(text) {
  const lowerText = text.toLowerCase();

  for (const keyword of EDUCATIONAL_CONTEXT_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// UNIFIED PATTERN DETECTOR
// ============================================================================

/**
 * Detect all patterns with unified context analysis
 *
 * Returns one of three states:
 * 1. SAFE: No patterns detected or patterns with legitimate context
 * 2. UNSAFE: Patterns detected without legitimate context (instant block)
 * 3. SUSPICIOUS: Patterns + context detected (requires AI validation)
 *
 * @param {string} prompt - The text to analyze
 * @returns {PatternDetectionResult} Detection result
 */
export function detectPatterns(prompt) {
  // Run all pattern checks in parallel (synchronous, fast)
  const patternResults = {
    xss: checkXSSPatterns(prompt),
    sql: checkSQLInjection(prompt),
    template: checkTemplateInjection(prompt),
    command: checkCommandInjection(prompt),
    semantic: checkSemanticExtraction(prompt),
    execution: checkExecutionCommands(prompt),
    jailbreak: checkJailbreakPatterns(prompt),
    repetition: checkRepetitionPatterns(prompt)
  };

  // Check context ONCE for all patterns (not 6 times!)
  const hasEduContext = hasEducationalContext(prompt);
  const hasBizContext = hasBusinessContext(prompt);
  const contextType = hasEduContext ? 'educational' : (hasBizContext ? 'business' : null);

  // External reference detection
  const detector = new ExternalReferenceDetector();
  const extResult = detector.detect(prompt);

  // Determine which patterns were detected
  const detectedPatterns = Object.entries(patternResults)
    .filter(([_, detected]) => detected)
    .map(([type, _]) => type);

  // ========================================================================
  // DECISION LOGIC: Unified pattern + context analysis
  // ========================================================================

  // 1. Jailbreak or repetition patterns → Always block (no context matters)
  if (patternResults.jailbreak) {
    return {
      safe: false,
      confidence: 0.95,
      threats: ['jailbreak_attempt'],
      requiresAI: false,
      context: null,
      reasoning: 'Jailbreak pattern detected (DAN, STAN, AIM, or multi-language bypass attempt)',
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: ['jailbreak'],
        contextType: null
      }
    };
  }

  if (patternResults.repetition) {
    return {
      safe: false,
      confidence: 0.92,
      threats: ['filter_bypass'],
      requiresAI: false,
      context: null,
      reasoning: 'Repetition/padding pattern detected (filter bypass attempt)',
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: ['repetition'],
        contextType: null
      }
    };
  }

  // 2. External references with encoding/obfuscation → Always block
  if (extResult.hasExternalReferences) {
    const isEncoded = extResult.types.includes('rot13_encoded') ||
                      extResult.types.includes('base64_encoded') ||
                      extResult.types.includes('hex_encoded');

    const isObfuscated = extResult.obfuscationDetected;

    if (isEncoded || isObfuscated) {
      const encodingType = extResult.types.find(t => t.includes('encoded'));
      return {
        safe: false,
        confidence: 0.90,
        threats: [isEncoded ? 'encoded_reference' : 'obfuscated_reference'],
        requiresAI: false,
        context: null,
        reasoning: isEncoded
          ? `${encodingType.replace('_', ' ').toUpperCase()} detected - likely evasion attempt`
          : 'Obfuscation detected (spaced URLs, defanged notation) - blocked as suspicious',
        metadata: {
          stage: 'external_reference',
          externalReferences: true,
          referenceTypes: extResult.types,
          obfuscationDetected: isObfuscated
        }
      };
    }

    // Check for action verbs + external references
    const actionPatterns = [
      /\bvisit\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\bcheck\s+out\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\baccess\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\bgo\s+to\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\bfetch\s+(the|this|it|that|from|https?|www\.|ftp)/i,
      /\bnavigate\s+(to|the|this)/i,
      /\bopen\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\bbrowse\s+(to|the|this|https?|www\.|ftp)/i,
      /\bclick\s+(on|the|this)/i,
      /\bfollow\s+(the|this|it|that)/i,
      /\bsee\s+what\b/i,
      /\blook\s+at\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\btell\s+me\s+what\b/i,
      /\breview\s+(the|this|it|that|https?|www\.|ftp)/i,
      /\bload\s+(the|this|it|that|from|https?|www\.|ftp)/i,
      /\bretrieve\s+(the|this|it|that|from|https?|www\.|ftp)/i
    ];

    // Sensitive file paths
    const sensitivePathPatterns = [
      /\/etc\/passwd/i,
      /\/etc\/shadow/i,
      /\/etc\/sudoers/i,
      /\/root\//i,
      /\.ssh\/id_rsa/i,
      /\.aws\/credentials/i,
      /\.env/i
    ];

    const hasAction = actionPatterns.some(pattern => pattern.test(prompt));
    const hasSensitivePath = extResult.types.includes('files') &&
      sensitivePathPatterns.some(pattern => pattern.test(prompt));

    if (hasAction || hasSensitivePath) {
      return {
        safe: false,
        confidence: hasSensitivePath ? 0.95 : 0.85,
        threats: [hasSensitivePath ? 'sensitive_file_reference' : 'external_reference_execution'],
        requiresAI: false,
        context: null,
        reasoning: hasSensitivePath
          ? 'Sensitive file path detected (e.g., /etc/passwd, credentials, private keys)'
          : 'Action + external reference detected - potential data exfiltration or execution',
        metadata: {
          stage: 'external_reference',
          externalReferences: true,
          referenceTypes: extResult.types,
          actionDetected: hasAction,
          sensitivePath: hasSensitivePath
        }
      };
    }

    // Plain external reference without action → Allow with warning (handled by caller)
    // Not returning here - will include in final result if no other threats
  }

  // 3. Attack patterns (XSS, SQL, Template, Command, Semantic, Execution)
  const attackPatterns = ['xss', 'sql', 'template', 'command', 'semantic', 'execution'];
  const detectedAttackPatterns = detectedPatterns.filter(p => attackPatterns.includes(p));

  if (detectedAttackPatterns.length > 0) {
    // Pattern detected WITH context → SUSPICIOUS (requires AI)
    if (contextType) {
      const primaryPattern = detectedAttackPatterns[0];
      return {
        safe: true, // Don't block yet - needs AI validation
        confidence: 0.65,
        threats: [], // No threats yet - context makes it ambiguous
        requiresAI: true, // MUST be validated by AI
        context: {
          detected: true,
          patternType: primaryPattern,
          contextType: contextType,
          allPatterns: detectedAttackPatterns,
          reasoning: `${primaryPattern.toUpperCase()} patterns detected with ${contextType} context - requires AI analysis to distinguish legitimate discussion from attack`
        },
        reasoning: `${primaryPattern.toUpperCase()} patterns detected with ${contextType} context - flagged as SUSPICIOUS, requires AI validation`,
        metadata: {
          stage: 'pattern_unified',
          detectedPatterns: detectedAttackPatterns,
          contextType: contextType
        }
      };
    }

    // Pattern detected WITHOUT context → UNSAFE (instant block)
    const primaryPattern = detectedAttackPatterns[0];
    const confidenceMap = {
      xss: 0.95,
      sql: 0.95,
      command: 0.95,
      execution: 0.92,
      template: 0.90,
      semantic: 0.90
    };

    const threatMap = {
      xss: 'xss_attack',
      sql: 'sql_injection',
      command: 'command_injection',
      execution: 'execution_command',
      template: 'template_injection',
      semantic: 'semantic_extraction'
    };

    const reasoningMap = {
      xss: 'XSS attack pattern detected (script execution attempt)',
      sql: 'SQL injection pattern detected (database manipulation attempt)',
      command: 'Command injection pattern detected (system command execution attempt)',
      execution: 'Execution command pattern detected (fetch/decode and execute instructions)',
      template: 'Template injection pattern detected (server-side code execution attempt)',
      semantic: 'Semantic extraction pattern detected (indirect information retrieval via riddles, rhymes, or definitions)'
    };

    return {
      safe: false,
      confidence: confidenceMap[primaryPattern] || 0.90,
      threats: [threatMap[primaryPattern] || primaryPattern],
      requiresAI: false,
      context: null,
      reasoning: reasoningMap[primaryPattern] || `${primaryPattern} attack pattern detected`,
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: detectedAttackPatterns,
        contextType: null
      }
    };
  }

  // 4. No patterns detected OR plain external references without action
  // → SAFE (no AI needed, or allow with warning for external refs)
  if (extResult.hasExternalReferences) {
    // Plain external reference allowed with warning
    const extractedRefs = extResult.details
      .slice(0, 5)
      .map(d => d.match || d.decoded || 'unknown')
      .filter((v, i, a) => a.indexOf(v) === i);

    return {
      safe: true,
      confidence: 0.70,
      threats: [],
      requiresAI: false,
      context: null,
      reasoning: 'External reference detected - content cannot be validated. Allowed with warning for downstream handling.',
      metadata: {
        stage: 'external_reference',
        externalReferences: true,
        referenceTypes: extResult.types,
        references: extractedRefs
      }
    };
  }

  // No patterns detected at all → SAFE
  return {
    safe: true,
    confidence: 0.00, // Zero confidence = no threats detected
    threats: [],
    requiresAI: false, // Clean input, no AI needed
    context: null,
    reasoning: 'No malicious patterns detected',
    metadata: {
      stage: 'pattern_unified',
      detectedPatterns: [],
      contextType: null
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Main function
  detectPatterns as default,

  // Pattern check functions (for testing)
  checkXSSPatterns,
  checkSQLInjection,
  checkTemplateInjection,
  checkCommandInjection,
  checkSemanticExtraction,
  checkExecutionCommands,
  checkJailbreakPatterns,
  checkRepetitionPatterns,

  // Context check functions (for testing)
  hasBusinessContext,
  hasEducationalContext
};
