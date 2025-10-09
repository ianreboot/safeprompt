#!/usr/bin/env node
/**
 * Deploy enhanced pattern detection function
 * Uses Supabase REST API to execute SQL
 */
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const SUPABASE_URL = process.env.SAFEPROMPT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

async function deployFunction() {
  try {
    console.log('Reading migration file...');
    const sql = readFileSync(
      '/home/projects/safeprompt/supabase/migrations/20251009123000_enhanced_pattern_detection.sql',
      'utf8'
    );

    console.log('Deploying to DEV database via REST API...');

    // Use Supabase POST RPC endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✅ Function deployed successfully!');
    console.log('Enhanced pattern detection is now active.');

  } catch (error) {
    // If REST API doesn't work, try direct SQL execution
    console.log('REST API method not available, trying alternative...');

    // Import dynamic to handle ES modules
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Read and execute SQL
    const sql = readFileSync(
      '/home/projects/safeprompt/supabase/migrations/20251009123000_enhanced_pattern_detection.sql',
      'utf8'
    );

    // Execute via raw SQL (this won't work with standard client, but worth trying)
    console.log('Attempting raw SQL execution...');
    console.log('\n⚠️  Manual deployment required:');
    console.log('1. Go to https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/20251009123000_enhanced_pattern_detection.sql');
    console.log('3. Execute it in the SQL Editor');
    console.log('\nOr use psql directly with proper password handling.');

    process.exit(1);
  }
}

deployFunction();
