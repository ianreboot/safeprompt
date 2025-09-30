import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Setting up SafePrompt database...\n');
console.log('URL:', supabaseUrl);
console.log('Key loaded:', supabaseKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sql = fs.readFileSync('/tmp/setup_safeprompt_db.sql', 'utf8');

// Split into individual statements and execute
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`\nExecuting ${statements.length} SQL statements...\n`);

async function runSetup() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    
    // Skip comments
    if (stmt.trim().startsWith('--')) continue;
    
    console.log(`[${i+1}/${statements.length}] Executing...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });
      
      if (error) {
        // Try direct query instead
        const lines = stmt.split('\n');
        const preview = lines[0].substring(0, 60) + (lines[0].length > 60 ? '...' : '');
        console.log(`   ${preview}`);
        
        // For CREATE/ALTER/INSERT, we can't use the JS client easily
        // We'll need to use psql or Supabase dashboard
        console.log(`   ⚠️  Requires Supabase Dashboard execution`);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (e) {
      console.log(`   ⚠️  ${e.message}`);
    }
  }
  
  console.log('\n⚠️  IMPORTANT: Due to Supabase client limitations, some DDL statements');
  console.log('must be run manually in the Supabase SQL Editor.');
  console.log('\n📋 Copy the SQL from: /tmp/setup_safeprompt_db.sql');
  console.log('🌐 Run at: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new\n');
}

runSetup().catch(console.error);
