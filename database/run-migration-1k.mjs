#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// DEV database (SAFEPROMPT_SUPABASE_*)
const devClient = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

// PROD database (SAFEPROMPT_PROD_SUPABASE_*)
const prodClient = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Migrating free tier from 10K to 1K requests/month\n');

  // PROD migration
  console.log('📦 PROD Database (adyfhzbcsqzgqvyimycv):');
  const { data: prodData, error: prodError } = await prodClient
    .from('profiles')
    .update({
      api_requests_limit: 1000,
      updated_at: new Date().toISOString()
    })
    .eq('subscription_tier', 'free')
    .eq('api_requests_limit', 10000)
    .select('id, email');

  if (prodError) {
    console.error('❌ PROD Error:', prodError.message);
  } else {
    console.log(`✅ PROD: Updated ${prodData.length} users`);
    if (prodData.length > 0) {
      console.log('   Updated users:', prodData.map(u => u.email).join(', '));
    }
  }

  // Verify PROD
  const { data: prodVerify } = await prodClient
    .from('profiles')
    .select('subscription_tier, api_requests_limit')
    .eq('subscription_tier', 'free');
  console.log(`   Total free tier users: ${prodVerify.length}`);
  console.log(`   Limits: ${[...new Set(prodVerify.map(u => u.api_requests_limit))].join(', ')}\n`);

  // DEV migration
  console.log('🔧 DEV Database (vkyggknknyfallmnrmfu):');
  const { data: devData, error: devError } = await devClient
    .from('profiles')
    .update({
      api_requests_limit: 1000,
      updated_at: new Date().toISOString()
    })
    .eq('subscription_tier', 'free')
    .eq('api_requests_limit', 10000)
    .select('id, email');

  if (devError) {
    console.error('❌ DEV Error:', devError.message);
  } else {
    console.log(`✅ DEV: Updated ${devData.length} users`);
    if (devData.length > 0) {
      console.log('   Updated users:', devData.map(u => u.email).join(', '));
    }
  }

  // Verify DEV
  const { data: devVerify } = await devClient
    .from('profiles')
    .select('subscription_tier, api_requests_limit')
    .eq('subscription_tier', 'free');
  console.log(`   Total free tier users: ${devVerify.length}`);
  console.log(`   Limits: ${[...new Set(devVerify.map(u => u.api_requests_limit))].join(', ')}\n`);

  console.log('✅ Migration complete!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
