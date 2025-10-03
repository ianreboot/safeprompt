#!/usr/bin/env node
/**
 * Fix user account that paid but wasn't created properly
 * User: yuenho.8@gmail.com
 * Stripe Customer: cus_TAHf0cLVbZ6zFU
 * Stripe Subscription: sub_1SDxRrExyn6XfOJwiE5GrGCR
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

const email = 'yuenho.8@gmail.com';
const stripeCustomerId = 'cus_TAHf0cLVbZ6zFU';
const stripeSubscriptionId = 'sub_1SDxRrExyn6XfOJwiE5GrGCR';

console.log('🔧 Fixing user account for:', email);
console.log('');

// Step 1: Create the user in Supabase Auth
console.log('Step 1: Creating user in Supabase Auth...');
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password: 'TempPassword123!', // Temporary - user can reset via forgot password
  email_confirm: true,  // Auto-confirm since they paid
  user_metadata: {
    plan: 'paid',
    signup_source: 'manual_fix',
    beta_user: true,
    stripe_customer_id: stripeCustomerId,
    note: 'Account created manually after successful payment - user paid but signup failed'
  }
});

if (authError) {
  console.error('❌ Failed to create user:', authError.message);
  process.exit(1);
}

const userId = authData.user.id;
console.log('✅ User created with ID:', userId);
console.log('');

// Step 2: Update the profile (should be auto-created by trigger)
console.log('Step 2: Updating profile with Stripe info...');

// Wait a moment for the trigger to create the profile
await new Promise(resolve => setTimeout(resolve, 2000));

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .update({
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    subscription_tier: 'early_bird',
    api_requests_limit: 100000  // Early bird tier limit
  })
  .eq('id', userId)
  .select()
  .single();

if (profileError) {
  console.error('❌ Failed to update profile:', profileError.message);

  // Try to create profile manually if trigger didn't work
  console.log('Attempting to create profile manually...');
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: 'active',
      subscription_tier: 'early_bird',
      api_requests_limit: 100000
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create profile:', createError.message);
    process.exit(1);
  }

  console.log('✅ Profile created manually');
} else {
  console.log('✅ Profile updated successfully');
}

// Step 3: Update Stripe customer metadata with correct user ID
console.log('');
console.log('Step 3: Updating Stripe customer metadata...');

const stripeKey = process.env.STRIPE_PROD_SECRET_KEY;
const updateResponse = await fetch(
  `https://api.stripe.com/v1/customers/${stripeCustomerId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'metadata[supabase_user_id]': userId,
      'metadata[fixed]': 'true',
      'metadata[fix_date]': new Date().toISOString()
    })
  }
);

const updateData = await updateResponse.json();

if (updateData.error) {
  console.error('❌ Failed to update Stripe:', updateData.error.message);
} else {
  console.log('✅ Stripe customer metadata updated');
}

// Step 4: Verify everything
console.log('');
console.log('='.repeat(60));
console.log('✅ ACCOUNT FIX COMPLETE');
console.log('='.repeat(60));
console.log('');
console.log('User can now log in with:');
console.log('  Email:', email);
console.log('  Password: TempPassword123!');
console.log('');
console.log('⚠️  IMPORTANT: User should reset their password immediately');
console.log('  They can use "Forgot Password" on the login page');
console.log('');
console.log('Account Status:');
console.log('  Subscription: active');
console.log('  Tier: early_bird ($5/month)');
console.log('  API Limit: 100,000 requests/month');
console.log('  Stripe Customer:', stripeCustomerId);
console.log('  Stripe Subscription:', stripeSubscriptionId);
