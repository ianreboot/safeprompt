/**
 * Supabase Client - Shared Instance
 *
 * Provides a centralized Supabase client for database operations.
 * Uses lazy initialization to allow environment variables to be loaded first.
 */

import { createClient } from '@supabase/supabase-js';

// Lazy initialize Supabase client (allows env to be loaded first)
let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      // Return a dummy object for testing - allows tests to mock without errors
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.warn('[supabase.js] Environment variables not set, returning empty client for testing');
        return {}; // Return empty object that can be mocked
      }
      throw new Error('Supabase URL and Service Role Key must be configured');
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Export the lazy-initialized client
export const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabase()[prop];
  }
});

export default supabase;
