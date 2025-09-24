#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '/home/projects/.env' })

// Initialize Supabase with service role for admin operations
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
)

async function setupUsers() {
  console.log('Setting up demo and admin users with correct architecture...\n')

  try {
    // 1. Create/update demo user in Auth
    console.log('1. Creating demo user in auth...')
    const { data: demoAuth, error: demoAuthError } = await supabase.auth.admin.createUser({
      email: 'demo@safeprompt.dev',
      password: 'demo123',
      email_confirm: true
    })

    let demoUserId
    if (demoAuthError) {
      console.log('   Auth error:', demoAuthError.message)
      if (demoAuthError.message?.includes('already registered')) {
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingDemo = users.find(u => u.email === 'demo@safeprompt.dev')
        demoUserId = existingDemo?.id
        console.log('   Demo user already exists in auth:', demoUserId)

        if (demoUserId) {
          // Update password
          await supabase.auth.admin.updateUserById(demoUserId, { password: 'demo123' })
        }
      }
    } else if (demoAuth?.user) {
      demoUserId = demoAuth.user.id
      console.log('   Created demo user in auth:', demoUserId)
    }

    // 2. Ensure demo profile exists
    if (demoUserId) {
      console.log('2. Creating/updating demo profile...')
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: demoUserId,
          email: 'demo@safeprompt.dev',
          api_key: 'sp_demo_k3y_f0r_pr3v13w_0nly',
          api_calls_this_month: 2543,
          stripe_customer_id: null, // Demo has no Stripe customer
          is_active: true
        }, { onConflict: 'id' })
        .select()

      if (error) {
        console.error('   Error with demo profile:', error.message)
      } else {
        console.log('   Demo profile ready:', data[0]?.email)
      }
    } else {
      console.log('2. Demo user ID not found - skipping profile creation')
    }

    // 3. Create/update admin user (ian@rebootmedia.net)
    console.log('\n3. Creating admin user in auth...')
    const adminEmail = 'ian@rebootmedia.net'
    const adminPassword = 'SecureAdminPassword123!' // Change this!

    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    let adminUserId
    if (adminAuthError?.message?.includes('already registered')) {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingAdmin = users.find(u => u.email === adminEmail)
      adminUserId = existingAdmin?.id
      console.log('   Admin user already exists in auth:', adminUserId)
    } else if (adminAuth?.user) {
      adminUserId = adminAuth.user.id
      console.log('   Created admin user in auth:', adminUserId)
    }

    // 4. Ensure admin profile exists
    if (adminUserId) {
      console.log('4. Creating/updating admin profile...')
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: adminUserId,
          email: adminEmail,
          api_key: `sp_live_${Math.random().toString(36).substring(2, 34)}`,
          api_calls_this_month: 0,
          stripe_customer_id: null, // Will be set when admin subscribes
          is_active: true
        }, { onConflict: 'id' })
        .select()

      if (error) {
        console.error('   Error with admin profile:', error.message)
      } else {
        console.log('   Admin profile ready:', data[0]?.email)
      }
    }

    // 5. Test that the trigger works for new signups
    console.log('\n5. Testing auto-profile creation trigger...')
    const testEmail = `test_${Date.now()}@example.com`
    const { data: testAuth } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123',
      email_confirm: true
    })

    if (testAuth) {
      // Check if profile was auto-created
      const { data: testProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testAuth.user.id)
        .single()

      if (testProfile) {
        console.log('   ✅ Trigger works! Profile auto-created for new user')
        // Clean up test user
        await supabase.auth.admin.deleteUser(testAuth.user.id)
      } else {
        console.log('   ⚠️  Trigger NOT working - run database/setup.sql in Supabase')
      }
    }

    console.log('\n✅ Setup complete!')
    console.log('\nUsers ready:')
    console.log('1. Demo: demo@safeprompt.dev / demo123')
    console.log(`2. Admin: ${adminEmail} / ${adminPassword}`)
    console.log('\n⚠️  IMPORTANT: Change the admin password immediately!')
    console.log('\n📝 Next steps:')
    console.log('1. Run database/setup.sql in Supabase SQL editor if trigger not working')
    console.log('2. Update Stripe webhook to use profiles table instead of users')
    console.log('3. Test payment flows with Stripe test mode')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Run the setup
setupUsers()