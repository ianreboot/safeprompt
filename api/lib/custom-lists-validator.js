/**
 * Custom Lists Validator
 *
 * Enforces tier limits and merges default + custom + profile lists
 *
 * Part of Custom Lists V2 feature (Phase 2)
 */

import { DEFAULT_WHITELIST, DEFAULT_BLACKLIST, getEffectiveLists as getDefaultLists } from './default-lists.js';

/**
 * Tier limits for custom lists
 * Free tier gets read-only defaults, paid tiers can add custom phrases
 */
export const TIER_LIMITS = {
  free: {
    customRulesEnabled: false,    // Cannot add custom rules
    defaultListsEnabled: true,     // Gets read-only default lists
    canEditDefaults: false,        // Cannot remove/modify defaults
    maxCustomWhitelist: 0,
    maxCustomBlacklist: 0,
    maxTotalRules: 98              // Just the defaults (70 whitelist + 28 blacklist)
  },

  starter: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,         // Can remove default phrases
    maxCustomWhitelist: 10,
    maxCustomBlacklist: 10,
    maxTotalRules: 118             // Defaults (98) + custom (20)
  },

  business: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,
    maxCustomWhitelist: 50,
    maxCustomBlacklist: 50,
    maxTotalRules: 198             // Defaults (98) + custom (100)
  },

  enterprise: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,
    maxCustomWhitelist: 200,
    maxCustomBlacklist: 200,
    maxTotalRules: 498             // Defaults (98) + custom (400)
  },

  internal: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,
    maxCustomWhitelist: 50,
    maxCustomBlacklist: 50,
    maxTotalRules: 198
  }
};

/**
 * Custom validation error class
 */
class TierLimitError extends Error {
  constructor(message, tier, limit) {
    super(message);
    this.name = 'TierLimitError';
    this.tier = tier;
    this.limit = limit;
  }
}

/**
 * Validate custom rules against tier limits
 *
 * @param {Object} customRules - { whitelist: string[], blacklist: string[] }
 * @param {string} tier - User's tier (free, starter, business, enterprise, internal)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateCustomRulesForTier(customRules, tier = 'free') {
  const errors = [];

  // Normalize tier to lowercase
  const normalizedTier = tier.toLowerCase();

  // Check tier exists
  if (!TIER_LIMITS[normalizedTier]) {
    errors.push(`Invalid tier: ${tier}`);
    return { valid: false, errors };
  }

  const limits = TIER_LIMITS[normalizedTier];

  // Check if custom rules are enabled for this tier
  if (!limits.customRulesEnabled) {
    if ((customRules?.whitelist?.length > 0) || (customRules?.blacklist?.length > 0)) {
      errors.push(`Custom rules not available on ${tier} tier. Upgrade to Starter or higher.`);
    }
  }

  // Validate whitelist count
  const whitelistCount = customRules?.whitelist?.length || 0;
  if (whitelistCount > limits.maxCustomWhitelist) {
    errors.push(`Whitelist exceeds limit: ${whitelistCount}/${limits.maxCustomWhitelist} for ${tier} tier`);
  }

  // Validate blacklist count
  const blacklistCount = customRules?.blacklist?.length || 0;
  if (blacklistCount > limits.maxCustomBlacklist) {
    errors.push(`Blacklist exceeds limit: ${blacklistCount}/${limits.maxCustomBlacklist} for ${tier} tier`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get effective lists for a user
 * Merges: default lists + custom lists - removed defaults
 *
 * Priority:
 * 1. Request-level customRules (passed in API request)
 * 2. Profile-level custom lists (stored in database)
 * 3. Default lists (if enabled)
 *
 * @param {Object} options
 * @param {Object} options.customRules - Request-level custom rules { whitelist: [], blacklist: [] }
 * @param {Object} options.profile - User profile from database
 * @param {string} options.tier - User tier (for limit checking)
 * @returns {Object} {
 *   whitelist: string[],
 *   blacklist: string[],
 *   sources: { profile: number, request: number, defaults: number }
 * }
 */
export function getEffectiveLists({ customRules = {}, profile = {}, tier = 'free' } = {}) {
  let effectiveWhitelist = [];
  let effectiveBlacklist = [];

  const sources = {
    profile: 0,
    request: 0,
    defaults: 0
  };

  // 1. Start with default lists (if enabled)
  if (profile.uses_default_whitelist !== false) {  // Default true
    const removedWhitelist = profile.removed_defaults?.whitelist || [];
    const defaultWhitelist = DEFAULT_WHITELIST.filter(
      phrase => !removedWhitelist.includes(phrase)
    );
    effectiveWhitelist = effectiveWhitelist.concat(defaultWhitelist);
    sources.defaults += defaultWhitelist.length;
  }

  if (profile.uses_default_blacklist !== false) {  // Default true
    const removedBlacklist = profile.removed_defaults?.blacklist || [];
    const defaultBlacklist = DEFAULT_BLACKLIST.filter(
      phrase => !removedBlacklist.includes(phrase)
    );
    effectiveBlacklist = effectiveBlacklist.concat(defaultBlacklist);
    sources.defaults += defaultBlacklist.length;
  }

  // 2. Add profile-level custom lists
  if (profile.custom_whitelist && Array.isArray(profile.custom_whitelist)) {
    effectiveWhitelist = effectiveWhitelist.concat(profile.custom_whitelist);
    sources.profile += profile.custom_whitelist.length;
  }

  if (profile.custom_blacklist && Array.isArray(profile.custom_blacklist)) {
    effectiveBlacklist = effectiveBlacklist.concat(profile.custom_blacklist);
    sources.profile += profile.custom_blacklist.length;
  }

  // 3. Add request-level custom rules (merge, not replace)
  if (customRules.whitelist && Array.isArray(customRules.whitelist)) {
    effectiveWhitelist = effectiveWhitelist.concat(customRules.whitelist);
    sources.request += customRules.whitelist.length;
  }

  if (customRules.blacklist && Array.isArray(customRules.blacklist)) {
    effectiveBlacklist = effectiveBlacklist.concat(customRules.blacklist);
    sources.request += customRules.blacklist.length;
  }

  // Remove duplicates (case-insensitive)
  effectiveWhitelist = [...new Set(effectiveWhitelist.map(p => p.toLowerCase()))];
  effectiveBlacklist = [...new Set(effectiveBlacklist.map(p => p.toLowerCase()))];

  return {
    whitelist: effectiveWhitelist,
    blacklist: effectiveBlacklist,
    sources
  };
}

/**
 * Validate and get effective lists (combined function)
 *
 * Validates tier limits, then merges all lists
 *
 * @param {Object} options - Same as getEffectiveLists
 * @returns {Object} {
 *   valid: boolean,
 *   errors: string[],
 *   whitelist: string[],
 *   blacklist: string[],
 *   sources: { profile: number, request: number, defaults: number }
 * }
 */
export function validateAndGetEffectiveLists(options = {}) {
  const { customRules = {}, tier = 'free' } = options;

  // Validate tier limits
  const validation = validateCustomRulesForTier(customRules, tier);

  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      whitelist: [],
      blacklist: [],
      sources: { profile: 0, request: 0, defaults: 0 }
    };
  }

  // Get effective lists
  const lists = getEffectiveLists(options);

  return {
    valid: true,
    errors: [],
    ...lists
  };
}

/**
 * Check if user can edit default lists based on tier
 *
 * @param {string} tier - User tier
 * @returns {boolean}
 */
export function canEditDefaults(tier = 'free') {
  const normalizedTier = tier.toLowerCase();
  return TIER_LIMITS[normalizedTier]?.canEditDefaults || false;
}

/**
 * Get tier limits for a specific tier
 *
 * @param {string} tier - User tier
 * @returns {Object|null} Tier limits or null if invalid tier
 */
export function getTierLimits(tier = 'free') {
  const normalizedTier = tier.toLowerCase();
  return TIER_LIMITS[normalizedTier] || null;
}

export default {
  TIER_LIMITS,
  validateCustomRulesForTier,
  getEffectiveLists,
  validateAndGetEffectiveLists,
  canEditDefaults,
  getTierLimits,
  TierLimitError
};
