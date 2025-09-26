#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersTable() {
  console.log('Checking users table structure...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (users && users.length > 0) {
    console.log(`Found ${users.length} users\n`);
    console.log('Table columns:', Object.keys(users[0]));
    console.log('\nSample user:');
    const sample = users[0];
    Object.keys(sample).forEach(key => {
      let value = sample[key];
      if (typeof value === 'string' && value.length > 50) {
        value = value.substring(0, 47) + '...';
      }
      console.log(`  ${key}: ${value}`);
    });

    // Check for test user
    const testUser = users.find(u => u.email === 'test@safeprompt.dev');
    if (testUser) {
      console.log('\n' + '='.repeat(60));
      console.log('TEST USER ALREADY EXISTS!');
      console.log('='.repeat(60));
      console.log('Email:', testUser.email);
      console.log('API Key:', testUser.api_key || 'Not set');
      console.log('Stripe Customer:', testUser.stripe_customer_id || 'Not set');
      console.log('Created:', testUser.created_at);
    }
  } else {
    console.log('Users table is empty');
  }

  // Check if we can update the test user
  console.log('\n' + '='.repeat(60));
  console.log('UPDATING TEST USER FOR UNLIMITED USAGE');
  console.log('='.repeat(60));

  const testEmail = 'test@safeprompt.dev';
  const testApiKey = 'sp_test_unlimited_dogfood_key_2025';

  // First check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (existingUser) {
    // Update existing user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        api_key: testApiKey,
        stripe_customer_id: 'internal_test_account', // Mark as internal
        updated_at: new Date().toISOString()
      })
      .eq('email', testEmail);

    if (updateError) {
      console.error('Error updating user:', updateError.message);
    } else {
      console.log('✓ Updated test user with unlimited API key');
    }
  } else {
    // Create new user
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: '20c61fc4-9bc6-492a-9eeb-16f94391e745', // Use existing auth user ID
        email: testEmail,
        api_key: testApiKey,
        stripe_customer_id: 'internal_test_account',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating user:', insertError.message);
    } else {
      console.log('✓ Created test user with unlimited API key');
    }
  }

  // Verify the update
  const { data: finalUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (finalUser) {
    console.log('\n' + '='.repeat(60));
    console.log('TEST USER READY FOR DOGFOODING');
    console.log('='.repeat(60));
    console.log('\nAPI Key for testing:');
    console.log('  ' + testApiKey);
    console.log('\nHow to use:');
    console.log('1. Add header: X-API-Key: ' + testApiKey);
    console.log('2. Test endpoint: https://api.safeprompt.dev/api/v1/validate');
    console.log('\nNote: This account has unlimited API usage.');
    console.log('The validation code checks for stripe_customer_id = "internal_test_account"');
    console.log('to bypass rate limits.');
  }
}

checkUsersTable().catch(console.error);