/**
 * Setup Internal Account for Dogfooding
 *
 * Ensures ian.ho@rebootmedia.net profile exists with correct configuration:
 * - Hashed API key (like regular users)
 * - High request limit (999999999 = functionally unlimited)
 * - Active subscription with 'internal' tier
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INTERNAL_EMAIL = 'ian.ho@rebootmedia.net';
const HASHED_KEY = 'dee78d9e680420d779833e5765ae856c219498a29272859edb2aabdd8b6ba327';
const UNLIMITED_LIMIT = 999999999;

async function setupInternalAccount() {
  console.log('🔧 Setting up internal account for dogfooding...\n');

  // Check if profile exists
  console.log('1️⃣  Checking if profile exists...');
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', INTERNAL_EMAIL)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('❌ Error checking profile:', fetchError);
    return;
  }

  if (existingProfile) {
    console.log('✅ Profile exists');
    console.log('   Current state:');
    console.log(`   - ID: ${existingProfile.id}`);
    console.log(`   - API Key Hash: ${existingProfile.api_key_hash || 'NULL'}`);
    console.log(`   - Requests Used: ${existingProfile.api_requests_used || 0}`);
    console.log(`   - Requests Limit: ${existingProfile.api_requests_limit || 0}`);
    console.log(`   - Subscription: ${existingProfile.subscription_status || 'N/A'}`);
    console.log(`   - Tier: ${existingProfile.subscription_tier || 'N/A'}`);
    console.log('');

    // Update profile with correct configuration
    console.log('2️⃣  Updating profile configuration...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        api_key_hash: HASHED_KEY,
        api_requests_limit: UNLIMITED_LIMIT,
        subscription_status: 'active',
        subscription_tier: 'internal',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProfile.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }

    console.log('✅ Profile updated successfully');
  } else {
    console.log('⚠️  Profile does not exist');
    console.log('');

    // Create new profile
    console.log('2️⃣  Creating new profile...');
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: INTERNAL_EMAIL,
        api_key_hash: HASHED_KEY,
        api_requests_used: 0,
        api_requests_limit: UNLIMITED_LIMIT,
        subscription_status: 'active',
        subscription_tier: 'internal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating profile:', insertError);
      return;
    }

    console.log('✅ Profile created successfully');
    console.log(`   - ID: ${newProfile.id}`);
  }

  // Verify final state
  console.log('');
  console.log('3️⃣  Verifying final configuration...');
  const { data: verifiedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', INTERNAL_EMAIL)
    .single();

  if (verifiedProfile) {
    console.log('✅ Verification complete');
    console.log('   Final state:');
    console.log(`   - ID: ${verifiedProfile.id}`);
    console.log(`   - API Key Hash: ${verifiedProfile.api_key_hash}`);
    console.log(`   - Requests Used: ${verifiedProfile.api_requests_used}`);
    console.log(`   - Requests Limit: ${verifiedProfile.api_requests_limit.toLocaleString()}`);
    console.log(`   - Subscription: ${verifiedProfile.subscription_status}`);
    console.log(`   - Tier: ${verifiedProfile.subscription_tier}`);

    // Calculate usage percentage
    const usagePercent = (verifiedProfile.api_requests_used / verifiedProfile.api_requests_limit * 100).toFixed(6);
    console.log(`   - Usage: ${usagePercent}%`);
    console.log('');
    console.log('🎉 Internal account ready for dogfooding!');
    console.log('');
    console.log('📊 Next steps:');
    console.log('   1. Deploy code changes (remove special case logic)');
    console.log('   2. Test API calls increment usage counter');
    console.log('   3. Verify dashboard shows real statistics');
  }
}

setupInternalAccount().catch(console.error);
