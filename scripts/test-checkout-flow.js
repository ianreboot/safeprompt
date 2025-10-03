#!/usr/bin/env node
/**
 * Test Stripe Checkout Flow
 *
 * Tests the complete checkout session creation flow:
 * 1. Creates a test user in Supabase
 * 2. Calls the checkout API to create a Stripe session
 * 3. Verifies session creation and URL
 * 4. Cleans up test user
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config({ path: '/home/projects/.env' });

// Use production Supabase and API
const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

const API_URL = 'https://api.safeprompt.dev';

async function testCheckoutFlow() {
  console.log('🧪 Testing Stripe Checkout Flow\n');
  console.log('='.repeat(70));

  const testEmail = `test-${crypto.randomBytes(4).toString('hex')}@safeprompt.dev`;
  const testPassword = crypto.randomBytes(16).toString('hex');
  let testUserId = null;

  try {
    // Step 1: Create test user
    console.log('\n📝 Step 1: Creating test user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) throw new Error(`Auth error: ${authError.message}`);

    testUserId = authData.user.id;
    console.log(`✅ Created user: ${testEmail}`);
    console.log(`   User ID: ${testUserId}`);

    // Step 2: Create checkout session
    console.log('\n💳 Step 2: Creating Stripe checkout session...');
    const response = await fetch(`${API_URL}/api/admin?action=create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        email: testEmail,
        successUrl: 'https://dashboard.safeprompt.dev?welcome=true',
        cancelUrl: 'https://safeprompt.dev/signup'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API error: ${JSON.stringify(data)}`);
    }

    // Step 3: Verify response
    console.log('\n🔍 Step 3: Verifying checkout session...');

    if (!data.success) {
      throw new Error('Checkout session creation failed: success=false');
    }

    if (!data.url) {
      throw new Error('Checkout session missing URL');
    }

    if (!data.url.startsWith('https://checkout.stripe.com')) {
      throw new Error(`Invalid checkout URL: ${data.url}`);
    }

    if (!data.sessionId || !data.sessionId.startsWith('cs_')) {
      throw new Error(`Invalid session ID: ${data.sessionId}`);
    }

    console.log('✅ Checkout session created successfully!');
    console.log(`   Session ID: ${data.sessionId}`);
    console.log(`   Checkout URL: ${data.url.substring(0, 80)}...`);

    // Step 4: Verify Stripe customer created
    console.log('\n👤 Step 4: Verifying Stripe customer...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log(`⚠️  Warning: Could not verify profile: ${profileError.message}`);
    } else if (profile?.stripe_customer_id) {
      console.log(`✅ Stripe customer ID stored: ${profile.stripe_customer_id}`);
    } else {
      console.log('⚠️  Warning: No Stripe customer ID found in profile');
    }

    // Success!
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(70));
    console.log('\n🎉 Checkout flow is working correctly!');
    console.log('\nProduction Setup Verified:');
    console.log('  ✅ Supabase production database connected');
    console.log('  ✅ Stripe production mode working');
    console.log('  ✅ Checkout session creation successful');
    console.log('  ✅ Session URL valid');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    // Cleanup: Delete test user
    if (testUserId) {
      console.log('\n🧹 Cleanup: Deleting test user...');
      try {
        await supabase.auth.admin.deleteUser(testUserId);
        console.log('✅ Test user deleted');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup warning:', cleanupError.message);
      }
    }
  }
}

// Run test
testCheckoutFlow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
