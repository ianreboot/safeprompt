import { describe, it, expect, vi } from 'vitest';

const mockSupabaseClient = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

import { isIPAllowlisted } from '../api/lib/ip-reputation.js';

describe('Debug', () => {
  it('check if mock works', async () => {
    // Set up mocks
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: { id: '123', description: 'test', purpose: 'testing' },
      error: null
    });

    const result = await isIPAllowlisted('192.168.1.100');
    
    console.log('Result:', result);
    console.log('from called:', mockSupabaseClient.from.mock.calls.length, 'times');
    console.log('maybeSingle called:', mockSupabaseClient.maybeSingle.mock.calls.length, 'times');
    
    expect(mockSupabaseClient.from).toHaveBeenCalled();
  });
});
