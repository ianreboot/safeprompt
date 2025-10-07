/**
 * Default Whitelist and Blacklist for Custom Lists Feature
 *
 * These lists replace the automatic business/educational context detection.
 * All phrases are 2+ words for safety (reduces false positives).
 *
 * - Free tier: Gets these lists (read-only)
 * - Paid tiers: Gets these lists + can edit/remove + add custom phrases
 */

/**
 * DEFAULT_WHITELIST
 *
 * Phrases that increase business context confidence (0.8)
 * These guide AI to recognize legitimate business operations.
 *
 * Converted from:
 * - BUSINESS_CONTEXT_KEYWORDS (20 keywords → 2+ word phrases)
 * - EDUCATIONAL_CONTEXT_KEYWORDS (19 keywords → 2+ word phrases)
 * - BUSINESS_WHITELIST patterns (14 regex → phrase equivalents)
 */
export const DEFAULT_WHITELIST = [
  // Business Operations (from BUSINESS_CONTEXT_KEYWORDS)
  "business meeting",
  "team meeting",
  "discussed yesterday",
  "discussed last week",
  "management approved",
  "emergency procedure",
  "standard process",
  "business process",
  "company policy",
  "policy update",
  "management directive",
  "quarterly budget",
  "budget projection",
  "order number",
  "ticket number",
  "support ticket",
  "customer refund",
  "subscription management",
  "support team",
  "supervisor approved",

  // Educational/Security Research (from EDUCATIONAL_CONTEXT_KEYWORDS)
  "educational example",
  "training example",
  "course material",
  "explain how",
  "tutorial about",
  "demonstrate attack",
  "demonstrate how",
  "academic research",
  "research paper",
  "security team",
  "security training",
  "for learning",
  "teaching security",
  "thesis about",
  "study shows",
  "can you explain",
  "what is",

  // Technical Security Discussion (from BUSINESS_WHITELIST patterns)
  "cybersecurity strategy",
  "security assessment",
  "security audit",
  "implement security",
  "security framework",
  "security policy",
  "protect against injection",
  "protect against attack",
  "discussing security",
  "security module",
  "comprehensive security",
  "information security",
  "security best practices",

  // Common Business Phrases (from current test suite and real-world usage)
  "shipping address",
  "warehouse location",
  "inventory system",
  "customer service",
  "account settings",
  "user preferences",
  "override address",    // For Test #29 "Override shipping address"
  "reset password",      // Common legitimate operation
  "change password",
  "update profile",
  "billing information",
  "payment method"
];

/**
 * DEFAULT_BLACKLIST
 *
 * Phrases that increase attack confidence (0.9)
 * These guide AI to recognize potential credential exposure or PII leakage.
 *
 * All phrases are 2+ words for safety:
 * - "password" matches "reset password" (bad)
 * - "admin password" clearly refers to credentials (good)
 */
export const DEFAULT_BLACKLIST = [
  // Credential Exposure Prevention
  "database password",
  "admin password",
  "root password",
  "api secret key",
  "private api key",
  "private key",
  "secret key",
  "access token",
  "bearer token",
  "auth token",
  "database connection string",
  "connection string",
  "database credentials",

  // PII Protection
  "social security number",
  "ssn number",
  "credit card cvv",
  "credit card number",
  "card number",
  "bank account number",
  "account number",
  "driver license number",
  "passport number",

  // Infrastructure Access
  "ssh private key",
  "aws credentials",
  "azure credentials",
  "gcp credentials",
  "service account key",
  "root credentials",
  "admin credentials",
  "database user",
  "database host"
];

/**
 * Validation: Ensure all phrases are 2+ words
 * This runs at module load to catch any single-word phrases.
 */
function validateDefaultLists() {
  const errors = [];

  // Check whitelist
  for (const phrase of DEFAULT_WHITELIST) {
    const wordCount = phrase.trim().split(/\s+/).length;
    if (wordCount < 2) {
      errors.push(`DEFAULT_WHITELIST contains single-word phrase: "${phrase}"`);
    }
  }

  // Check blacklist
  for (const phrase of DEFAULT_BLACKLIST) {
    const wordCount = phrase.trim().split(/\s+/).length;
    if (wordCount < 2) {
      errors.push(`DEFAULT_BLACKLIST contains single-word phrase: "${phrase}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Default lists validation failed:\n${errors.join('\n')}`);
  }
}

// Run validation on module load
validateDefaultLists();

/**
 * Get effective lists for a user
 * Merges defaults + custom - removed
 *
 * @param {Object} profile - User profile from database
 * @returns {Object} { whitelist: string[], blacklist: string[] }
 */
export function getEffectiveLists(profile) {
  let effectiveWhitelist = [];
  let effectiveBlacklist = [];

  // Add defaults if enabled
  if (profile.uses_default_whitelist !== false) {  // Default true
    const removedWhitelist = profile.removed_defaults?.whitelist || [];
    effectiveWhitelist = DEFAULT_WHITELIST.filter(
      phrase => !removedWhitelist.includes(phrase)
    );
  }

  if (profile.uses_default_blacklist !== false) {  // Default true
    const removedBlacklist = profile.removed_defaults?.blacklist || [];
    effectiveBlacklist = DEFAULT_BLACKLIST.filter(
      phrase => !removedBlacklist.includes(phrase)
    );
  }

  // Add custom phrases
  effectiveWhitelist = effectiveWhitelist.concat(profile.custom_whitelist || []);
  effectiveBlacklist = effectiveBlacklist.concat(profile.custom_blacklist || []);

  return {
    whitelist: effectiveWhitelist,
    blacklist: effectiveBlacklist
  };
}

/**
 * Check if phrase exists in default lists
 * Used for preventing removal of non-existent phrases
 *
 * @param {string} phrase - Phrase to check
 * @param {string} listType - 'whitelist' or 'blacklist'
 * @returns {boolean}
 */
export function isDefaultPhrase(phrase, listType) {
  if (listType === 'whitelist') {
    return DEFAULT_WHITELIST.includes(phrase.toLowerCase());
  } else if (listType === 'blacklist') {
    return DEFAULT_BLACKLIST.includes(phrase.toLowerCase());
  }
  return false;
}

export default {
  DEFAULT_WHITELIST,
  DEFAULT_BLACKLIST,
  getEffectiveLists,
  isDefaultPhrase
};
