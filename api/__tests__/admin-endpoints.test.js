/**
 * Unit Tests: Admin API Endpoints
 * Tests Phase 1C admin IP management endpoints
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

// Mock supabase and ip-management modules
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase)
};

const mockIpManagement = {
  isUserAdmin: vi.fn(),
  getIpReputationList: vi.fn(),
  checkIpWhitelist: vi.fn(),
  checkIpBlacklist: vi.fn(),
  checkIpReputation: vi.fn(),
  manuallyBlockIp: vi.fn(),
  unblockIp: vi.fn(),
  addToWhitelist: vi.fn(),
  removeFromWhitelist: vi.fn(),
  addToBlacklist: vi.fn(),
  removeFromBlacklist: vi.fn(),
  getAuditLog: vi.fn()
};

// Set up mocks before imports
vi.mock('../../lib/supabase.js', async () => ({
  supabase: mockSupabase,
  default: mockSupabase
}));

vi.mock('../../lib/ip-management.js', async () => mockIpManagement);

describe('Admin Endpoints - Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without API key', async () => {
    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: {},
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing API key' });
  });

  it('should reject requests with invalid API key', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid key' }
    });

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'invalid_key' },
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or revoked API key' });
  });

  it('should reject requests from non-admin users', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { user_id: 'user-123', revoked: false },
      error: null
    });

    mockIpManagement.isUserAdmin.mockResolvedValueOnce(false);

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'valid_key' },
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
  });

  it('should allow requests from admin users', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });

    mockIpManagement.isUserAdmin.mockResolvedValueOnce(true);
    mockIpManagement.getIpReputationList.mockResolvedValueOnce({
      data: [],
      total: 0,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('GET /api/admin/ip-reputation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup admin auth
    mockSupabase.single.mockResolvedValue({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });
    mockIpManagement.isUserAdmin.mockResolvedValue(true);
  });

  it('should return IP reputation list with default parameters', async () => {
    mockIpManagement.getIpReputationList.mockResolvedValueOnce({
      data: [
        { ip_hash: 'abc123', reputation_score: 0.9, auto_block: true }
      ],
      total: 1,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.getIpReputationList).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
        offset: 0
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should respect limit and offset parameters', async () => {
    mockIpManagement.getIpReputationList.mockResolvedValueOnce({
      data: [],
      total: 0,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: { limit: '25', offset: '50' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.getIpReputationList).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 25,
        offset: 50
      })
    );
  });

  it('should enforce maximum limit of 200', async () => {
    mockIpManagement.getIpReputationList.mockResolvedValueOnce({
      data: [],
      total: 0,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: { limit: '500' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.getIpReputationList).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 200
      })
    );
  });

  it('should pass filter parameters correctly', async () => {
    mockIpManagement.getIpReputationList.mockResolvedValueOnce({
      data: [],
      total: 0,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: {
        score_min: '0.8',
        auto_block_only: 'true',
        manually_blocked_only: 'true'
      }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.getIpReputationList).toHaveBeenCalledWith(
      expect.objectContaining({
        score_min: 0.8,
        auto_block_only: true,
        manually_blocked_only: true
      })
    );
  });

  it('should reject non-GET methods', async () => {
    const handler = (await import('../api/admin/ip-reputation.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});

describe('POST /api/admin/ip-reputation/[ip]/block', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockResolvedValue({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });
    mockIpManagement.isUserAdmin.mockResolvedValue(true);
  });

  it('should block IP with valid reason', async () => {
    mockIpManagement.manuallyBlockIp.mockResolvedValueOnce({
      success: true,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation/[ip]/block.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '1.2.3.4' },
      body: { reason: 'Suspicious activity detected' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.manuallyBlockIp).toHaveBeenCalledWith(
      '1.2.3.4',
      'Suspicious activity detected',
      'admin-123'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should require reason parameter', async () => {
    const handler = (await import('../api/admin/ip-reputation/[ip]/block.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '1.2.3.4' },
      body: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Reason required') })
    );
  });

  it('should reject empty reason', async () => {
    const handler = (await import('../api/admin/ip-reputation/[ip]/block.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '1.2.3.4' },
      body: { reason: '   ' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should require IP parameter', async () => {
    const handler = (await import('../api/admin/ip-reputation/[ip]/block.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: {},
      body: { reason: 'Test reason' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('IP parameter required') })
    );
  });
});

describe('POST /api/admin/ip-reputation/[ip]/unblock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockResolvedValue({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });
    mockIpManagement.isUserAdmin.mockResolvedValue(true);
  });

  it('should unblock IP with valid reason', async () => {
    mockIpManagement.unblockIp.mockResolvedValueOnce({
      success: true,
      error: null
    });

    const handler = (await import('../api/admin/ip-reputation/[ip]/unblock.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '1.2.3.4' },
      body: { reason: 'False positive confirmed' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.unblockIp).toHaveBeenCalledWith(
      '1.2.3.4',
      'False positive confirmed',
      'admin-123'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should require reason parameter', async () => {
    const handler = (await import('../api/admin/ip-reputation/[ip]/unblock.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '1.2.3.4' },
      body: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Whitelist Management Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockResolvedValue({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });
    mockIpManagement.isUserAdmin.mockResolvedValue(true);
  });

  it('POST /api/admin/whitelist should add IP', async () => {
    mockIpManagement.addToWhitelist.mockResolvedValueOnce({
      success: true,
      data: { ip: '192.168.1.1', reason: 'Internal network' },
      error: null
    });

    const handler = (await import('../api/admin/whitelist.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      body: {
        ip: '192.168.1.1',
        reason: 'Internal network'
      }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.addToWhitelist).toHaveBeenCalledWith(
      '192.168.1.1',
      'Internal network',
      'admin-123',
      null
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('DELETE /api/admin/whitelist/[ip] should remove IP', async () => {
    mockIpManagement.removeFromWhitelist.mockResolvedValueOnce({
      success: true,
      error: null
    });

    const handler = (await import('../api/admin/whitelist/[ip].js')).default;

    const req = {
      method: 'DELETE',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '192.168.1.1' },
      body: { reason: 'No longer needed' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.removeFromWhitelist).toHaveBeenCalledWith(
      '192.168.1.1',
      'No longer needed',
      'admin-123'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('Blacklist Management Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockResolvedValue({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });
    mockIpManagement.isUserAdmin.mockResolvedValue(true);
  });

  it('POST /api/admin/blacklist should add IP with severity', async () => {
    mockIpManagement.addToBlacklist.mockResolvedValueOnce({
      success: true,
      data: { ip: '1.2.3.4', severity: 'high' },
      error: null
    });

    const handler = (await import('../api/admin/blacklist.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      body: {
        ip: '1.2.3.4',
        reason: 'Known attacker',
        severity: 'high'
      }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.addToBlacklist).toHaveBeenCalledWith(
      '1.2.3.4',
      'Known attacker',
      'high',
      'admin-123',
      null,
      null
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('POST /api/admin/blacklist should require valid severity', async () => {
    const handler = (await import('../api/admin/blacklist.js')).default;

    const req = {
      method: 'POST',
      headers: { 'x-api-key': 'admin_key' },
      body: {
        ip: '1.2.3.4',
        reason: 'Test',
        severity: 'invalid'
      }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Severity required') })
    );
  });

  it('DELETE /api/admin/blacklist/[ip] should remove IP', async () => {
    mockIpManagement.removeFromBlacklist.mockResolvedValueOnce({
      success: true,
      error: null
    });

    const handler = (await import('../api/admin/blacklist/[ip].js')).default;

    const req = {
      method: 'DELETE',
      headers: { 'x-api-key': 'admin_key' },
      query: { ip: '1.2.3.4' },
      body: { reason: 'False positive' }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.removeFromBlacklist).toHaveBeenCalledWith(
      '1.2.3.4',
      'False positive',
      'admin-123'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('GET /api/admin/audit-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockResolvedValue({
      data: { user_id: 'admin-123', revoked: false },
      error: null
    });
    mockIpManagement.isUserAdmin.mockResolvedValue(true);
  });

  it('should return audit log with default parameters', async () => {
    mockIpManagement.getAuditLog.mockResolvedValueOnce({
      data: [
        {
          action_type: 'block',
          ip: '1.2.3.4',
          reason: 'Test',
          created_at: '2025-10-07T10:00:00Z'
        }
      ],
      total: 1,
      error: null
    });

    const handler = (await import('../api/admin/audit-log.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: {}
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100,
        offset: 0
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should pass filter parameters correctly', async () => {
    mockIpManagement.getAuditLog.mockResolvedValueOnce({
      data: [],
      total: 0,
      error: null
    });

    const handler = (await import('../api/admin/audit-log.js')).default;

    const req = {
      method: 'GET',
      headers: { 'x-api-key': 'admin_key' },
      query: {
        action_type: 'block',
        ip: '1.2.3.4',
        admin_user_id: 'admin-123'
      }
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };

    await handler(req, res);

    expect(mockIpManagement.getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'block',
        ip: '1.2.3.4',
        admin_user_id: 'admin-123'
      })
    );
  });
});
