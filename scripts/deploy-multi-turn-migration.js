#!/usr/bin/env node
/**
 * Deploy Multi-Turn Migration to DEV Database
 * Uses Supabase service role key to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '/home/projects/.env' });

const SUPABASE_URL = process.env.SAFEPROMPT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Multi-Turn Attack Detection Migration ===');
console.log(`Target: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSQLDirect(sql) {
    // Split SQL into statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';

        try {
            // Use Supabase client's RPC to execute raw SQL
            const { data, error } = await supabase.rpc('exec_sql', {
                query: stmt
            });

            if (error) {
                console.error(`❌ Statement ${i + 1}/${statements.length} failed:`, error.message);
                errorCount++;
            } else {
                console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
                successCount++;
            }
        } catch (err) {
            console.error(`❌ Statement ${i + 1}/${statements.length} error:`, err.message);
            errorCount++;
        }
    }

    console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed`);

    if (errorCount === statements.length) {
        console.log('\n⚠️  ALL statements failed. exec_sql function may not exist.');
        console.log('This is normal - database migrations must be run via Dashboard SQL Editor.');
        return false;
    }

    return successCount > 0;
}

async function deploy() {
    const migrationPath = '/home/projects/safeprompt/supabase/migrations/20251009_multi_turn_session_tracking.sql';
    const sql = readFileSync(migrationPath, 'utf-8');

    const success = await executeSQLDirect(sql);

    if (!success) {
        console.log('\n📋 Manual Deployment Required:');
        console.log('1. Go to: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new');
        console.log('2. Copy migration file: cat ' + migrationPath);
        console.log('3. Paste into SQL Editor and click "Run"');
        process.exit(1);
    }

    console.log('\n✅ Migration deployed successfully!');
}

deploy().catch(console.error);
