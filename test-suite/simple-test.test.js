import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

describe('Simple Mock Test', () => {
  it('should work with basic mock', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: '123' },
        error: null
      })
    };

    createClient.mockReturnValue(mockSupabase);

    // Import AFTER mock is set up
    const { isIPAllowlisted } = await import('../api/lib/ip-reputation.js');
    
    const result = await isIPAllowlisted('192.168.1.100');
    console.log('Result:', result);
    console.log('maybeSingle called:', mockSupabase.maybeSingle.mock.calls.length);
  });
});
