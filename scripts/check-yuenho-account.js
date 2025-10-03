#!/usr/bin/env node
/**
 * Check yuenho Account Status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking yuenho.8@gmail.com account...\n');

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', 'yuenho.8@gmail.com')
  .single();

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

if (!profile) {
  console.log('❌ Profile not found');
  process.exit(1);
}

console.log('Profile Data:');
console.log(JSON.stringify(profile, null, 2));
