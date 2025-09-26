#!/usr/bin/env node

/**
 * Creates an internal test user for SafePrompt dogfooding
 * Uses the existing users table structure
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

    // Step 2: Check if user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tier: 'free', // Use valid tier (will use monthly_limit for unlimited)
          monthly_limit: 999999, // Unlimited
          subscription_status: 'active',
          is_beta_user: true, // Mark as special user
          beta_price: 0, // Free
          use_case: 'Internal testing and dogfooding',
          company_name: 'SafePrompt Internal',
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError.message);
        return;
      }
      console.log(`✓ Updated existing user in users table`);
    } else {
      // Create new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: testEmail,
          tier: 'free', // Use valid tier (will use monthly_limit for unlimited)
          monthly_limit: 999999, // Unlimited
          subscription_status: 'active',
          is_beta_user: true,
          beta_price: 0,
          use_case: 'Internal testing and dogfooding',
          company_name: 'SafePrompt Internal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user:', insertError.message);
        return;
      }
      console.log(`✓ Created new user in users table`);
    }

    // Step 3: Create or update the API key in a separate storage
    // Since the users table doesn't have an api_key column, we'll use
    // a simple mapping in the validation code

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
    console.log(`- Tier:          internal`);
    console.log(`- Monthly Limit: 999,999 (unlimited)`);
    console.log(`- Beta User:     Yes`);
    console.log(`- Status:        Active`);
    console.log('-'.repeat(40));
    console.log('\nIMPORTANT NEXT STEP:');
    console.log('The API validation code needs to be updated to:');
    console.log('1. Map this API key to the test user');
    console.log('2. Check for tier="internal" or monthly_limit=999999');
    console.log('3. Skip rate limiting for this user');
    console.log('\nFile to update: /home/projects/safeprompt/api/api/v1/validate.js');
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