#!/usr/bin/env node
/**
 * Get a test API key for load testing
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTestApiKey() {
  // Get internal user's API key (has high limits for testing)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('api_key, email, subscription_tier, api_requests_limit')
    .eq('subscription_tier', 'internal')
    .single();

  if (error || !profile) {
    console.error('No internal user found. Creating test user...');
    console.error(error);
    return null;
  }

  console.log('Test API Key Found:');
  console.log('Email:', profile.email);
  console.log('Tier:', profile.subscription_tier);
  console.log('Limit:', profile.api_requests_limit);
  console.log('API Key:', profile.api_key);
  console.log('');
  console.log('Use this key in load tests:');
  console.log(profile.api_key);

  return profile.api_key;
}

getTestApiKey();
