import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Force module to be re-evaluated
vi.resetModules();

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({
    data: { id: '123', description: 'test', purpose: 'testing' },
    error: null
  }),
  update: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null })
};

createClient.mockReturnValue(mockSupabase);

// Import AFTER setting up the mock
const { isIPAllowlisted } = await import('../api/lib/ip-reputation.js');

describe('Simple Mock Test 2', () => {
  it('should work', async () => {
    mockSupabase.maybeSingle.mockClear();
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { id: '123', description: 'test', purpose: 'testing' },
      error: null
    });

    const result = await isIPAllowlisted('192.168.1.100');
    console.log('Result:', result);
    console.log('maybeSingle called:', mockSupabase.maybeSingle.mock.calls.length);
    console.log('createClient called:', createClient.mock.calls.length);
  });
});
