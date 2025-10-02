/**
 * SafePrompt Database Cleanup Script
 *
 * ISSUES FOUND:
 * 1. Deprecated "users" table still exists with stale data
 * 2. Deprecated "api_keys" table exists (empty but should be removed)
 * 3. profiles table has subscription_status='active' but tier=null (should be 'inactive')
 * 4. 7 auth.users but only 2 profiles (missing 5 profiles)
 * 5. Test users in auth.users and waitlist
 *
 * FIXES:
 * 1. Drop deprecated tables
 * 2. Fix subscription_status in profiles (active -> inactive for free users)
 * 3. Delete test users from auth
 * 4. Clear test waitlist entries
 */

require('dotenv').config({ path: '/home/projects/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  console.log('🧹 SafePrompt Database Cleanup');
  console.log('=' .repeat(60));

  try {
    // 1. Fix profiles table: set subscription_status to 'inactive' for free tier users
    console.log('\n1️⃣  Fixing profiles table subscription_status...');
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'inactive' })
      .or('tier.is.null,tier.eq.free')
      .eq('subscription_status', 'active')
      .select();

    if (updateError) {
      console.error('   ❌ Error updating profiles:', updateError);
    } else {
      console.log(`   ✅ Updated ${updatedProfiles?.length || 0} profile(s) to subscription_status='inactive'`);
      updatedProfiles?.forEach(p => console.log(`      - ${p.email}`));
    }

    // 2. Delete test users from auth.users
    console.log('\n2️⃣  Deleting test users from auth...');
    const testEmailPatterns = [
      'test_1758709947030@example.com',
      'test_1758709807130@example.com',
      'demo@safeprompt.dev'
    ];

    for (const email of testEmailPatterns) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const testUser = authUsers?.users?.find(u => u.email === email);

      if (testUser) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id);
        if (deleteError) {
          console.error(`   ❌ Error deleting ${email}:`, deleteError);
        } else {
          console.log(`   ✅ Deleted auth user: ${email}`);
        }
      }
    }

    // 3. Delete test waitlist entries
    console.log('\n3️⃣  Cleaning test waitlist entries...');
    const { data: deletedWaitlist, error: waitlistError } = await supabase
      .from('waitlist')
      .delete()
      .like('email', '%test%')
      .select();

    if (waitlistError) {
      console.error('   ❌ Error deleting waitlist entries:', waitlistError);
    } else {
      console.log(`   ✅ Deleted ${deletedWaitlist?.length || 0} test waitlist entry/entries`);
    }

    // 4. Drop deprecated tables (via SQL)
    console.log('\n4️⃣  Dropping deprecated tables...');
    console.log('   ⚠️  Note: This requires direct SQL execution');
    console.log('   Run these commands in Supabase SQL Editor:');
    console.log('   ```sql');
    console.log('   DROP TABLE IF EXISTS users CASCADE;');
    console.log('   DROP TABLE IF EXISTS api_keys CASCADE;');
    console.log('   DROP TABLE IF EXISTS validation_logs CASCADE;');
    console.log('   ```');

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE');
    console.log('=' .repeat(60));

    // Run audit again to verify
    console.log('\n📊 Running post-cleanup audit...\n');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');

    console.log(`Profiles: ${profiles?.length || 0}`);
    profiles?.forEach(p => {
      console.log(`  - ${p.email}: tier=${p.tier || 'null'}, status=${p.subscription_status}, stripe=${p.stripe_customer_id || 'null'}`);
    });

    const { data: waitlist } = await supabase
      .from('waitlist')
      .select('email');
    console.log(`\nWaitlist: ${waitlist?.length || 0} entries`);

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    console.log(`Auth users: ${authUsers?.users?.length || 0}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanup();
