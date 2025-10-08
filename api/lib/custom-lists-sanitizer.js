/**
 * Custom Lists Sanitizer
 *
 * Validates and sanitizes custom whitelist/blacklist phrases to prevent:
 * - Code injection attacks
 * - Path traversal
 * - SQL injection
 * - Malicious patterns
 *
 * Part of Custom Lists V2 feature (Phase 2)
 */

/**
 * Allowed characters in custom phrases
 * Letters, numbers, spaces, hyphens, underscores, apostrophes, periods, hash, at symbol
 */
export const ALLOWED_CHARACTERS = /^[a-zA-Z0-9\s\-_'.#@]+$/;

/**
 * Phrase length constraints
 */
export const MIN_PHRASE_LENGTH = 2;
export const MAX_PHRASE_LENGTH = 100;

/**
 * Forbidden patterns that could indicate malicious intent
 * These patterns are blocked to prevent abuse of custom lists
 */
export const FORBIDDEN_PATTERNS = [
  { pattern: /script/i, description: 'script keyword' },
  { pattern: /eval/i, description: 'eval keyword' },
  { pattern: /exec/i, description: 'exec keyword' },
  { pattern: /system/i, description: 'system keyword' },
  { pattern: /rm\s+-rf/i, description: 'dangerous command' },
  { pattern: /\.\./i, description: 'path traversal' },
  { pattern: /\.env/i, description: 'environment file reference' },
  { pattern: /\/etc\/passwd/i, description: 'system file reference' },
  { pattern: /DROP\s+TABLE/i, description: 'SQL injection' },
  { pattern: /base64/i, description: 'encoding attempt' },
  { pattern: /\\x[0-9a-f]{2}/i, description: 'hex encoding' }
];

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Sanitize a custom phrase for use in whitelist/blacklist
 *
 * @param {string} phrase - The phrase to sanitize
 * @returns {Object} { phrase: string, warning: string|null }
 * @throws {ValidationError} If phrase is invalid
 */
export function sanitizeCustomPhrase(phrase) {
  // Type validation
  if (typeof phrase !== 'string') {
    throw new ValidationError('Phrase must be a string');
  }

  // Trim whitespace
  const trimmed = phrase.trim();

  // Empty check
  if (trimmed.length === 0) {
    throw new ValidationError('Phrase cannot be empty');
  }

  // Length validation
  if (trimmed.length < MIN_PHRASE_LENGTH) {
    throw new ValidationError(`Phrase must be at least ${MIN_PHRASE_LENGTH} characters`);
  }

  if (trimmed.length > MAX_PHRASE_LENGTH) {
    throw new ValidationError(`Phrase cannot exceed ${MAX_PHRASE_LENGTH} characters`);
  }

  // Character validation
  if (!ALLOWED_CHARACTERS.test(trimmed)) {
    throw new ValidationError('Phrase contains invalid characters. Allowed: letters, numbers, spaces, hyphens, underscores, apostrophes, periods, #, @');
  }

  // Forbidden pattern check
  for (const { pattern, description } of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new ValidationError(`Phrase matches forbidden pattern: ${description}`);
    }
  }

  // Single-word warning (not an error)
  const wordCount = trimmed.split(/\s+/).length;
  let warning = null;

  if (wordCount === 1) {
    warning = 'Single-word phrase may cause false positives. Consider adding context (e.g., "reset password" instead of "password")';
  }

  return {
    phrase: trimmed.toLowerCase(),
    warning
  };
}

/**
 * Sanitize an array of custom phrases
 *
 * @param {string[]} phrases - Array of phrases to sanitize
 * @returns {Object} { sanitized: Array<{phrase, warning}>, errors: Array<{phrase, error}> }
 */
export function sanitizeCustomPhrases(phrases) {
  if (!Array.isArray(phrases)) {
    throw new ValidationError('Phrases must be an array');
  }

  const sanitized = [];
  const errors = [];

  for (const phrase of phrases) {
    try {
      const result = sanitizeCustomPhrase(phrase);
      sanitized.push(result);
    } catch (error) {
      errors.push({
        phrase,
        error: error.message
      });
    }
  }

  return { sanitized, errors };
}

/**
 * Sanitize custom rules object (whitelist + blacklist)
 *
 * @param {Object} rules - { whitelist: string[], blacklist: string[] }
 * @returns {Object} {
 *   whitelist: Array<{phrase, warning}>,
 *   blacklist: Array<{phrase, warning}>,
 *   errors: { whitelist: Array, blacklist: Array }
 * }
 */
export function sanitizeCustomRules(rules) {
  if (!rules || typeof rules !== 'object') {
    throw new ValidationError('Rules must be an object');
  }

  const whitelist = rules.whitelist || [];
  const blacklist = rules.blacklist || [];

  const whitelistResult = sanitizeCustomPhrases(whitelist);
  const blacklistResult = sanitizeCustomPhrases(blacklist);

  return {
    whitelist: whitelistResult.sanitized,
    blacklist: blacklistResult.sanitized,
    errors: {
      whitelist: whitelistResult.errors,
      blacklist: blacklistResult.errors
    }
  };
}

export default {
  sanitizeCustomPhrase,
  sanitizeCustomPhrases,
  sanitizeCustomRules,
  ValidationError,
  ALLOWED_CHARACTERS,
  MIN_PHRASE_LENGTH,
  MAX_PHRASE_LENGTH,
  FORBIDDEN_PATTERNS
};
