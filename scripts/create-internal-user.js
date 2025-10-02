#!/usr/bin/env node

/**
 * Creates an internal test user for SafePrompt dogfooding
 * Uses the profiles table structure
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function createInternalUser() {
  console.log('Creating internal test user for dogfooding...\n');

  const testEmail = 'test@safeprompt.dev';
  const testPassword = 'SafePromptTest2025!';
  const testApiKey = 'sp_test_unlimited_dogfood_key_2025';

  try {
    // Step 1: Ensure auth user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    let authUser = authUsers?.users?.find(u => u.email === testEmail);

    if (!authUser) {
      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });

      if (createError) {
        console.error('Error creating auth user:', createError.message);
        return;
      }

      authUser = newUser.user;
      console.log(`✓ Created auth user: ${testEmail}`);
    } else {
      console.log(`✓ Auth user already exists: ${testEmail}`);
    }

    // Step 2: Check if user exists in profiles table
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free', // Use valid tier (will use api_requests_limit for unlimited)
          api_requests_limit: 999999, // Unlimited
          subscription_status: 'active',
          api_key: testApiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError.message);
        return;
      }
      console.log(`✓ Updated existing user in profiles table`);
    } else {
      // Create new user
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: testEmail,
          subscription_tier: 'free', // Use valid tier (will use api_requests_limit for unlimited)
          api_requests_limit: 999999, // Unlimited
          subscription_status: 'active',
          api_key: testApiKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user:', insertError.message);
        return;
      }
      console.log(`✓ Created new user in profiles table`);
    }

    // Step 3: API key is now stored directly in the profiles table

    console.log('\n' + '='.repeat(60));
    console.log('INTERNAL TEST USER CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nCredentials:');
    console.log('-'.repeat(40));
    console.log(`Email:     ${testEmail}`);
    console.log(`Password:  ${testPassword}`);
    console.log(`API Key:   ${testApiKey}`);
    console.log('-'.repeat(40));
    console.log('\nUser Settings:');
    console.log(`- Tier:                 free`);
    console.log(`- API Requests Limit:   999,999 (unlimited)`);
    console.log(`- Status:               Active`);
    console.log('-'.repeat(40));
    console.log('\nAPI key is now stored in the profiles table.');
    console.log('The API validation code automatically recognizes high limits.');
    console.log('='.repeat(60));

    // Step 4: Test the endpoint with basic auth
    console.log('\nTesting authentication...');
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('⚠ Sign-in test failed:', signInError.message);
    } else {
      console.log('✓ Authentication successful!');
      console.log(`  Session token: ${session.session.access_token.substring(0, 20)}...`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
createInternalUser().catch(console.error);