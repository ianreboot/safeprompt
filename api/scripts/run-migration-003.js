#!/usr/bin/env node
/**
 * Run migration 003: Add is_admin flag to profiles table
 * Uses Supabase client library (works with new sb_secret_ keys)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load credentials from /home/projects/.env
dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Expected: SAFEPROMPT_PROD_SUPABASE_URL and SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Running migration 003_add_admin_flag.sql on PRODUCTION database...');
console.log('Database:', supabaseUrl);
console.log('');

// Read migration SQL
const migrationSQL = readFileSync('/home/projects/safeprompt/api/migrations/003_add_admin_flag.sql', 'utf8');

try {
  // Execute migration SQL
  // Note: Supabase client doesn't support multi-statement SQL, so we need to execute each statement separately

  console.log('Step 1: Adding is_admin column...');
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;'
  });

  if (alterError) {
    // Try direct approach if RPC doesn't exist
    console.log('RPC not available, trying direct SQL execution...');

    // Add column
    await supabase.from('_migrations').select('*').limit(0); // This will fail but force connection

    // Use raw SQL via PostgREST (limited but may work for simple operations)
    console.log('⚠️  Cannot execute DDL via Supabase JS client');
    console.log('');
    console.log('Manual steps required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/editor');
    console.log('2. Click "SQL Editor"');
    console.log('3. Paste the contents of /api/migrations/003_add_admin_flag.sql');
    console.log('4. Click "Run"');
    console.log('');
    console.log('OR use the Supabase CLI:');
    console.log('  supabase db push --project-ref adyfhzbcsqzgqvyimycv');
    process.exit(1);
  }

  console.log('✅ Column added');

  console.log('Step 2: Setting ian.ho@rebootmedia.net as admin...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('email', 'ian.ho@rebootmedia.net');

  if (updateError) {
    console.error('❌ Error updating admin user:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Admin user updated');

  console.log('Step 3: Creating index...');
  const { error: indexError } = await supabase.rpc('exec_sql', {
    sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;'
  });

  if (indexError) {
    console.log('⚠️  Index creation skipped (requires manual execution)');
  } else {
    console.log('✅ Index created');
  }

  console.log('');
  console.log('✅ Migration completed successfully!');
  console.log('');

  // Verify
  console.log('Verifying admin user...');
  const { data: profile, error: verifyError } = await supabase
    .from('profiles')
    .select('email, is_admin')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    process.exit(1);
  }

  console.log('Admin user:', profile);
  console.log('');
  console.log('✅ All checks passed!');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
}
