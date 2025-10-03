#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking Production Database State');
console.log('Database:', process.env.SAFEPROMPT_PROD_SUPABASE_URL);
console.log('');

// Check yuenho profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', 'yuenho.8@gmail.com')
  .single();

if (error) {
  console.log('❌ yuenho.8@gmail.com profile error:', error.message);
} else {
  console.log('✅ yuenho.8@gmail.com Profile:');
  console.log('  ID:', profile.id);
  console.log('  Email:', profile.email);
  console.log('  Subscription Status:', profile.subscription_status);
  console.log('  Subscription Tier:', profile.subscription_tier);
  console.log('  Stripe Customer:', profile.stripe_customer_id);
  console.log('  Stripe Subscription:', profile.stripe_subscription_id);
  console.log('  API Requests Limit:', profile.api_requests_limit);
  console.log('  API Key:', profile.api_key ? 'EXISTS' : 'NULL');
}

// Check all profiles (what admin panel sees)
console.log('');
console.log('='.repeat(60));
console.log('ADMIN PANEL DATA');
console.log('='.repeat(60));

const { data: allProfiles } = await supabase
  .from('profiles')
  .select('email, subscription_status, subscription_tier, stripe_customer_id, stripe_subscription_id')
  .order('created_at', { ascending: false });

const totalUsers = allProfiles?.length || 0;
const activeSubscribers = allProfiles?.filter(p =>
  p.subscription_status === 'active' && p.stripe_customer_id
).length || 0;

// Calculate revenue (assuming $5/month for active subscribers)
const revenue = activeSubscribers * 5;

console.log('');
console.log('Total Users:', totalUsers);
console.log('Active Subscribers:', activeSubscribers);
console.log('Revenue (estimated):', `$${revenue}`);
console.log('');
console.log('All Users:');
allProfiles?.forEach((p, i) => {
  console.log(`  ${i+1}. ${p.email}`);
  console.log(`     Status: ${p.subscription_status || 'null'}`);
  console.log(`     Tier: ${p.subscription_tier || 'null'}`);
  console.log(`     Stripe Customer: ${p.stripe_customer_id || 'none'}`);
  console.log(`     Stripe Subscription: ${p.stripe_subscription_id || 'none'}`);
  console.log('');
});
