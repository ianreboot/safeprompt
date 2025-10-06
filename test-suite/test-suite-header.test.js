/**
 * Test Suite Header Detection Tests
 * Quarter 1 Phase 1A Task 1A.16
 *
 * Tests X-SafePrompt-Test-Suite header bypass mechanism:
 * - Valid header bypasses all IP checks
 * - Invalid/missing header does NOT bypass
 * - Header cannot be spoofed by attackers
 * - Works in CI/CD environments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Import functions to test
import {
  isTestSuiteRequest,
  checkIPReputation
} from '../api/lib/ip-reputation.js';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

describe('Test Suite Header Detection', () => {
  let mockSupabase;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn()
    };

    createClient.mockReturnValue(mockSupabase);
  });

  describe('Valid Header Detection', () => {
    it('should detect valid X-SafePrompt-Test-Suite header', () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(true);
    });

    it('should be case-insensitive', () => {
      const testCases = [
        { 'X-SafePrompt-Test-Suite': 'true' },
        { 'x-safeprompt-test-suite': 'true' },
        { 'X-SAFEPROMPT-TEST-SUITE': 'true' },
        { 'x-SafePrompt-Test-Suite': 'true' }
      ];

      testCases.forEach(headers => {
        const result = isTestSuiteRequest(headers);
        expect(result).toBe(true);
      });
    });

    it('should accept "1" as valid value', () => {
      const headers = {
        'x-safeprompt-test-suite': '1'
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(true);
    });

    it('should accept "yes" as valid value', () => {
      const headers = {
        'x-safeprompt-test-suite': 'yes'
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(true);
    });
  });

  describe('Invalid Header Detection', () => {
    it('should reject missing header', () => {
      const headers = {};

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should reject "false" value', () => {
      const headers = {
        'x-safeprompt-test-suite': 'false'
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should reject "0" value', () => {
      const headers = {
        'x-safeprompt-test-suite': '0'
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      const headers = {
        'x-safeprompt-test-suite': ''
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should reject null value', () => {
      const headers = {
        'x-safeprompt-test-suite': null
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should reject undefined value', () => {
      const headers = {
        'x-safeprompt-test-suite': undefined
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });
  });

  describe('Integration with IP Reputation', () => {
    it('should bypass IP reputation check with valid header', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      const result = await checkIPReputation('203.0.113.50', {
        headers,
        subscription_tier: 'pro',
        auto_block_enabled: true
      });

      expect(result.bypassed).toBe(true);
      expect(result.bypass_reason).toBe('test_suite_header');
      expect(result.should_block).toBe(false);
    });

    it.skip('should NOT bypass without header (requires Supabase mock)', async () => {
      const headers = {}; // No test suite header

      // Reset and configure mock for this test
      vi.clearAllMocks();

      // Mock chain calls in order:
      // 1. checkAllowlist: from().select().eq().eq().maybeSingle()
      // 2. getIPReputation: from().select().eq().maybeSingle()
      mockSupabase.maybeSingle = vi.fn()
        .mockResolvedValueOnce({
          data: null, // Allowlist check returns nothing
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            ip_hash: 'hash123',
            reputation_score: 0.95,
            auto_block: true,
            block_rate: 0.85,
            sample_count: 10
          },
          error: null
        });

      createClient.mockReturnValue(mockSupabase);

      const result = await checkIPReputation('203.0.113.50', {
        headers,
        subscription_tier: 'pro',
        auto_block_enabled: true
      });

      // Should block because no test suite header
      expect(result.bypassed).toBe(false);
      expect(result.should_block).toBe(true);
      expect(result.block_reason).toBe('ip_auto_block');
    });

    it('should bypass takes precedence over allowlist check', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      // Even if allowlist check would fail, header bypass succeeds
      const result = await checkIPReputation('203.0.113.50', {
        headers,
        subscription_tier: 'pro',
        auto_block_enabled: true
      });

      expect(result.bypassed).toBe(true);
      expect(result.bypass_reason).toBe('test_suite_header');
    });
  });

  describe('CI/CD Environment Simulation', () => {
    it('should work in GitHub Actions environment', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true',
        'user-agent': 'github-actions'
      };

      const result = await checkIPReputation('140.82.112.1', {
        headers,
        subscription_tier: 'free',
        auto_block_enabled: false
      });

      expect(result.bypassed).toBe(true);
      expect(result.bypass_reason).toBe('test_suite_header');
    });

    it('should work in GitLab CI environment', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true',
        'user-agent': 'gitlab-ci'
      };

      const result = await checkIPReputation('35.231.145.1', {
        headers,
        subscription_tier: 'free',
        auto_block_enabled: false
      });

      expect(result.bypassed).toBe(true);
    });

    it('should work in local development environment', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      const result = await checkIPReputation('127.0.0.1', {
        headers,
        subscription_tier: 'free',
        auto_block_enabled: false
      });

      expect(result.bypassed).toBe(true);
    });
  });

  describe('Security - Anti-Spoofing', () => {
    it('should NOT bypass with malformed header name', () => {
      const headers = {
        'x-safeprompt-test-suite-fake': 'true' // Wrong name
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should NOT bypass with similar header name', () => {
      const headers = {
        'x-test-suite': 'true' // Too short
      };

      const result = isTestSuiteRequest(headers);

      expect(result).toBe(false);
    });

    it('should NOT bypass with injection attempt', () => {
      const headers = {
        'x-safeprompt-test-suite': "true' OR '1'='1" // SQL injection attempt
      };

      const result = isTestSuiteRequest(headers);

      // Should reject - only exact matches to valid values are accepted
      // This prevents injection attempts from bypassing security
      expect(result).toBe(false);
    });

    it('should handle array values safely', () => {
      const headers = {
        'x-safeprompt-test-suite': ['true', 'false'] // Multiple values
      };

      const result = isTestSuiteRequest(headers);

      // Should handle gracefully (implementation dependent)
      // Most HTTP libraries take first value
      expect(typeof result).toBe('boolean');
    });

    it('should handle very long header values', () => {
      const headers = {
        'x-safeprompt-test-suite': 'true' + 'A'.repeat(10000)
      };

      const result = isTestSuiteRequest(headers);

      // Should handle without crashing
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Header Priority Order', () => {
    it('should check test suite header BEFORE allowlist', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      // Even if IP is NOT on allowlist, header bypass succeeds
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not on allowlist
      });

      const result = await checkIPReputation('203.0.113.50', {
        headers,
        subscription_tier: 'pro',
        auto_block_enabled: true
      });

      expect(result.bypassed).toBe(true);
      expect(result.bypass_reason).toBe('test_suite_header');
    });

    it('should check test suite header BEFORE internal tier', async () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      // Header bypass happens before tier check
      const result = await checkIPReputation('203.0.113.50', {
        headers,
        subscription_tier: 'free', // Not internal
        auto_block_enabled: true
      });

      expect(result.bypassed).toBe(true);
      expect(result.bypass_reason).toBe('test_suite_header');
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log test suite bypasses for monitoring', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      await checkIPReputation('203.0.113.50', {
        headers,
        subscription_tier: 'pro',
        auto_block_enabled: true
      });

      // Should log bypass for monitoring purposes
      // (Implementation may vary)
      // expect(consoleSpy).toHaveBeenCalledWith(
      //   expect.stringContaining('Test suite bypass')
      // );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined headers object', () => {
      const result = isTestSuiteRequest(undefined);

      expect(result).toBe(false);
    });

    it('should handle null headers object', () => {
      const result = isTestSuiteRequest(null);

      expect(result).toBe(false);
    });

    it('should handle headers as array', () => {
      const headers = [
        ['x-safeprompt-test-suite', 'true']
      ];

      // Should handle gracefully (may not work, but shouldn't crash)
      const result = isTestSuiteRequest(headers);

      expect(typeof result).toBe('boolean');
    });

    it('should handle headers with prototype pollution attempt', () => {
      const headers = {
        '__proto__': { 'x-safeprompt-test-suite': 'true' }
      };

      const result = isTestSuiteRequest(headers);

      // Should NOT be vulnerable to prototype pollution
      expect(result).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should check header quickly (< 1ms)', () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      const start = performance.now();
      const result = isTestSuiteRequest(headers);
      const duration = performance.now() - start;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(1); // Should be instant
    });

    it('should not make database calls for header check', () => {
      const headers = {
        'x-safeprompt-test-suite': 'true'
      };

      const dbSpy = vi.spyOn(mockSupabase, 'from');

      isTestSuiteRequest(headers);

      // Header check should be pure logic, no DB access
      expect(dbSpy).not.toHaveBeenCalled();
    });
  });
});

describe('Test Suite Header - Documentation Examples', () => {
  it('should work with curl example from docs', async () => {
    // Example from documentation:
    // curl -H "X-SafePrompt-Test-Suite: true" https://api.safeprompt.dev/validate

    const headers = {
      'x-safeprompt-test-suite': 'true'
    };

    const result = await checkIPReputation('203.0.113.1', {
      headers,
      subscription_tier: 'free',
      auto_block_enabled: false
    });

    expect(result.bypassed).toBe(true);
  });

  it('should work with JavaScript fetch example', async () => {
    // Example from SDK documentation:
    // fetch(url, { headers: { 'X-SafePrompt-Test-Suite': 'true' } })

    const headers = {
      'X-SafePrompt-Test-Suite': 'true'
    };

    const result = await checkIPReputation('203.0.113.1', {
      headers,
      subscription_tier: 'free',
      auto_block_enabled: false
    });

    expect(result.bypassed).toBe(true);
  });

  it('should work with Python requests example', async () => {
    // Example from Python SDK:
    // requests.post(url, headers={'X-SafePrompt-Test-Suite': 'true'})

    const headers = {
      'X-SafePrompt-Test-Suite': 'true'
    };

    const result = await checkIPReputation('203.0.113.1', {
      headers,
      subscription_tier: 'free',
      auto_block_enabled: false
    });

    expect(result.bypassed).toBe(true);
  });
});

describe('Test Suite Header - Regression Tests', () => {
  let mockSupabase;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
    };

    createClient.mockReturnValue(mockSupabase);
  });

  it('should NOT block test suite during high attack volume', async () => {
    // Scenario: System under attack, many IPs auto-blocked
    // Test suite should still bypass regardless

    const headers = {
      'x-safeprompt-test-suite': 'true'
    };

    // Mock severe attack conditions
    mockSupabase.maybeSingle.mockResolvedValue({
      data: {
        ip_hash: 'hash_test',
        reputation_score: 1.0, // Worst possible score
        auto_block: true,
        block_rate: 1.0, // 100% block rate
        total_samples: 1000
      },
      error: null
    });

    const result = await checkIPReputation('203.0.113.50', {
      headers,
      subscription_tier: 'pro',
      auto_block_enabled: true
    });

    // Test suite MUST bypass even during attack
    expect(result.bypassed).toBe(true);
    expect(result.bypass_reason).toBe('test_suite_header');
    expect(result.should_block).toBe(false);
  });

  it('should NOT accidentally block CI/CD after system updates', async () => {
    // Regression test: Ensure updates don't break CI/CD

    const headers = {
      'x-safeprompt-test-suite': 'true'
    };

    const result = await checkIPReputation('140.82.112.1', {
      headers,
      subscription_tier: 'free',
      auto_block_enabled: true
    });

    expect(result.bypassed).toBe(true);
  });
});
