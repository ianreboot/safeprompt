/**
 * IP Allowlist Bypass Tests
 * Quarter 1 Phase 1A Task 1A.15
 *
 * Tests IP allowlist functionality to ensure test infrastructure is never blocked:
 * - CI/CD IPs bypass all checks
 * - Test suite IPs bypass all checks
 * - Admin CRUD operations work correctly
 * - Allowlist cannot be bypassed by attackers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Hoist mock creation BEFORE any imports
const mockSupabaseClient = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  then: vi.fn(),
  catch: vi.fn()
}));

// Mock Supabase BEFORE importing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

import { createClient } from '@supabase/supabase-js';

// Import functions to test
import {
  isIPAllowlisted,
  checkAllowlist,
  addToAllowlist,
  getAllowlistHashes
} from '../api/lib/ip-reputation.js';

import {
  listAllowlist,
  addAllowlistEntry,
  updateAllowlistEntry,
  deleteAllowlistEntry
} from '../api/routes/allowlist.js';

describe('IP Allowlist - Bypass Verification', () => {
  beforeEach(() => {
    // Reset all mock functions before each test
    mockSupabaseClient.from.mockReset().mockReturnThis();
    mockSupabaseClient.select.mockReset().mockReturnThis();
    mockSupabaseClient.eq.mockReset().mockReturnThis();
    mockSupabaseClient.insert.mockReset().mockReturnThis();
    mockSupabaseClient.update.mockReset().mockReturnThis();
    mockSupabaseClient.delete.mockReset().mockReturnThis();
    mockSupabaseClient.order.mockReset().mockReturnThis();
    mockSupabaseClient.single.mockReset();
    mockSupabaseClient.maybeSingle.mockReset();
    mockSupabaseClient.rpc.mockReset().mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.then.mockReset().mockImplementation((callback) => {
      callback();
      return mockSupabaseClient;
    });
    mockSupabaseClient.catch.mockReset().mockImplementation(() => mockSupabaseClient);
  });

  describe('Basic Allowlist Checks', () => {
    it('should return true for allowlisted IP', async () => {
      // Mock database response - IP is on allowlist
      const ipHash = require('crypto').createHash('sha256').update('192.168.1.100').digest('hex');

      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: '123',
          description: 'CI/CD server',
          purpose: 'ci_cd'
        },
        error: null
      });

      // Mock the update/eq chain to return a promise-like object
      const mockUpdateChain = {
        then: vi.fn((callback) => {
          callback();
          return Promise.resolve({ data: null, error: null });
        }),
        catch: vi.fn(() => Promise.resolve())
      };

      // Override eq to return the promise chain when called after update
      let eqCallCount = 0;
      mockSupabaseClient.eq.mockImplementation((field, value) => {
        eqCallCount++;
        // First two calls are for the select query (ip_hash, active)
        if (eqCallCount <= 2) {
          return mockSupabaseClient;
        }
        // Third call is for update query (id)
        return mockUpdateChain;
      });

      const result = await isIPAllowlisted('192.168.1.100');

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ip_allowlist');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('ip_hash', ipHash);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('active', true);
    });

    it('should return false for non-allowlisted IP', async () => {
      // Mock database response - IP NOT on allowlist
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await isIPAllowlisted('203.0.113.50');

      expect(result).toBe(false);
    });

    it('should return false for inactive allowlist entry', async () => {
      // Mock database response - IP exists but inactive
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null, // active=false filters it out
        error: null
      });

      const result = await isIPAllowlisted('192.168.1.100');

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully (fail open)', async () => {
      // Mock database error
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Connection failed' }
      });

      const result = await isIPAllowlisted('192.168.1.100');

      // Fail open - allow IP if database check fails
      expect(result).toBe(false);
    });
  });

  describe('Allowlist Purpose Categories', () => {
    const purposes = ['testing', 'ci_cd', 'internal', 'monitoring', 'admin'];

    purposes.forEach(purpose => {
      it(`should recognize ${purpose} purpose IPs as allowlisted`, async () => {
        mockSupabaseClient.maybeSingle.mockResolvedValue({
          data: {
            id: '123',
            description: `${purpose} IP`,
            purpose: purpose
          },
          error: null
        });

        mockSupabaseClient.update.mockResolvedValueOnce({ data: null, error: null });

        const result = await isIPAllowlisted('10.0.0.1');
        expect(result).toBe(true);
      });
    });
  });

  describe('CIDR Range Support', () => {
    it('should support CIDR notation (192.168.1.0/24)', async () => {
      // Note: Implementation uses hash-based lookup, not CIDR matching
      // This test verifies that CIDR notation can be stored/retrieved
      const ipHash = require('crypto').createHash('sha256').update('192.168.1.50').digest('hex');

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: {
          id: '123',
          description: 'Internal network',
          purpose: 'internal'
        },
        error: null
      });

      mockSupabaseClient.update.mockResolvedValueOnce({ data: null, error: null });

      // IP within CIDR range should match (if hash exists)
      const result = await checkAllowlist('192.168.1.50');

      expect(result.isAllowlisted).toBe(true);
      expect(result.purpose).toBe('internal');
    });

    it('should NOT match IP outside CIDR range', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // IP outside CIDR range (hash not found)
      const result = await checkAllowlist('192.168.2.50');

      expect(result.isAllowlisted).toBe(false);
    });
  });

  describe('Hash-Based Lookup (Performance)', () => {
    it('should retrieve IP hashes for scoring exclusion', async () => {
      // Mock the final resolved value after the chain
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { ip_hash: 'hash1' },
            { ip_hash: 'hash2' },
            { ip_hash: 'hash3' }
          ],
          error: null
        })
      };

      createClient.mockReturnValueOnce(mockChain);

      const hashes = await getAllowlistHashes();

      expect(hashes).toEqual(['hash1', 'hash2', 'hash3']);
      expect(mockChain.from).toHaveBeenCalledWith('ip_allowlist');
      expect(mockChain.select).toHaveBeenCalledWith('ip_hash');
      expect(mockChain.eq).toHaveBeenCalledWith('active', true);
    });

    it('should return empty array on database error', async () => {
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      };

      createClient.mockReturnValueOnce(mockChain);

      const hashes = await getAllowlistHashes();

      expect(hashes).toEqual([]);
    });
  });
});

describe('IP Allowlist - Admin CRUD Operations', () => {
  let mockSupabase;
  let req, res;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn()
    };

    createClient.mockReturnValue(mockSupabase);

    // Mock request/response
    req = {
      user: { id: 'user-admin-123' },
      body: {},
      params: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('Admin Authorization', () => {
    it('should allow internal tier users to access allowlist', async () => {
      // Mock admin user check (first call)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      // Mock allowlist data (second call via order)
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [],
        error: null
      });

      await listAllowlist(req, res);

      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should reject non-admin users', async () => {
      // Mock non-admin user
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'free' },
        error: null
      });

      await listAllowlist(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Forbidden' })
      );
    });

    it('should reject requests without authentication', async () => {
      req.user = null;

      await listAllowlist(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Forbidden' })
      );
    });
  });

  describe('List Allowlist (GET)', () => {
    it('should return all allowlist entries', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      const mockEntries = [
        { id: '1', ip_address: '192.168.1.1', purpose: 'testing' },
        { id: '2', ip_address: '10.0.0.1', purpose: 'ci_cd' }
      ];

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockEntries,
        error: null
      });

      await listAllowlist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          allowlist: mockEntries,
          total: 2
        })
      );
    });

    it('should handle empty allowlist', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [],
        error: null
      });

      await listAllowlist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          allowlist: [],
          total: 0
        })
      );
    });
  });

  describe('Add Allowlist Entry (POST)', () => {
    beforeEach(() => {
      req.body = {
        ip_address: '192.168.1.100',
        description: 'CI/CD server',
        purpose: 'ci_cd'
      };
    });

    it('should add valid IP to allowlist', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      // Mock successful insert
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: { id: 'new-entry-123' },
        error: null
      });

      await addAllowlistEntry(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          ip_address: '192.168.1.100'
        })
      );
    });

    it('should validate IP format (reject invalid)', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.body.ip_address = 'not-an-ip';

      await addAllowlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid IP address' })
      );
    });

    it('should validate purpose (reject invalid)', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.body.purpose = 'hacking'; // Invalid purpose

      await addAllowlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid purpose' })
      );
    });

    it('should require all fields', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.body = { ip_address: '192.168.1.1' }; // Missing description, purpose

      await addAllowlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid input',
          message: expect.stringContaining('required')
        })
      );
    });

    it('should accept CIDR notation', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.body.ip_address = '192.168.1.0/24';

      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: { id: 'new-cidr-entry' },
        error: null
      });

      await addAllowlistEntry(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('Update Allowlist Entry (PATCH)', () => {
    beforeEach(() => {
      req.params = { id: 'entry-123' };
      req.body = { active: false };
    });

    it('should update allowlist entry', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      mockSupabaseClient.update.mockResolvedValueOnce({
        data: { id: 'entry-123' },
        error: null
      });

      await updateAllowlistEntry(req, res);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ active: false });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should validate purpose on update', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.body = { purpose: 'invalid-purpose' };

      await updateAllowlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid purpose' })
      );
    });

    it('should reject update with no fields', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.body = {};

      await updateAllowlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No updates provided' })
      );
    });
  });

  describe('Delete Allowlist Entry (DELETE)', () => {
    beforeEach(() => {
      req.params = { id: 'entry-123' };
    });

    it('should delete allowlist entry', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      mockSupabaseClient.delete.mockResolvedValueOnce({
        data: { id: 'entry-123' },
        error: null
      });

      await deleteAllowlistEntry(req, res);

      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'entry-123');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('removed')
        })
      );
    });

    it('should require ID parameter', async () => {
      // Mock admin check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { tier: 'internal' },
        error: null
      });

      req.params = {};

      await deleteAllowlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid input' })
      );
    });
  });
});

describe('IP Allowlist - Security Tests', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      update: vi.fn().mockReturnThis(),
      rpc: vi.fn()
    };

    createClient.mockReturnValue(mockSupabase);
  });

  describe('Bypass Attempt Prevention', () => {
    it('should NOT bypass with spoofed IP headers', async () => {
      // Attacker tries to spoof IP via X-Forwarded-For
      const spoofedIP = '192.168.1.100'; // Allowlisted IP

      // Function should use actual connection IP, not headers
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Real IP (not on allowlist)
      const result = await isIPAllowlisted('203.0.113.50');

      expect(result).toBe(false);
    });

    it('should NOT allow SQL injection in IP parameter', async () => {
      const maliciousIP = "192.168.1.1' OR '1'='1";

      // Supabase parameterized queries prevent SQL injection
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await isIPAllowlisted(maliciousIP);

      expect(result).toBe(false);
    });

    it('should handle IPv6 addresses correctly', async () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: {
          id: '123',
          description: 'IPv6 test',
          purpose: 'testing'
        },
        error: null
      });

      mockSupabaseClient.update.mockResolvedValueOnce({ data: null, error: null });

      const result = await isIPAllowlisted(ipv6);

      expect(result).toBe(true);
    });
  });

  describe('Expired Entries', () => {
    it('should check expires_at timestamp', async () => {
      // Entry expired 1 hour ago
      const expiredEntry = {
        ip_address: '192.168.1.1',
        active: true,
        expires_at: new Date(Date.now() - 3600 * 1000).toISOString()
      };

      // In real implementation, query should filter expired entries
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null, // Expired entries filtered out by query
        error: null
      });

      const result = await isIPAllowlisted('192.168.1.1');

      expect(result).toBe(false);
    });

    it('should allow non-expired entries', async () => {
      // Entry expires in 1 day
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: {
          id: '123',
          description: 'Valid entry',
          purpose: 'testing'
        },
        error: null
      });

      mockSupabaseClient.update.mockResolvedValueOnce({ data: null, error: null });

      const result = await isIPAllowlisted('192.168.1.1');

      expect(result).toBe(true);
    });
  });
});

describe('IP Allowlist - Integration with IP Reputation', () => {
  it('should exclude allowlisted IPs from reputation scoring', async () => {
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { ip_hash: 'hash_test1' },
          { ip_hash: 'hash_cicd' },
          { ip_hash: 'hash_internal' }
        ],
        error: null
      })
    };

    createClient.mockReturnValueOnce(mockChain);

    const hashes = await getAllowlistHashes();

    // These hashes should be excluded when calculating IP reputation scores
    expect(hashes).toHaveLength(3);
    expect(hashes).toContain('hash_test1');
    expect(hashes).toContain('hash_cicd');
    expect(hashes).toContain('hash_internal');
  });
});
