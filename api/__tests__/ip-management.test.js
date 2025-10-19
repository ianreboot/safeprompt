/**
 * Unit Tests: IP Management Business Logic
 * Tests Phase 1C whitelist/blacklist priority checking
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

// Mock supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  upsert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  single: vi.fn(),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase)
};

// Set up mock before imports
vi.mock('../lib/supabase.js', async () => ({
  supabase: mockSupabase,
  default: mockSupabase
}));

const {
  checkIpWithPriority,
  checkIpWhitelist,
  checkIpBlacklist,
  checkIpReputation,
  isUserAdmin
} = await import('../lib/ip-management.js');

describe('IP Management - Priority Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkIpWhitelist', () => {
    it('should return isWhitelisted=true when IP is in whitelist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ip: '192.168.1.1',
          reason: 'Internal network',
          expires_at: null
        },
        error: null
      });

      const result = await checkIpWhitelist('192.168.1.1');

      expect(result.isWhitelisted).toBe(true);
      expect(result.reason).toBe('Internal network');
      expect(result.data).toBeTruthy();
    });

    it('should return isWhitelisted=false when IP not in whitelist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      });

      const result = await checkIpWhitelist('1.2.3.4');

      expect(result.isWhitelisted).toBe(false);
      expect(result.reason).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should check for non-expired entries only', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      await checkIpWhitelist('1.2.3.4');

      expect(mockSupabase.or).toHaveBeenCalledWith('expires_at.is.null,expires_at.gt.now()');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Database error' }
      });

      const result = await checkIpWhitelist('1.2.3.4');

      expect(result.isWhitelisted).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe('checkIpBlacklist', () => {
    it('should return isBlacklisted=true when IP is in blacklist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ip: '1.2.3.4',
          reason: 'Known attacker',
          severity: 'high',
          expires_at: null
        },
        error: null
      });

      const result = await checkIpBlacklist('1.2.3.4');

      expect(result.isBlacklisted).toBe(true);
      expect(result.reason).toBe('Known attacker');
      expect(result.severity).toBe('high');
      expect(result.data).toBeTruthy();
    });

    it('should return isBlacklisted=false when IP not in blacklist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await checkIpBlacklist('192.168.1.1');

      expect(result.isBlacklisted).toBe(false);
      expect(result.reason).toBeNull();
      expect(result.severity).toBeNull();
    });

    it('should check for non-expired entries only', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      await checkIpBlacklist('1.2.3.4');

      expect(mockSupabase.or).toHaveBeenCalledWith('expires_at.is.null,expires_at.gt.now()');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Database error' }
      });

      const result = await checkIpBlacklist('1.2.3.4');

      expect(result.isBlacklisted).toBe(false);
    });
  });

  describe('checkIpReputation', () => {
    it('should block when manually_blocked is true', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ip_hash: 'abc123',
          manually_blocked: true,
          manual_block_reason: 'Admin decision',
          reputation_score: 0.5
        },
        error: null
      });

      const result = await checkIpReputation('1.2.3.4');

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toContain('Admin decision');
    });

    it('should block when auto_block is true', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ip_hash: 'abc123',
          manually_blocked: false,
          auto_block: true,
          reputation_score: 0.9
        },
        error: null
      });

      const result = await checkIpReputation('1.2.3.4');

      expect(result.shouldBlock).toBe(true);
      expect(result.score).toBe(0.9);
    });

    it('should block when reputation_score >= 0.8', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ip_hash: 'abc123',
          manually_blocked: false,
          auto_block: false,
          reputation_score: 0.85
        },
        error: null
      });

      const result = await checkIpReputation('1.2.3.4');

      expect(result.shouldBlock).toBe(true);
      expect(result.score).toBe(0.85);
    });

    it('should not block when reputation_score < 0.8', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ip_hash: 'abc123',
          manually_blocked: false,
          auto_block: false,
          reputation_score: 0.5
        },
        error: null
      });

      const result = await checkIpReputation('1.2.3.4');

      expect(result.shouldBlock).toBe(false);
      expect(result.score).toBe(0.5);
    });

    it('should not block when IP has no reputation data', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await checkIpReputation('192.168.1.1');

      expect(result.shouldBlock).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('checkIpWithPriority - Priority Logic', () => {
    it('should allow whitelisted IP even if blacklisted', async () => {
      // Mock whitelist check returns true
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { ip: '1.2.3.4', reason: 'Trusted partner' },
          error: null
        });

      const result = await checkIpWithPriority('1.2.3.4');

      expect(result.allowed).toBe(true);
      expect(result.source).toBe('whitelist');
      expect(result.reason).toBe('Trusted partner'); // Returns the actual reason from whitelist
    });

    it('should block blacklisted IP if not whitelisted', async () => {
      // Mock whitelist returns false
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        // Mock blacklist returns true
        .mockResolvedValueOnce({
          data: { ip: '1.2.3.4', reason: 'Known attacker', severity: 'high' },
          error: null
        });

      const result = await checkIpWithPriority('1.2.3.4');

      expect(result.allowed).toBe(false);
      expect(result.source).toBe('blacklist');
      expect(result.severity).toBe('high');
    });

    it('should use reputation score if not whitelisted or blacklisted', async () => {
      // Mock whitelist returns false
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        // Mock blacklist returns false
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        // Mock reputation returns high score
        .mockResolvedValueOnce({
          data: {
            ip_hash: 'abc123',
            reputation_score: 0.9,
            auto_block: true
          },
          error: null
        });

      const result = await checkIpWithPriority('1.2.3.4');

      expect(result.allowed).toBe(false);
      expect(result.source).toBe('reputation');
      expect(result.score).toBe(0.9);
    });

    it('should allow IP with no negative indicators', async () => {
      // Mock all checks return false/clean
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await checkIpWithPriority('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.source).toBe('default');
      expect(result.reason).toContain('no negative history');
    });
  });

  describe('isUserAdmin', () => {
    it('should return true for active admin user', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_admin: true,
          revoked_at: null
        },
        error: null
      });

      const result = await isUserAdmin('user-123');

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_admin: false,
          revoked_at: null
        },
        error: null
      });

      const result = await isUserAdmin('user-456');

      expect(result).toBe(false);
    });

    it('should return false for revoked admin', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          is_admin: true,
          revoked_at: '2025-01-01T00:00:00Z'
        },
        error: null
      });

      const result = await isUserAdmin('user-789');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await isUserAdmin('user-nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Database error' }
      });

      const result = await isUserAdmin('user-error');

      expect(result).toBe(false);
    });
  });
});

describe('IP Management - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle expired whitelist entries correctly', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    const result = await checkIpWhitelist('1.2.3.4');

    expect(result.isWhitelisted).toBe(false);
    expect(mockSupabase.or).toHaveBeenCalledWith('expires_at.is.null,expires_at.gt.now()');
  });

  it('should handle expired blacklist entries correctly', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    const result = await checkIpBlacklist('1.2.3.4');

    expect(result.isBlacklisted).toBe(false);
    expect(mockSupabase.or).toHaveBeenCalledWith('expires_at.is.null,expires_at.gt.now()');
  });

  it('should handle null reputation scores', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        ip_hash: 'abc123',
        manually_blocked: false,
        auto_block: false,
        reputation_score: null
      },
      error: null
    });

    const result = await checkIpReputation('1.2.3.4');

    expect(result.shouldBlock).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should handle reputation score exactly at threshold (0.8)', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        ip_hash: 'abc123',
        manually_blocked: false,
        auto_block: false,
        reputation_score: 0.8
      },
      error: null
    });

    const result = await checkIpReputation('1.2.3.4');

    expect(result.shouldBlock).toBe(true);
    expect(result.score).toBe(0.8);
  });

  it('should handle reputation score just below threshold (0.79)', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        ip_hash: 'abc123',
        manually_blocked: false,
        auto_block: false,
        reputation_score: 0.79
      },
      error: null
    });

    const result = await checkIpReputation('1.2.3.4');

    expect(result.shouldBlock).toBe(false);
    expect(result.score).toBe(0.79);
  });
});
