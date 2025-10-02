/**
 * SafePrompt Database Audit Script
 * Purpose: Understand where users are stored and identify cleanup needed
 */

require('dotenv').config({ path: '/home/projects/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function auditDatabase() {
  console.log('🔍 SafePrompt Database Audit');
  console.log('=' .repeat(60));

  try {
    // 1. Check auth.users (via admin API)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    console.log('\n📊 auth.users (Supabase Authentication)');
    console.log(`Count: ${authUsers?.users?.length || 0}`);
    if (authUsers?.users) {
      authUsers.users.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u.id.substring(0, 8)}..., created: ${u.created_at})`);
      });
    }

    // 2. Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('\n📊 profiles (Current Active Table)');
    console.log(`Count: ${profiles?.length || 0}`);
    if (profiles) {
      profiles.forEach(p => {
        console.log(`  - ${p.email}`);
        console.log(`    Tier: ${p.subscription_tier || 'null'}, Status: ${p.subscription_status || 'null'}`);
        console.log(`    Stripe: ${p.stripe_customer_id || 'null'}, API Calls: ${p.api_requests_used || 0}`);
        console.log(`    Active: ${p.is_active}, Created: ${p.created_at}`);
      });
    }

    // 3. Check if deprecated 'users' table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (!usersError) {
      console.log('\n📊 users (DEPRECATED - Should be removed)');
      console.log(`Count: Found ${users?.length || 0} records`);
      if (users && users.length > 0) {
        console.log('⚠️  WARNING: Deprecated "users" table still has data!');
        users.forEach(u => console.log(`  - ${JSON.stringify(u)}`));
      }
    } else {
      console.log('\n✅ users table does not exist (good - it was deprecated)');
    }

    // 4. Check waitlist
    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('\n📊 waitlist');
    console.log(`Count: ${waitlist?.length || 0}`);
    if (waitlist) {
      waitlist.forEach(w => {
        console.log(`  - ${w.email} (converted: ${w.converted_to_profile_id ? 'yes' : 'no'}, approved: ${w.approved_at || 'no'})`);
      });
    }

    // 5. Check if deprecated 'api_keys' table exists
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(10);

    if (!apiKeysError) {
      console.log('\n📊 api_keys (DEPRECATED - Should be removed)');
      console.log(`Count: Found ${apiKeys?.length || 0} records`);
      if (apiKeys && apiKeys.length > 0) {
        console.log('⚠️  WARNING: Deprecated "api_keys" table still has data!');
      }
    } else {
      console.log('\n✅ api_keys table does not exist (good - it was deprecated)');
    }

    // 6. Check api_logs
    const { count: logsCount } = await supabase
      .from('api_logs')
      .select('*', { count: 'exact', head: true });

    console.log('\n📊 api_logs');
    console.log(`Count: ${logsCount || 0}`);

    // 7. Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(60));

    const authCount = authUsers?.users?.length || 0;
    const profilesCount = profiles?.length || 0;

    console.log(`\nAuth Users: ${authCount}`);
    console.log(`Profile Records: ${profilesCount}`);

    if (authCount !== profilesCount) {
      console.log('\n⚠️  MISMATCH: auth.users and profiles tables are out of sync!');
      console.log('   Every auth.users record should have a corresponding profiles record.');
    }

    // Check for the specific issue: subscription_status = 'active' but subscription_tier = 'free'
    const confusedUsers = profiles?.filter(p =>
      p.subscription_status === 'active' && p.subscription_tier === 'free'
    ) || [];

    if (confusedUsers.length > 0) {
      console.log(`\n🐛 ISSUE FOUND: ${confusedUsers.length} user(s) with subscription_status='active' but subscription_tier='free'`);
      confusedUsers.forEach(u => {
        console.log(`   - ${u.email}: This is causing the admin panel to show $29 revenue incorrectly`);
      });
      console.log('\n   FIX: subscription_status should be "inactive" if subscription_tier is "free"');
    }

  } catch (error) {
    console.error('Error during audit:', error);
  }
}

auditDatabase();
