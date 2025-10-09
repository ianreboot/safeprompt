#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const supabase = createClient(
  'https://adyfhzbcsqzgqvyimycv.supabase.co',
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Checking PROD database for users...\n');

const { data, error } = await supabase
  .from('profiles')
  .select('api_key, subscription_tier, email')
  .or('subscription_tier.eq.internal,email.eq.ian.ho@rebootmedia.net');

if (error) {
  console.log('Error:', error.message);
} else {
  console.log('Found', data.length, 'internal/test profiles:');
  data.forEach(p => {
    console.log(`- ${p.email}: ${p.api_key} (${p.subscription_tier})`);
  });
}
