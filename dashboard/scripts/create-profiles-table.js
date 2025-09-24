#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '/home/projects/.env' })

// Initialize Supabase with service role for admin operations
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
)

async function createProfilesTable() {
  console.log('Creating profiles table...\n')

  // First check if table exists
  const { data: existingTables, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (!checkError || checkError.code !== '42P01') {
    console.log('Profiles table already exists or query succeeded')
    return true
  }

  console.log('Table does not exist, please create it manually in Supabase dashboard')
  console.log('\nSQL to run in Supabase SQL Editor:')
  console.log('=====================================\n')

  const sql = `-- Create minimal profiles table
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

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);`

  console.log(sql)
  console.log('\n=====================================')
  console.log('\n1. Go to: https://supabase.com/dashboard/project/' + process.env.SAFEPROMPT_SUPABASE_URL.split('//')[1].split('.')[0])
  console.log('2. Click on "SQL Editor" in the left sidebar')
  console.log('3. Paste and run the SQL above')
  console.log('4. Then run: node scripts/setup-users.js')

  return false
}

createProfilesTable().then(success => {
  if (success) {
    console.log('\n✅ Profiles table ready!')
    console.log('Now run: node scripts/setup-users.js')
  }
}).catch(console.error)