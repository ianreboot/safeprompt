#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'ba5f9b2a-34a7-446c-9181-c23c69c3a8f8';

// Generate API key
const apiKey = `sp_live_${crypto.randomBytes(32).toString('hex')}`;

// Update profile
const { data, error } = await supabase
  .from('profiles')
  .update({
    api_key: apiKey,
    api_key_hint: apiKey.slice(-4)
  })
  .eq('id', userId)
  .select()
  .single();

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ API Key generated and stored');
console.log('   Key hint (last 4 chars):', data.api_key_hint);
console.log('');
console.log('User can view their API key in the dashboard after logging in.');
