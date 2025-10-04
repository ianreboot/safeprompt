#!/usr/bin/env node
/**
 * Run migration 003: Add is_admin flag to profiles table
 * Uses direct UPDATE approach (DDL requires manual execution)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load credentials
dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Migration 003: Add is_admin flag to profiles');
console.log('Database:', supabaseUrl);
console.log('');

async function runMigration() {
  // Step 1: Check if column exists
  console.log('Step 1: Checking if is_admin column exists...');
  const { data: profiles, error: checkError } = await supabase
    .from('profiles')
    .select('is_admin')
    .limit(1);

  if (checkError && checkError.code === '42703') {
    // Column doesn't exist (PGRST116 or 42703)
    console.log('⚠️  Column does not exist yet');
    console.log('');
    console.log('🚨 MANUAL STEP REQUIRED:');
    console.log('The is_admin column must be added via Supabase dashboard SQL Editor.');
    console.log('');
    console.log('Go to: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/sql/new');
    console.log('');
    console.log('Run this SQL:');
    console.log('----------------------------------------');
    console.log('ALTER TABLE public.profiles');
    console.log('ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_profiles_is_admin');
    console.log('ON public.profiles(is_admin)');
    console.log('WHERE is_admin = TRUE;');
    console.log('----------------------------------------');
    console.log('');
    console.log('After running the SQL above, re-run this script to set the admin user.');
    process.exit(1);
  } else if (checkError) {
    console.error('❌ Error checking column:', checkError);
    process.exit(1);
  }

  console.log('✅ Column exists');

  // Step 2: Set ian.ho@rebootmedia.net as admin
  console.log('Step 2: Setting ian.ho@rebootmedia.net as admin...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('email', 'ian.ho@rebootmedia.net');

  if (updateError) {
    console.error('❌ Error setting admin:', updateError);
    process.exit(1);
  }

  console.log('✅ Admin user updated');

  // Step 3: Verify
  console.log('Step 3: Verifying admin user...');
  const { data: profile, error: verifyError } = await supabase
    .from('profiles')
    .select('email, is_admin')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
    process.exit(1);
  }

  console.log('');
  console.log('✅ Migration Complete!');
  console.log('');
  console.log('Admin user:', JSON.stringify(profile, null, 2));
}

runMigration();
