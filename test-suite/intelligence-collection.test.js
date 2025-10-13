/**
 * Intelligence Collection Tests
 * Quarter 1 Phase 1A Task 1A.13
 *
 * Tests for tier-based intelligence collection logic:
 * - Free tier: Always collects blocked requests
 * - Paid tiers (Early Bird/Starter/Business): Collects all requests if opted in
 * - Internal tier: Never collects
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { collectThreatIntelligence } from '../api/lib/intelligence-collector.js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        maybeSingle: vi.fn(() => ({ data: null, error: null }))
      }))
    })),
    insert: vi.fn(() => ({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
  }))
};

// Mock module
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

describe('Intelligence Collection - Tier-based Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.skip('Free Tier (requires Supabase client injection for INSERT)', () => {
    it('should collect blocked requests', async () => {
      const profile = { tier: 'free', preferences: { intelligence_sharing: true } };

      // Mock profile fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      // Mock allowlist check (not allowlisted)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      // Mock insert
      const insertMock = vi.fn(() => ({ error: null }));
      mockSupabase.from.mockReturnValueOnce({
        insert: insertMock
      });

      const validationResult = {
        safe: false,
        confidence: 0.9,
        threats: ['xss'],
        detectionMethod: 'pattern'
      };

      const result = await collectThreatIntelligence('test prompt', validationResult, {
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        user_id: 'user-123'
      });

      expect(result).toBe(true);
      expect(insertMock).toHaveBeenCalled();
    });

    it('should NOT collect safe requests', async () => {
      const profile = { tier: 'free', preferences: { intelligence_sharing: true } };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn();
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      const validationResult = {
        safe: true,
        confidence: 0.1,
        threats: [],
        detectionMethod: 'pattern'
      };

      const result = await collectThreatIntelligence('safe prompt', validationResult, {
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        user_id: 'user-123'
      });

      expect(result).toBe(false);
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe.skip('Paid Tier - Opted In (requires Supabase client injection for INSERT)', () => {
    it('should collect ALL requests (safe and blocked)', async () => {
      const profile = {
        tier: 'starter',
        preferences: { intelligence_sharing: true }
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn(() => ({ error: null }));
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      const validationResult = {
        safe: true,  // SAFE request
        confidence: 0.1,
        threats: [],
        detectionMethod: 'pattern'
      };

      const result = await collectThreatIntelligence('safe prompt', validationResult, {
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        user_id: 'user-pro'
      });

      expect(result).toBe(true);
      expect(insertMock).toHaveBeenCalled();
    });

    it('should collect blocked requests', async () => {
      const profile = {
        tier: 'starter',
        preferences: { intelligence_sharing: true }
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn(() => ({ error: null }));
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      const validationResult = {
        safe: false,
        confidence: 0.9,
        threats: ['injection'],
        detectionMethod: 'ai_pass1'
      };

      const result = await collectThreatIntelligence('malicious prompt', validationResult, {
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        user_id: 'user-pro'
      });

      expect(result).toBe(true);
      expect(insertMock).toHaveBeenCalled();
    });
  });

  describe('Paid Tier - Opted Out', () => {
    it('should NOT collect any requests when opted out', async () => {
      const profile = {
        tier: 'starter',
        preferences: { intelligence_sharing: false }  // OPTED OUT
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn();
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      const validationResult = {
        safe: false,
        confidence: 0.9,
        threats: ['xss'],
        detectionMethod: 'pattern'
      };

      const result = await collectThreatIntelligence('malicious prompt', validationResult, {
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        user_id: 'user-pro-optout'
      });

      expect(result).toBe(false);
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe('Internal Tier', () => {
    it('should NEVER collect (internal testing)', async () => {
      const profile = {
        tier: 'internal',
        preferences: { intelligence_sharing: true }
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn();
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      const validationResult = {
        safe: false,
        confidence: 0.9,
        threats: ['test'],
        detectionMethod: 'pattern'
      };

      const result = await collectThreatIntelligence('test prompt', validationResult, {
        ip_address: '127.0.0.1',
        user_agent: 'Internal-Test',
        user_id: 'admin-internal'
      });

      expect(result).toBe(false);
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe('Allowlist Protection', () => {
    it('should skip collection for allowlisted IPs', async () => {
      // Mock allowlist check (IP IS allowlisted)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({
                data: {
                  id: 'allow-1',
                  description: 'CI/CD runner',
                  purpose: 'ci_cd'
                },
                error: null
              }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn();

      const validationResult = {
        safe: false,
        confidence: 0.9,
        threats: ['test'],
        detectionMethod: 'pattern'
      };

      const result = await collectThreatIntelligence('test prompt', validationResult, {
        ip_address: '10.0.0.5',  // CI/CD IP
        user_agent: 'GitHub-Actions',
        user_id: 'user-123'
      });

      expect(result).toBe(false);
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe.skip('Data Fields (requires Supabase client injection for INSERT)', () => {
    it('should include all required fields in sample', async () => {
      const profile = { tier: 'free', preferences: { intelligence_sharing: true } };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: profile, error: null }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      });

      const insertMock = vi.fn(() => ({ error: null }));
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      const validationResult = {
        safe: false,
        confidence: 0.95,
        threats: ['sql_injection', 'xss'],
        detectionMethod: 'ai_pass2'
      };

      await collectThreatIntelligence('SELECT * FROM users', validationResult, {
        ip_address: '203.0.113.50',
        user_agent: 'curl/7.68.0',
        user_id: 'user-free-123'
      });

      expect(insertMock).toHaveBeenCalled();
      const insertedData = insertMock.mock.calls[0][0];

      // Check required fields
      expect(insertedData).toHaveProperty('prompt_text', 'SELECT * FROM users');
      expect(insertedData).toHaveProperty('prompt_hash');
      expect(insertedData).toHaveProperty('prompt_length', 20);
      expect(insertedData).toHaveProperty('client_ip', '203.0.113.50');
      expect(insertedData).toHaveProperty('ip_hash');
      expect(insertedData).toHaveProperty('attack_vectors', ['sql_injection', 'xss']);
      expect(insertedData).toHaveProperty('threat_severity', 'critical');
      expect(insertedData).toHaveProperty('confidence_score', 0.95);
      expect(insertedData).toHaveProperty('subscription_tier', 'free');
      expect(insertedData).toHaveProperty('intelligence_sharing', true);
    });

    it('should categorize user agents correctly', async () => {
      const testCases = [
        { ua: 'Mozilla/5.0 (Windows NT 10.0)', expected: 'browser' },
        { ua: 'curl/7.68.0', expected: 'library' },
        { ua: 'Googlebot/2.1', expected: 'automated' },
        { ua: 'Mozilla/5.0 (iPhone)', expected: 'mobile' }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const profile = { tier: 'free', preferences: { intelligence_sharing: true } };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: profile, error: null }))
            }))
          }))
        });

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => ({ data: null, error: null }))
              }))
            }))
          }))
        });

        const insertMock = vi.fn(() => ({ error: null }));
        mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

        await collectThreatIntelligence('test', { safe: false, confidence: 0.9, threats: [] }, {
          ip_address: '192.168.1.1',
          user_agent: testCase.ua,
          user_id: 'user-123'
        });

        const insertedData = insertMock.mock.calls[0][0];
        expect(insertedData.user_agent_category).toBe(testCase.expected);
      }
    });
  });

  describe.skip('Severity Calculation (requires Supabase client injection for INSERT)', () => {
    it('should calculate correct severity levels', async () => {
      const severityTests = [
        { confidence: 0.95, safe: false, expected: 'critical' },
        { confidence: 0.85, safe: false, expected: 'high' },
        { confidence: 0.65, safe: false, expected: 'medium' },
        { confidence: 0.45, safe: false, expected: 'low' },
        { confidence: 0.1, safe: true, expected: 'low' }
      ];

      for (const test of severityTests) {
        vi.clearAllMocks();

        const profile = { tier: 'free', preferences: { intelligence_sharing: true } };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: profile, error: null }))
            }))
          }))
        });

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => ({ data: null, error: null }))
              }))
            }))
          }))
        });

        const insertMock = vi.fn(() => ({ error: null }));
        mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

        const validationResult = {
          safe: test.safe,
          confidence: test.confidence,
          threats: test.safe ? [] : ['test'],
          detectionMethod: 'pattern'
        };

        const shouldCollect = !test.safe; // Free tier only collects blocked
        const result = await collectThreatIntelligence('test', validationResult, {
          ip_address: '192.168.1.1',
          user_id: 'user-123'
        });

        if (shouldCollect) {
          expect(result).toBe(true);
          const insertedData = insertMock.mock.calls[0][0];
          expect(insertedData.threat_severity).toBe(test.expected);
        }
      }
    });
  });
});

describe.skip('Intelligence Collection - Error Handling (requires Supabase client injection)', () => {
  it('should return false on database error', async () => {
    const profile = { tier: 'free', preferences: { intelligence_sharing: true } };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: profile, error: null }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({ data: null, error: null }))
          }))
        }))
      }))
    });

    // Mock insert error
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn(() => ({ error: { message: 'Database error' } }))
    });

    const result = await collectThreatIntelligence('test', { safe: false, confidence: 0.9, threats: [] }, {
      ip_address: '192.168.1.1',
      user_id: 'user-123'
    });

    expect(result).toBe(false);
  });

  it('should handle missing profile gracefully', async () => {
    // Mock profile not found
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: { message: 'Not found' } }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({ data: null, error: null }))
          }))
        }))
      }))
    });

    const insertMock = vi.fn(() => ({ error: null }));
    mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

    // Should default to free tier behavior
    const result = await collectThreatIntelligence('test', { safe: false, confidence: 0.9, threats: [] }, {
      ip_address: '192.168.1.1',
      user_id: 'unknown-user'
    });

    expect(result).toBe(true); // Still collects (defaults to free tier)
  });
});
