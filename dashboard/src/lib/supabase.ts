import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // SECURITY: Session configuration
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for enhanced security
    // Session will auto-refresh before expiry (Supabase default: 1 hour)
    // Refresh token valid for: 30 days (Supabase default)
  },
  global: {
    headers: {
      'X-Client-Info': 'safeprompt-dashboard',
    },
  },
})