import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Adding plaintext API key column and updating ian.ho profile...\n');

async function fixDashboard() {
  try {
    // Step 1: Add api_key column (if not exists, will fail gracefully)
    console.log('Step 1: Adding api_key column to profiles table...');
    
    const addColumnSql = `
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
    `;
    
    const addColResponse = await fetch(
      'https://api.supabase.com/v1/projects/vkyggknknyfallmnrmfu/database/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: addColumnSql })
      }
    );
    
    if (addColResponse.ok) {
      console.log('✅ Column added');
    } else {
      const err = await addColResponse.text();
      console.log('⚠️  Column add:', err);
    }
    
    // Step 2: Update ian.ho profile with plaintext key
    console.log('\nStep 2: Updating ian.ho profile with plaintext API key...');
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        api_key: 'sp_test_unlimited_dogfood_key_2025'
      })
      .eq('email', 'ian.ho@rebootmedia.net')
      .select();
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Profile updated');
      console.log('   API key set to: sp_test_unlimited_dogfood_key_2025');
    }
    
    // Step 3: Verify
    console.log('\nStep 3: Verifying...');
    const { data: check } = await supabase
      .from('profiles')
      .select('api_key, api_key_hint, subscription_tier')
      .eq('email', 'ian.ho@rebootmedia.net')
      .single();
    
    if (check?.api_key) {
      console.log('✅ VERIFIED:');
      console.log('   API Key:', check.api_key);
      console.log('   Tier:', check.subscription_tier);
      console.log('\n🎉 Dashboard should now show your API key!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixDashboard();
