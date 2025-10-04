-- SafePrompt Database Setup (Production Schema)
-- Run this in Supabase SQL Editor

-- 1. Create profiles table (main user table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  api_key TEXT UNIQUE,
  api_key_hash TEXT,
  api_key_hint TEXT,
  api_requests_limit INT DEFAULT 1000,
  api_requests_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create API logs table for usage tracking
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  prompt_length INT,
  response_time_ms INT,
  safe BOOLEAN,
  threats TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create billing events table (Stripe webhooks)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  raw_data JSONB
);

-- 7. Create playground tables
CREATE TABLE IF NOT EXISTS public.playground_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  session_id TEXT,
  test_id TEXT,
  prompt_hash TEXT NOT NULL,
  prompt_length INT NOT NULL,
  protected_result JSONB,
  unprotected_result JSONB,
  response_time_ms INT,
  abuse_score INT DEFAULT 0,
  abuse_signals TEXT[],
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.playground_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  minute_count INT DEFAULT 0,
  hour_count INT DEFAULT 0,
  day_count INT DEFAULT 0,
  minute_reset_at TIMESTAMPTZ DEFAULT NOW(),
  hour_reset_at TIMESTAMPTZ DEFAULT NOW(),
  day_reset_at TIMESTAMPTZ DEFAULT NOW(),
  abuse_score INT DEFAULT 0,
  permanent_ban BOOLEAN DEFAULT false,
  ban_reason TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_requests INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.playground_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_requests INT DEFAULT 0,
  unique_ips INT DEFAULT 0,
  gallery_requests INT DEFAULT 0,
  custom_requests INT DEFAULT 0,
  attacks_detected INT DEFAULT 0,
  legitimate_allowed INT DEFAULT 0,
  avg_response_time_ms INT,
  abuse_incidents INT DEFAULT 0,
  bans_issued INT DEFAULT 0,
  estimated_cost_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_profiles_api_key_hash ON profiles(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_profile ON api_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_profile ON billing_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_playground_requests_ip ON playground_requests(ip_hash);
CREATE INDEX IF NOT EXISTS idx_playground_requests_created ON playground_requests(created_at);

-- 9. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_analytics ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated profile creation" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) = 'ian.ho@rebootmedia.net'
  );

-- 11. RLS Policies for api_logs
CREATE POLICY "Users can view own logs" ON api_logs
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "API can insert logs" ON api_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all api_logs" ON api_logs
  FOR SELECT USING (
    (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) = 'ian.ho@rebootmedia.net'
  );

-- 12. RLS Policies for waitlist
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admins can view all waitlist" ON waitlist
  FOR SELECT USING (
    (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) = 'ian.ho@rebootmedia.net'
  );

CREATE POLICY "Service role full access" ON waitlist
  FOR ALL TO service_role USING (true);

-- 13. RLS Policies for billing_events
CREATE POLICY "Users can view own billing events" ON billing_events
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Service role full access to billing" ON billing_events
  FOR ALL TO service_role USING (true);

-- 14. RLS Policies for playground tables (service role only)
CREATE POLICY "Service role full access on requests" ON playground_requests
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on rate_limits" ON playground_rate_limits
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on analytics" ON playground_analytics
  FOR ALL TO service_role USING (true);

-- 15. RLS Policy for auth.users (required for admin checks)
CREATE POLICY "Users can read own auth data" ON auth.users
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Verification
SELECT
  'Setup complete. Schema matches production.' as status,
  COUNT(*) as profile_count
FROM profiles;
