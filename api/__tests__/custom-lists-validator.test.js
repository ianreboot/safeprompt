/**
 * Tests for Custom Lists Validator
 *
 * Validates tier limits, list merging, and profile integration
 */

import {
  TIER_LIMITS,
  validateCustomRulesForTier,
  getEffectiveLists,
  validateAndGetEffectiveLists,
  canEditDefaults,
  getTierLimits
} from '../lib/custom-lists-validator.js';

describe('custom-lists-validator', () => {
  describe('TIER_LIMITS', () => {
    test('should have all required tiers', () => {
      expect(TIER_LIMITS.free).toBeDefined();
      expect(TIER_LIMITS.starter).toBeDefined();
      expect(TIER_LIMITS.business).toBeDefined();
      expect(TIER_LIMITS.enterprise).toBeDefined();
      expect(TIER_LIMITS.internal).toBeDefined();
    });

    test('free tier should not allow custom rules', () => {
      expect(TIER_LIMITS.free.customRulesEnabled).toBe(false);
      expect(TIER_LIMITS.free.maxCustomWhitelist).toBe(0);
      expect(TIER_LIMITS.free.maxCustomBlacklist).toBe(0);
      expect(TIER_LIMITS.free.canEditDefaults).toBe(false);
    });

    test('paid tiers should allow custom rules', () => {
      expect(TIER_LIMITS.starter.customRulesEnabled).toBe(true);
      expect(TIER_LIMITS.business.customRulesEnabled).toBe(true);
      expect(TIER_LIMITS.enterprise.customRulesEnabled).toBe(true);
    });

    test('limits should increase with tier', () => {
      expect(TIER_LIMITS.starter.maxCustomWhitelist).toBe(10);
      expect(TIER_LIMITS.business.maxCustomWhitelist).toBe(50);
      expect(TIER_LIMITS.enterprise.maxCustomWhitelist).toBe(200);
    });
  });

  describe('validateCustomRulesForTier', () => {
    describe('free tier', () => {
      test('should reject any custom rules', () => {
        const rules = {
          whitelist: ['business meeting'],
          blacklist: ['admin password']
        };

        const result = validateCustomRulesForTier(rules, 'free');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('not available on free tier');
      });

      test('should accept empty custom rules', () => {
        const rules = {
          whitelist: [],
          blacklist: []
        };

        const result = validateCustomRulesForTier(rules, 'free');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept undefined custom rules', () => {
        const result = validateCustomRulesForTier({}, 'free');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('starter tier', () => {
      test('should accept rules within limits', () => {
        const rules = {
          whitelist: ['meeting', 'review'],  // 2 <= 10
          blacklist: ['password']             // 1 <= 10
        };

        const result = validateCustomRulesForTier(rules, 'starter');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject whitelist exceeding limit', () => {
        const rules = {
          whitelist: new Array(11).fill('test'),  // 11 > 10
          blacklist: []
        };

        const result = validateCustomRulesForTier(rules, 'starter');

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Whitelist exceeds limit');
        expect(result.errors[0]).toContain('11/10');
      });

      test('should reject blacklist exceeding limit', () => {
        const rules = {
          whitelist: [],
          blacklist: new Array(11).fill('test')  // 11 > 10
        };

        const result = validateCustomRulesForTier(rules, 'starter');

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Blacklist exceeds limit');
      });

      test('should accept exactly at limit', () => {
        const rules = {
          whitelist: new Array(10).fill('test'),
          blacklist: new Array(10).fill('test')
        };

        const result = validateCustomRulesForTier(rules, 'starter');

        expect(result.valid).toBe(true);
      });
    });

    describe('business tier', () => {
      test('should accept larger limits', () => {
        const rules = {
          whitelist: new Array(50).fill('test'),
          blacklist: new Array(50).fill('test')
        };

        const result = validateCustomRulesForTier(rules, 'business');

        expect(result.valid).toBe(true);
      });

      test('should reject exceeding larger limits', () => {
        const rules = {
          whitelist: new Array(51).fill('test'),
          blacklist: []
        };

        const result = validateCustomRulesForTier(rules, 'business');

        expect(result.valid).toBe(false);
      });
    });

    describe('enterprise tier', () => {
      test('should accept very large limits', () => {
        const rules = {
          whitelist: new Array(200).fill('test'),
          blacklist: new Array(200).fill('test')
        };

        const result = validateCustomRulesForTier(rules, 'enterprise');

        expect(result.valid).toBe(true);
      });
    });

    describe('invalid tier', () => {
      test('should handle invalid tier name', () => {
        const rules = { whitelist: [], blacklist: [] };

        const result = validateCustomRulesForTier(rules, 'invalid-tier');

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid tier');
      });
    });

    describe('case insensitivity', () => {
      test('should handle uppercase tier names', () => {
        const rules = { whitelist: ['test'], blacklist: [] };

        const result = validateCustomRulesForTier(rules, 'STARTER');

        expect(result.valid).toBe(true);
      });

      test('should handle mixed case tier names', () => {
        const rules = { whitelist: ['test'], blacklist: [] };

        const result = validateCustomRulesForTier(rules, 'BuSiNeSs');

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('getEffectiveLists', () => {
    describe('defaults only', () => {
      test('should return default lists when profile enables them', () => {
        const profile = {
          uses_default_whitelist: true,
          uses_default_blacklist: true
        };

        const result = getEffectiveLists({ profile });

        expect(result.whitelist.length).toBeGreaterThan(0);
        expect(result.blacklist.length).toBeGreaterThan(0);
        expect(result.sources.defaults).toBeGreaterThan(0);
        expect(result.sources.profile).toBe(0);
        expect(result.sources.request).toBe(0);
      });

      test('should exclude removed defaults', () => {
        const profile = {
          uses_default_whitelist: true,
          uses_default_blacklist: true,
          removed_defaults: {
            whitelist: ['business meeting'],
            blacklist: ['admin password']
          }
        };

        const result = getEffectiveLists({ profile });

        expect(result.whitelist).not.toContain('business meeting');
        expect(result.blacklist).not.toContain('admin password');
      });

      test('should return empty when defaults disabled', () => {
        const profile = {
          uses_default_whitelist: false,
          uses_default_blacklist: false
        };

        const result = getEffectiveLists({ profile });

        expect(result.whitelist).toHaveLength(0);
        expect(result.blacklist).toHaveLength(0);
        expect(result.sources.defaults).toBe(0);
      });
    });

    describe('profile custom lists', () => {
      test('should add profile custom lists', () => {
        const profile = {
          uses_default_whitelist: false,
          uses_default_blacklist: false,
          custom_whitelist: ['custom phrase 1', 'custom phrase 2'],
          custom_blacklist: ['custom block']
        };

        const result = getEffectiveLists({ profile });

        expect(result.whitelist).toContain('custom phrase 1');
        expect(result.whitelist).toContain('custom phrase 2');
        expect(result.blacklist).toContain('custom block');
        expect(result.sources.profile).toBe(3);
      });

      test('should merge defaults and custom lists', () => {
        const profile = {
          uses_default_whitelist: true,
          uses_default_blacklist: true,
          custom_whitelist: ['my custom phrase'],
          custom_blacklist: ['my block']
        };

        const result = getEffectiveLists({ profile });

        expect(result.whitelist).toContain('my custom phrase');
        expect(result.blacklist).toContain('my block');
        expect(result.sources.defaults).toBeGreaterThan(0);
        expect(result.sources.profile).toBe(2);
      });
    });

    describe('request custom rules', () => {
      test('should add request-level custom rules', () => {
        const customRules = {
          whitelist: ['request phrase'],
          blacklist: ['request block']
        };

        const result = getEffectiveLists({ customRules });

        expect(result.whitelist).toContain('request phrase');
        expect(result.blacklist).toContain('request block');
        expect(result.sources.request).toBe(2);
      });

      test('should merge all three sources', () => {
        const profile = {
          uses_default_whitelist: true,
          custom_whitelist: ['profile phrase']
        };

        const customRules = {
          whitelist: ['request phrase']
        };

        const result = getEffectiveLists({ profile, customRules });

        expect(result.whitelist.length).toBeGreaterThan(2);
        expect(result.whitelist).toContain('profile phrase');
        expect(result.whitelist).toContain('request phrase');
        expect(result.sources.defaults).toBeGreaterThan(0);
        expect(result.sources.profile).toBe(1);
        expect(result.sources.request).toBe(1);
      });
    });

    describe('deduplication', () => {
      test('should remove duplicate phrases (case-insensitive)', () => {
        const profile = {
          uses_default_whitelist: false,
          custom_whitelist: ['Business Meeting', 'team discussion']
        };

        const customRules = {
          whitelist: ['business meeting', 'TEAM DISCUSSION']
        };

        const result = getEffectiveLists({ profile, customRules });

        expect(result.whitelist).toHaveLength(2);
        expect(result.whitelist).toContain('business meeting');
        expect(result.whitelist).toContain('team discussion');
      });
    });

    describe('empty inputs', () => {
      test('should handle empty profile', () => {
        const result = getEffectiveLists({});

        expect(result.whitelist).toBeDefined();
        expect(result.blacklist).toBeDefined();
        expect(result.sources).toBeDefined();
      });

      test('should handle undefined parameters', () => {
        const result = getEffectiveLists();

        expect(result.whitelist).toBeDefined();
        expect(result.blacklist).toBeDefined();
      });
    });
  });

  describe('validateAndGetEffectiveLists', () => {
    test('should validate and return lists when valid', () => {
      const profile = {
        uses_default_whitelist: true,
        custom_whitelist: ['my phrase']
      };

      const customRules = {
        whitelist: ['request phrase'],
        blacklist: []
      };

      const result = validateAndGetEffectiveLists({
        profile,
        customRules,
        tier: 'starter'
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.whitelist.length).toBeGreaterThan(0);
    });

    test('should return errors when tier limits exceeded', () => {
      const customRules = {
        whitelist: new Array(11).fill('test'),
        blacklist: []
      };

      const result = validateAndGetEffectiveLists({
        customRules,
        tier: 'starter'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.whitelist).toHaveLength(0);
      expect(result.blacklist).toHaveLength(0);
    });

    test('should reject custom rules on free tier', () => {
      const customRules = {
        whitelist: ['test'],
        blacklist: []
      };

      const result = validateAndGetEffectiveLists({
        customRules,
        tier: 'free'
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not available on free tier');
    });
  });

  describe('canEditDefaults', () => {
    test('should return false for free tier', () => {
      expect(canEditDefaults('free')).toBe(false);
    });

    test('should return true for paid tiers', () => {
      expect(canEditDefaults('starter')).toBe(true);
      expect(canEditDefaults('business')).toBe(true);
      expect(canEditDefaults('enterprise')).toBe(true);
      expect(canEditDefaults('internal')).toBe(true);
    });

    test('should handle case insensitivity', () => {
      expect(canEditDefaults('STARTER')).toBe(true);
      expect(canEditDefaults('FREE')).toBe(false);
    });

    test('should return false for invalid tier', () => {
      expect(canEditDefaults('invalid')).toBe(false);
    });
  });

  describe('getTierLimits', () => {
    test('should return limits for valid tier', () => {
      const limits = getTierLimits('starter');

      expect(limits).toBeDefined();
      expect(limits.maxCustomWhitelist).toBe(10);
      expect(limits.maxCustomBlacklist).toBe(10);
    });

    test('should return null for invalid tier', () => {
      expect(getTierLimits('invalid')).toBeNull();
    });

    test('should handle case insensitivity', () => {
      const limits = getTierLimits('BUSINESS');

      expect(limits).toBeDefined();
      expect(limits.maxCustomWhitelist).toBe(50);
    });
  });
});
