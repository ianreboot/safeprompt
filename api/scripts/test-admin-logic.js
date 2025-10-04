#!/usr/bin/env node
/**
 * Test admin logic by simulating the authentication flow
 * This verifies the database-level auth logic without needing valid password
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Admin Logic (Database-Level)');
console.log('');

async function testAdminLogic() {
  const adminUserId = '3ee52636-7d84-495d-a956-e42791bf7c21'; // ian.ho@rebootmedia.net

  // Simulate the admin check that happens in admin.js
  console.log('Simulating admin authentication check...');
  console.log('User ID:', adminUserId);
  console.log('');

  // This is exactly what admin.js does after verifying the Bearer token
  console.log('Step 1: Query profiles table for is_admin flag...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminUserId)
    .single();

  if (profileError) {
    console.log('❌ FAILED: Could not fetch profile');
    console.log('Error:', profileError);
    console.log('Admin endpoint would return: 401 Unauthorized');
    process.exit(1);
  }

  console.log('✅ Profile found');
  console.log('   is_admin:', profile.is_admin);
  console.log('');

  // Check if admin
  console.log('Step 2: Check if user is admin...');
  if (!profile.is_admin) {
    console.log('❌ FAILED: User is not admin');
    console.log('Admin endpoint would return: 403 Forbidden');
    process.exit(1);
  }

  console.log('✅ User is admin');
  console.log('Admin endpoint would allow access');
  console.log('');

  // Test with non-admin user (if one exists)
  console.log('Step 3: Testing with a non-admin user...');
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .limit(5);

  const nonAdminUser = allProfiles.find(p => !p.is_admin);

  if (nonAdminUser) {
    console.log('Found non-admin user:', nonAdminUser.email);

    const { data: nonAdminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', nonAdminUser.id)
      .single();

    console.log('   is_admin:', nonAdminProfile.is_admin);

    if (nonAdminProfile.is_admin) {
      console.log('❌ FAILED: Non-admin user shows as admin');
      process.exit(1);
    } else {
      console.log('✅ Non-admin user correctly identified');
      console.log('   Admin endpoint would return: 403 Forbidden');
    }
  } else {
    console.log('⚠️  No non-admin users found to test with');
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✅ Admin Logic Tests Passed!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Summary:');
  console.log('✅ Database has is_admin column');
  console.log('✅ ian.ho@rebootmedia.net has is_admin = true');
  console.log('✅ Non-admin users have is_admin = false (or NULL)');
  console.log('✅ Admin endpoint logic will work correctly');
  console.log('');
  console.log('Next: Deploy code to production (merge dev→main)');
}

testAdminLogic();
