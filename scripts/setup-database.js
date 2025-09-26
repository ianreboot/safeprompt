#!/usr/bin/env node

/**
 * Sets up the SafePrompt database schema
 * Creates profiles table if it doesn't exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('Setting up SafePrompt database schema...\n');

  try {
    // First check if profiles table exists
    const { data: existingTables, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!checkError || checkError.code !== '42P01') {
      console.log('✓ Profiles table already exists');
      return true;
    }

    console.log('Profiles table not found.');
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL SETUP REQUIRED');
    console.log('='.repeat(60));
    console.log('\n1. Go to Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${process.env.SAFEPROMPT_SUPABASE_URL.split('//')[1].split('.')[0]}`);
    console.log('\n2. Click "SQL Editor" in the left sidebar');
    console.log('\n3. Run the following SQL:');
    console.log('-'.repeat(60));

    const sql = `-- Create profiles table with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,

  -- API Key fields
  api_key TEXT UNIQUE,
  api_key_hash TEXT UNIQUE,
  api_key_hint TEXT,

  -- Usage tracking
  api_requests_used INT DEFAULT 0 NOT NULL,
  api_requests_limit INT DEFAULT 1000 NOT NULL,

  -- Subscription fields
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',

  -- Internal flag for unlimited test accounts
  is_internal BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_profiles_api_key_hash ON profiles(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add comment to explain internal flag
COMMENT ON COLUMN profiles.is_internal IS 'Internal test accounts bypass API limits for dogfooding';

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Service role can do anything (for API access)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL USING (true);`;

    console.log(sql);
    console.log('-'.repeat(60));
    console.log('\n4. After running the SQL, come back and run:');
    console.log('   node scripts/create-test-user.js');
    console.log('\n='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
setupDatabase().catch(console.error);