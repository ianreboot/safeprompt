-- SafePrompt Database Setup (Correct Architecture)
-- Run this in Supabase SQL Editor

-- 1. Create minimal profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  api_key TEXT UNIQUE DEFAULT gen_random_uuid(),
  api_calls_this_month INT DEFAULT 0,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create waitlist table (separate concern)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  converted_to_profile_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_profile ON api_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);

-- 7. Create function to reset monthly usage (run as cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET api_calls_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- 8. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only see their own logs
CREATE POLICY "Users can view own logs" ON api_logs
  FOR SELECT USING (profile_id = auth.uid());

-- 9. Migrate existing demo user from users to profiles (if exists)
INSERT INTO profiles (id, email, stripe_customer_id, api_key)
SELECT id, email, stripe_customer_id, 'sp_demo_k3y_f0r_pr3v13w_0nly'
FROM users
WHERE email = 'demo@safeprompt.dev'
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'Setup complete. New signups will automatically create profiles.' as status;