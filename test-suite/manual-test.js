import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// Mock BEFORE importing the implementation
vi.mock('@supabase/supabase-js');

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

// NOW import the implementation
const { isIPAllowlisted } = await import('../api/lib/ip-reputation.js');

// Test
const result = await isIPAllowlisted('192.168.1.100');
console.log('Result:', result);
console.log('Expected: true');
console.log('maybeSingle was called:', mockSupabase.maybeSingle.mock.calls.length, 'times');
