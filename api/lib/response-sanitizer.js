/**
 * Response Sanitizer for SafePrompt API
 *
 * Removes internal implementation details from API responses
 * Maps internal stages to public-facing detection methods
 *
 * Internal stages (hidden from public):
 * - xss_pattern, sql_pattern, template_pattern, command_pattern
 * - external_reference
 * - pass1, pass2
 * - testing (backdoor)
 *
 * Public detection methods (exposed):
 * - pattern_detection
 * - reference_detection
 * - ai_validation
 */

/**
 * Map internal stage to public detection method
 */
function mapStageToDetectionMethod(stage) {
  if (!stage) return 'pattern_detection';

  // Pattern-based detections (instant, zero-cost)
  if (stage.includes('pattern') ||
      stage === 'xss_pattern' ||
      stage === 'sql_pattern' ||
      stage === 'template_pattern' ||
      stage === 'command_pattern') {
    return 'pattern_detection';
  }

  // External reference detection
  if (stage === 'external_reference') {
    return 'reference_detection';
  }

  // AI-based validation (pass1 or pass2)
  if (stage === 'pass1' || stage === 'pass2' || stage.includes('pass')) {
    return 'ai_validation';
  }

  // Testing backdoor
  if (stage === 'testing') {
    return 'testing';
  }

  // Default fallback
  return 'pattern_detection';
}

/**
 * Get human-friendly description of detection method
 */
function getDetectionMethodDescription(detectionMethod) {
  switch (detectionMethod) {
    case 'pattern_detection':
      return 'Instant pattern matching';
    case 'reference_detection':
      return 'External reference analysis';
    case 'ai_validation':
      return 'AI-powered validation';
    case 'testing':
      return 'Testing mode';
    default:
      return 'Security validation';
  }
}

/**
 * Sanitize reasoning text to remove internal details
 */
function sanitizeReasoning(reasoning) {
  if (!reasoning) return reasoning;

  return reasoning
    // Remove "Pass 1" and "Pass 2" references
    .replace(/Pass 1/gi, 'AI validation')
    .replace(/Pass 2/gi, 'advanced validation')
    // Remove other internal references
    .replace(/\bpass1\b/gi, 'validation')
    .replace(/\bpass2\b/gi, 'validation');
}

/**
 * Sanitize validator response for public API
 * Removes internal implementation details
 */
export function sanitizeResponse(validatorResult) {
  const {
    safe,
    confidence,
    threats,
    reasoning,
    processingTime,
    stage,
    cost,
    externalReferences,
    ...otherFields
  } = validatorResult;

  // Map internal stage to public detection method
  const detectionMethod = mapStageToDetectionMethod(stage);

  // Build sanitized response
  const sanitized = {
    safe,
    confidence,
    threats: threats || [],
    reasoning: sanitizeReasoning(reasoning),
    processingTime,
    detectionMethod,
    detectionDescription: getDetectionMethodDescription(detectionMethod)
  };

  // Only include external references if present
  if (externalReferences !== undefined) {
    sanitized.hasExternalReferences = externalReferences;
  }

  return sanitized;
}

/**
 * Sanitize response with optional internal mode
 * Internal users (testing, monitoring) get full details BUT reasoning is always sanitized
 */
export function sanitizeResponseWithMode(validatorResult, options = {}) {
  const { includeInternals = false } = options;

  // ALWAYS sanitize reasoning text to remove "Pass 1" references
  const sanitizedReasoning = sanitizeReasoning(validatorResult.reasoning);

  // Internal mode: return everything but with sanitized reasoning
  if (includeInternals) {
    return {
      ...validatorResult,
      reasoning: sanitizedReasoning
    };
  }

  // Public mode: full sanitization
  return sanitizeResponse(validatorResult);
}

/**
 * Check if API key is internal (testing/monitoring account)
 */
export function isInternalApiKey(apiKey) {
  if (!apiKey) return false;

  const internalKeys = [
    'sp_test_unlimited_dogfood_key_2025',
    'sp_internal_testing_',
    'sp_monitor_'
  ];

  return internalKeys.some(prefix => apiKey.startsWith(prefix));
}
