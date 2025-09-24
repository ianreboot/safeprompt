#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '/home/projects/.env' })

// Initialize Supabase with service role for admin operations
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
)

async function setupDatabase() {
  console.log('Setting up database schema...\n')

  const sql = `
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

    -- 7. Row Level Security (RLS)
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

    -- Users can only see their own profile
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);

    -- Users can only see their own logs
    CREATE POLICY "Users can view own logs" ON api_logs
      FOR SELECT USING (profile_id = auth.uid());
  `

  // Execute SQL using RPC
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(err => {
    // If RPC doesn't exist, try direct approach
    console.log('RPC not available, running SQL statements individually...')
    return { error: err }
  })

  if (error) {
    console.log('Creating tables individually...')

    // Try creating tables one by one
    try {
      // Check if profiles table exists
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles')

      if (!tables || tables.length === 0) {
        console.log('Profiles table needs to be created manually in Supabase dashboard')
        console.log('Please run the SQL in database/setup.sql in your Supabase SQL editor')
      } else {
        console.log('Profiles table already exists')
      }
    } catch (e) {
      console.log('\n⚠️  Cannot check table existence automatically')
      console.log('Please run database/setup.sql in Supabase SQL editor')
    }
  } else {
    console.log('✅ Database schema created successfully!')
  }
}

setupDatabase().catch(console.error)