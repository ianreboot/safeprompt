import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Testing Supabase connection...');
console.log('URL:', process.env.SAFEPROMPT_SUPABASE_URL);

// Test connection by querying waitlist table
async function testConnection() {
  try {
    // Try to query the waitlist table
    const { data, error, count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      console.error('❌ Supabase error:', error);
      return;
    }

    console.log('✅ Connected to Supabase successfully!');
    console.log('Waitlist table exists');

    // Try to insert a test record
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: testEmail,
        source: 'test-script',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Successfully inserted test record:', insertData);

      // Clean up test record
      const { error: deleteError } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.error('Could not clean up test record:', deleteError);
      } else {
        console.log('✅ Cleaned up test record');
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();