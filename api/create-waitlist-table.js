import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Creating waitlist table...');
console.log('URL:', process.env.SAFEPROMPT_SUPABASE_URL);

// Simple waitlist table without dependencies
const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function createTable() {
  try {
    // First, let's check if table exists by trying to query it
    const { data: checkData, error: checkError } = await supabase
      .from('waitlist')
      .select('count')
      .limit(1);

    if (!checkError) {
      console.log('✅ Waitlist table already exists');

      // Try to get count
      const { count, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`Table has ${count} entries`);
      }
      return;
    }

    if (checkError.code === 'PGRST205') {
      console.log('Table does not exist, need to create it manually in Supabase dashboard');
      console.log('\nSQL to run in Supabase SQL Editor:');
      console.log('=====================================');
      console.log(createTableSQL);
      console.log('=====================================');
      console.log('\nSteps:');
      console.log('1. Go to https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Click "New Query"');
      console.log('5. Paste the SQL above');
      console.log('6. Click "Run"');
    } else {
      console.error('Unexpected error:', checkError);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

createTable();