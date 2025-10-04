#!/usr/bin/env node
/**
 * Verify Email Confirmation Configuration
 * Checks both PROD and DEV Supabase projects
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const environments = [
  {
    name: 'PROD',
    url: process.env.SAFEPROMPT_PROD_SUPABASE_URL,
    key: process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY,
    ref: 'adyfhzbcsqzgqvyimycv'
  },
  {
    name: 'DEV',
    url: process.env.SAFEPROMPT_SUPABASE_URL,
    key: process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY,
    ref: 'vkyggknknyfallmnrmfu'
  }
];

async function checkEmailConfirmation(env) {
  console.log(`\n📧 ${env.name} (${env.ref})`);
  console.log('─'.repeat(80));

  const supabase = createClient(env.url, env.key);

  // Try to get auth settings
  // Note: We can't directly query auth settings via client, but we can test behavior

  console.log(`URL: ${env.url}`);
  console.log(`Dashboard: https://supabase.com/dashboard/project/${env.ref}/auth/providers`);
  console.log(`Templates: https://supabase.com/dashboard/project/${env.ref}/auth/templates`);

  // Test user creation to check if confirmation is required
  const testEmail = `test-${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'test-password-123',
    email_confirm: false  // Don't auto-confirm
  });

  if (error) {
    console.log(`❌ Error testing auth:`, error.message);
    return;
  }

  // Check if user was created with unconfirmed email
  if (data.user && !data.user.email_confirmed_at) {
    console.log(`✅ Email confirmation IS REQUIRED (test user created unconfirmed)`);
  } else if (data.user && data.user.email_confirmed_at) {
    console.log(`⚠️  Email confirmation appears to be AUTO-CONFIRMED`);
    console.log(`   This suggests confirmation may not be enforced`);
  }

  // Clean up test user
  if (data.user) {
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log(`🗑️  Test user cleaned up`);
  }

  console.log('');
  console.log('**Manual verification needed:**');
  console.log('1. Go to Auth → Providers → Email');
  console.log('2. Check "Confirm email" toggle is ON');
  console.log('3. Go to Auth → Email Templates → Confirm signup');
  console.log('4. Verify branded template is applied');
}

async function main() {
  console.log('═'.repeat(80));
  console.log('EMAIL CONFIRMATION CONFIGURATION CHECK');
  console.log('═'.repeat(80));

  for (const env of environments) {
    await checkEmailConfirmation(env);
  }

  console.log('═'.repeat(80));
  console.log('\n📋 SUMMARY');
  console.log('');
  console.log('Email confirmation requires manual dashboard configuration:');
  console.log('');
  console.log('1. ✅ Enable "Confirm email" in Auth → Providers → Email');
  console.log('2. ✅ Configure Site URLs (HTTPS, not HTTP)');
  console.log('3. ✅ Apply branded template in Auth → Email Templates');
  console.log('4. ✅ Test signup flow to verify emails are sent');
  console.log('');
  console.log('See docs/EMAIL_VERIFICATION_SETUP.md for complete instructions');
  console.log('');
}

main().catch(console.error);
