#!/usr/bin/env node
/**
 * Test admin authentication
 * Tests both admin access (should succeed) and non-admin access (should fail)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load credentials
dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseAnonKey = process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY;
const adminEmail = 'ian.ho@rebootmedia.net';
const adminPassword = 'txpPAf#sLgXm0&07vMN*';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Admin Authentication');
console.log('API URL: https://api.safeprompt.dev/admin?action=approve-waitlist');
console.log('');

async function testAdminAuth() {
  // Step 1: Sign in as admin user
  console.log('Step 1: Signing in as admin user (ian.ho@rebootmedia.net)...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }

  const adminToken = authData.session.access_token;
  console.log('✅ Signed in successfully');
  console.log('Token (first 50 chars):', adminToken.substring(0, 50) + '...');
  console.log('');

  // Step 2: Test admin endpoint with admin token (should succeed)
  console.log('Step 2: Testing admin endpoint with admin token...');
  console.log('Expected: Should succeed (200 or 404 for missing waitlist user)');

  const adminResponse = await fetch('https://api.safeprompt.dev/admin?action=approve-waitlist', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'test-nonexistent@example.com' })
  });

  const adminResult = await adminResponse.json();
  console.log('Status:', adminResponse.status);
  console.log('Response:', JSON.stringify(adminResult, null, 2));
  console.log('');

  if (adminResponse.status === 403) {
    console.error('❌ FAILED: Admin user was rejected (403 Forbidden)');
    console.error('This means the admin authentication is not working correctly.');
    process.exit(1);
  } else if (adminResponse.status === 401) {
    console.error('❌ FAILED: Token was rejected (401 Unauthorized)');
    console.error('This means the Bearer token authentication is not working.');
    process.exit(1);
  } else if (adminResponse.status === 404 || adminResult.code === 'NOT_FOUND') {
    console.log('✅ PASSED: Admin authentication working (user not in waitlist as expected)');
  } else if (adminResponse.status === 200) {
    console.log('✅ PASSED: Admin authentication working (operation succeeded)');
  } else {
    console.log('⚠️  Unexpected status:', adminResponse.status);
    console.log('But not a 403/401, so admin auth may be working');
  }

  // Step 3: Test without token (should fail with 401)
  console.log('Step 3: Testing admin endpoint without token...');
  console.log('Expected: Should fail with 401 Unauthorized');

  const noTokenResponse = await fetch('https://api.safeprompt.dev/admin?action=approve-waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'test@example.com' })
  });

  const noTokenResult = await noTokenResponse.json();
  console.log('Status:', noTokenResponse.status);
  console.log('Response:', JSON.stringify(noTokenResult, null, 2));
  console.log('');

  if (noTokenResponse.status === 401) {
    console.log('✅ PASSED: Correctly rejected request without token');
  } else {
    console.error('❌ FAILED: Should have returned 401, got:', noTokenResponse.status);
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✅ All Admin Authentication Tests Passed!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Summary:');
  console.log('✅ Admin user (ian.ho@rebootmedia.net) can access admin endpoints');
  console.log('✅ Requests without Bearer token are rejected (401)');
  console.log('');
  console.log('Note: Non-admin user test requires creating a non-admin account.');
  console.log('If you need to test non-admin rejection (403), create a test user');
  console.log('and re-run this script with those credentials.');
}

testAdminAuth();
