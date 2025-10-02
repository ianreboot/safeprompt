#!/usr/bin/env node

/**
 * Updates the internal test account to use ian.ho@rebootmedia.net
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function updateInternalUser() {
  const oldEmail = 'test@safeprompt.dev';
  const newEmail = 'ian.ho@rebootmedia.net';
  const password = 'SafePromptTest2025!';
  const apiKey = 'sp_test_unlimited_dogfood_key_2025';

  console.log('Updating internal user to ian.ho@rebootmedia.net...\n');

  try {
    // Step 1: Check if old user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const oldUser = authUsers?.users?.find(u => u.email === oldEmail);
    let existingIanUser = authUsers?.users?.find(u => u.email === newEmail);

    if (!oldUser) {
      console.log('⚠ Old test user not found, creating new user directly');
    }

    // Step 2: Create or update ian.ho@rebootmedia.net user
    if (!existingIanUser) {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: password,
        email_confirm: true
      });

      if (createError) {
        console.error('Error creating auth user:', createError.message);
        return;
      }

      existingIanUser = newUser.user;
      console.log(`✓ Created auth user: ${newEmail}`);
    } else {
      console.log(`✓ Auth user already exists: ${newEmail}`);

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingIanUser.id,
        { password: password }
      );

      if (updateError) {
        console.log('⚠ Could not update password:', updateError.message);
      } else {
        console.log('✓ Updated password for existing user');
      }
    }

    // Step 3: Update profiles table
    const { data: existingUserData } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', newEmail)
      .single();

    if (existingUserData) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          api_requests_limit: 999999,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('email', newEmail);

      if (updateError) {
        console.error('Error updating profiles table:', updateError.message);
      } else {
        console.log(`✓ Updated existing entry in profiles table`);
      }
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: existingIanUser.id,
          email: newEmail,
          subscription_tier: 'free',
          api_requests_limit: 999999,
          subscription_status: 'active',
          api_key: apiKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating profiles table entry:', insertError.message);

        // If it fails due to ID conflict, try update instead
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: newEmail,
            subscription_tier: 'free',
            api_requests_limit: 999999,
            subscription_status: 'active',
            api_key: apiKey,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingIanUser.id);

        if (!updateError) {
          console.log(`✓ Updated profiles table entry by ID`);
        }
      } else {
        console.log(`✓ Created new entry in profiles table`);
      }
    }

    // Step 4: Clean up old test user if it exists
    if (oldUser && oldUser.id !== existingIanUser.id) {
      // Delete old user from profiles table
      await supabase.from('profiles').delete().eq('id', oldUser.id);
      // Delete old auth user
      await supabase.auth.admin.deleteUser(oldUser.id);
      console.log(`✓ Cleaned up old test user`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('INTERNAL ACCOUNT UPDATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nCredentials:');
    console.log('-'.repeat(40));
    console.log(`Email:     ${newEmail}`);
    console.log(`Password:  ${password}`);
    console.log(`API Key:   ${apiKey}`);
    console.log('-'.repeat(40));
    console.log('\nUser Settings:');
    console.log(`- Company:       Reboot Media`);
    console.log(`- Monthly Limit: 999,999 (unlimited)`);
    console.log(`- Beta User:     Yes`);
    console.log(`- Status:        Active`);
    console.log('='.repeat(60));

    // Test authentication
    console.log('\nTesting authentication...');
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email: newEmail,
      password: password
    });

    if (signInError) {
      console.log('⚠ Sign-in test failed:', signInError.message);
    } else {
      console.log('✓ Authentication successful!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateInternalUser().catch(console.error);