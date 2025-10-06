#!/usr/bin/env node
// Deploy Phase 1A schema to DEV database using Supabase client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '/home/projects/.env' });

const SUPABASE_URL = process.env.SAFEPROMPT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

console.log('=== SafePrompt Phase 1A DEV Database Deployment ===');
console.log(`Target: ${SUPABASE_URL}\n`);

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSQLFile(filePath, description) {
    console.log(`Executing: ${description}`);
    const sql = readFileSync(filePath, 'utf-8');

    // Note: Supabase client doesn't have direct SQL execution
    // We need to use the REST API sql endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const error = await response.text();
        console.log(`Warning: Direct SQL execution not available via REST API`);
        console.log(`You may need to apply migrations via Supabase dashboard SQL editor`);
        return false;
    }

    console.log(`✅ ${description} completed\n`);
    return true;
}

async function deploy() {
    console.log('Phase 1A migrations:');
    console.log('1. /home/projects/safeprompt/database/setup.sql (base schema)');
    console.log('2. /home/projects/safeprompt/supabase/migrations/20251006_session_storage.sql');
    console.log('3. /home/projects/safeprompt/supabase/migrations/20251006_threat_intelligence.sql\n');

    console.log('⚠️  Note: Supabase REST API does not support direct SQL execution.');
    console.log('Recommended approach:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run each SQL file manually');
    console.log('3. Or use psql with correct connection string\n');

    // Show correct psql command
    console.log('Alternative: Use psql with pooler (port 6543):');
    console.log(`PGPASSWORD='${process.env.SAFEPROMPT_SUPABASE_DB_PASSWORD}' psql \\`);
    console.log(`  -h aws-0-us-east-1.pooler.supabase.com \\`);
    console.log(`  -p 6543 \\`);
    console.log(`  -U postgres.vkyggknknyfallmnrmfu \\`);
    console.log(`  -d postgres \\`);
    console.log(`  -f /home/projects/safeprompt/database/setup.sql`);
}

deploy().catch(console.error);
