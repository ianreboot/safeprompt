/**
 * Add playground test IP to allowlist
 * Ensures 203.0.113.10 (TEST-NET-3) is allowlisted so playground users don't get banned
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from /home/projects/.env
config({ path: '/home/projects/.env' });

const PLAYGROUND_IP = '203.0.113.10';
const PLAYGROUND_IP_HASH = createHash('sha256').update(PLAYGROUND_IP).digest('hex');

// Connect to PROD database
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPlaygroundIPToAllowlist() {
  console.log('Checking playground IP allowlist...');
  console.log(`IP: ${PLAYGROUND_IP} (TEST-NET-3 RFC 5737)`);
  console.log(`Hash: ${PLAYGROUND_IP_HASH}`);

  // Check if already allowlisted
  const { data: existing, error: checkError } = await supabase
    .from('ip_allowlist')
    .select('*')
    .eq('ip_hash', PLAYGROUND_IP_HASH)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking allowlist:', checkError);
    process.exit(1);
  }

  if (existing) {
    console.log('✅ Playground IP already allowlisted');
    console.log('Entry:', JSON.stringify(existing, null, 2));
    return;
  }

  // Get ian.ho@rebootmedia.net (internal user) as the added_by user
  const { data: internalUser, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();

  if (userError || !internalUser) {
    console.error('Error finding internal user:', userError);
    process.exit(1);
  }

  // Add to allowlist
  console.log('Adding playground IP to allowlist...');
  const { data: inserted, error: insertError } = await supabase
    .from('ip_allowlist')
    .insert({
      ip_address: PLAYGROUND_IP,
      ip_hash: PLAYGROUND_IP_HASH,
      description: 'Playground demo IP (TEST-NET-3 RFC 5737) - used by all playground visitors',
      purpose: 'testing', // Using 'testing' purpose (playground is a testing environment)
      active: true,
      added_by: internalUser.id
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error adding to allowlist:', insertError);
    process.exit(1);
  }

  console.log('✅ Playground IP added to allowlist');
  console.log('Entry:', JSON.stringify(inserted, null, 2));
}

addPlaygroundIPToAllowlist().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
