#!/usr/bin/env node

/**
 * Creates a test user for dogfooding SafePrompt
 * This user has unlimited API usage without Stripe billing
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

async function createTestUser() {
  console.log('Creating SafePrompt test user for dogfooding...\n');

  const testEmail = 'test@safeprompt.dev';
  const testPassword = 'SafePromptTest2025!';
  const testApiKey = 'sp_test_unlimited_dogfood_key_2025';
  const hashedKey = hashApiKey(testApiKey);
  const keyHint = testApiKey.slice(-4);

  try {
    // Step 1: Check if user exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);

    let userId;

    if (existingUser) {
      console.log(`✓ User ${testEmail} already exists in auth.users`);
      userId = existingUser.id;
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });

      if (createError) {
        console.error('Error creating auth user:', createError.message);
        return;
      }

      console.log(`✓ Created auth user: ${testEmail}`);
      userId = newUser.user.id;
    }

    // Step 2: Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          api_key: testApiKey,
          api_key_hash: hashedKey,
          api_key_hint: keyHint,
          api_requests_limit: 999999, // Very high limit
          api_requests_used: 0,
          subscription_tier: 'internal',
          subscription_status: 'active',
          is_internal: true, // Mark as internal (if column exists)
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        // Try without is_internal column
        const { error: retryError } = await supabase
          .from('profiles')
          .update({
            api_key: testApiKey,
            api_key_hash: hashedKey,
            api_key_hint: keyHint,
            api_requests_limit: 999999,
            api_requests_used: 0,
            subscription_tier: 'internal',
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (retryError) {
          console.error('Error updating profile (retry):', retryError.message);
          return;
        }
      }

      console.log(`✓ Updated existing profile for ${testEmail}`);
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: testEmail,
          api_key: testApiKey,
          api_key_hash: hashedKey,
          api_key_hint: keyHint,
          api_requests_limit: 999999,
          api_requests_used: 0,
          subscription_tier: 'internal',
          subscription_status: 'active',
          is_internal: true, // Mark as internal (if column exists)
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating profile:', insertError.message);
        // Try without is_internal column
        const { error: retryError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: testEmail,
            api_key: testApiKey,
            api_key_hash: hashedKey,
            api_key_hint: keyHint,
            api_requests_limit: 999999,
            api_requests_used: 0,
            subscription_tier: 'internal',
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (retryError) {
          console.error('Error creating profile (retry):', retryError.message);
          return;
        }
      }

      console.log(`✓ Created new profile for ${testEmail}`);
    }

    // Step 3: Verify the setup
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalProfile) {
      console.log('\n' + '='.repeat(60));
      console.log('TEST USER CREATED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log('\nCredentials for testing:');
      console.log('-'.repeat(40));
      console.log(`Email:     ${testEmail}`);
      console.log(`Password:  ${testPassword}`);
      console.log(`API Key:   ${testApiKey}`);
      console.log('-'.repeat(40));
      console.log('\nProfile details:');
      console.log(`- User ID:     ${userId}`);
      console.log(`- Tier:        ${finalProfile.subscription_tier}`);
      console.log(`- API Limit:   ${finalProfile.api_requests_limit.toLocaleString()}`);
      console.log(`- Status:      ${finalProfile.subscription_status}`);
      console.log('-'.repeat(40));
      console.log('\nUsage:');
      console.log('1. Dashboard login: Use email/password above');
      console.log('2. API calls: Add header X-API-Key: ' + testApiKey);
      console.log('3. Test endpoint: https://api.safeprompt.dev/api/v1/validate');
      console.log('\nNote: This account has unlimited API usage for dogfooding.');
      console.log('='.repeat(60));

      // Test the API key
      console.log('\nTesting API key...');
      const testResponse = await fetch('https://api.safeprompt.dev/api/v1/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': testApiKey
        },
        body: JSON.stringify({
          prompt: 'Hello world',
          mode: 'optimized'
        })
      });

      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log('✓ API key is working! Test result:', result);
      } else {
        console.log('⚠ API key test failed:', testResponse.status, await testResponse.text());
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
createTestUser().catch(console.error);