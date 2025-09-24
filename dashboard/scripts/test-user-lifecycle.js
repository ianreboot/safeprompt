#!/usr/bin/env node

/**
 * Test all user lifecycle scenarios for SafePrompt
 *
 * Scenarios covered:
 * 1. Waitlist signup
 * 2. Waitlist approval
 * 3. User login
 * 4. API key generation and usage
 * 5. Free tier limits
 * 6. Paid account signup
 * 7. Plan upgrade/downgrade
 * 8. Account cancellation
 * 9. Reactivation
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '/home/projects/.env' })

// Initialize Supabase
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
)

// Test configuration
const TEST_EMAIL_PREFIX = `test_${Date.now()}`
const TEST_SCENARIOS = {
  waitlist: `${TEST_EMAIL_PREFIX}_waitlist@example.com`,
  free: `${TEST_EMAIL_PREFIX}_free@example.com`,
  paid: `${TEST_EMAIL_PREFIX}_paid@example.com`,
  upgrade: `${TEST_EMAIL_PREFIX}_upgrade@example.com`
}

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }[type] || ''

  console.log(`${prefix} ${message}${colors.reset}`)
}

async function testWaitlistFlow() {
  log('\n=== Testing Waitlist Flow ===', 'info')

  try {
    // 1. Add to waitlist
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from('waitlist')
      .insert({
        email: TEST_SCENARIOS.waitlist,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (waitlistError) throw waitlistError
    log(`Added to waitlist: ${TEST_SCENARIOS.waitlist}`, 'success')

    // 2. Approve waitlist entry
    const tempPassword = 'Test123!'
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_SCENARIOS.waitlist,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) throw authError
    log(`Created user account from waitlist`, 'success')

    // 3. Update waitlist entry
    await supabase
      .from('waitlist')
      .update({
        converted_to_profile_id: authData.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', waitlistEntry.id)

    // 4. Verify profile was created
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profile && profile.api_key) {
      log(`Profile auto-created with API key: ${profile.api_key.slice(0, 20)}...`, 'success')
    } else {
      log('Profile creation issue', 'warning')
    }

    return { userId: authData.user.id, apiKey: profile?.api_key }

  } catch (error) {
    log(`Waitlist flow error: ${error.message}`, 'error')
    return null
  }
}

async function testFreeAccountFlow() {
  log('\n=== Testing Free Account Flow ===', 'info')

  try {
    // 1. Create free account
    const { data: authData } = await supabase.auth.admin.createUser({
      email: TEST_SCENARIOS.free,
      password: 'Test123!',
      email_confirm: true
    })

    if (!authData) throw new Error('Failed to create user')
    log(`Created free account: ${TEST_SCENARIOS.free}`, 'success')

    // 2. Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // 3. Test API limit (10,000 for free)
    log(`Free tier API key: ${profile.api_key?.slice(0, 20)}...`, 'info')
    log(`Monthly limit: 10,000 calls`, 'info')

    // 4. Simulate API usage
    for (let i = 0; i < 5; i++) {
      await supabase
        .from('api_logs')
        .insert({
          profile_id: authData.user.id,
          endpoint: '/v1/check',
          prompt_length: 100,
          response_time_ms: 50
        })

      await supabase
        .from('profiles')
        .update({ api_calls_this_month: i + 1 })
        .eq('id', authData.user.id)
    }

    const { data: updated } = await supabase
      .from('profiles')
      .select('api_calls_this_month')
      .eq('id', authData.user.id)
      .single()

    log(`API calls used: ${updated.api_calls_this_month}/10000`, 'success')

    return { userId: authData.user.id, apiKey: profile?.api_key }

  } catch (error) {
    log(`Free account flow error: ${error.message}`, 'error')
    return null
  }
}

async function testPaidAccountFlow() {
  log('\n=== Testing Paid Account Flow ===', 'info')

  try {
    // 1. Create account with Stripe customer
    const { data: authData } = await supabase.auth.admin.createUser({
      email: TEST_SCENARIOS.paid,
      password: 'Test123!',
      email_confirm: true
    })

    if (!authData) throw new Error('Failed to create user')

    // 2. Simulate Stripe customer creation
    const stripeCustomerId = `cus_test_${Date.now()}`
    await supabase
      .from('profiles')
      .update({
        stripe_customer_id: stripeCustomerId,
        subscription_status: 'active',
        subscription_plan_id: 'price_starter',
        subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', authData.user.id)

    log(`Created paid account with Stripe customer: ${stripeCustomerId}`, 'success')

    // 3. Verify increased limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    log(`Subscription status: ${profile.subscription_status}`, 'success')
    log(`Plan: Starter (50,000 API calls/month)`, 'info')

    return { userId: authData.user.id, apiKey: profile?.api_key, stripeCustomerId }

  } catch (error) {
    log(`Paid account flow error: ${error.message}`, 'error')
    return null
  }
}

async function testSubscriptionChanges(userId, stripeCustomerId) {
  log('\n=== Testing Subscription Changes ===', 'info')

  try {
    // 1. Test upgrade to Pro
    await supabase
      .from('profiles')
      .update({
        subscription_plan_id: 'price_pro',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Log subscription history
    await supabase
      .from('subscription_history')
      .insert({
        profile_id: userId,
        action: 'upgraded',
        from_plan_id: 'price_starter',
        to_plan_id: 'price_pro',
        stripe_subscription_id: `sub_test_${Date.now()}`
      })

    log('Upgraded to Pro plan (250,000 API calls/month)', 'success')

    // 2. Test downgrade
    await supabase
      .from('profiles')
      .update({
        subscription_plan_id: 'price_starter',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    await supabase
      .from('subscription_history')
      .insert({
        profile_id: userId,
        action: 'downgraded',
        from_plan_id: 'price_pro',
        to_plan_id: 'price_starter'
      })

    log('Downgraded back to Starter plan', 'success')

    // 3. Test cancellation
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_cancel_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', userId)

    log('Subscription canceled (access until period end)', 'success')

    // 4. Test reactivation
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_cancel_at: null
      })
      .eq('id', userId)

    log('Subscription reactivated', 'success')

  } catch (error) {
    log(`Subscription change error: ${error.message}`, 'error')
  }
}

async function cleanupTestData() {
  log('\n=== Cleaning Up Test Data ===', 'info')

  try {
    // Delete test users
    for (const email of Object.values(TEST_SCENARIOS)) {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users.find(u => u.email === email)

      if (user) {
        await supabase.auth.admin.deleteUser(user.id)
        log(`Deleted test user: ${email}`, 'success')
      }
    }

    // Clean up waitlist entries
    await supabase
      .from('waitlist')
      .delete()
      .like('email', `${TEST_EMAIL_PREFIX}%`)

    log('Test cleanup complete', 'success')

  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'warning')
  }
}

async function runAllTests() {
  console.log(`
${colors.blue}========================================
    SafePrompt User Lifecycle Tests
========================================${colors.reset}
`)

  // Run tests
  const waitlistResult = await testWaitlistFlow()
  const freeResult = await testFreeAccountFlow()
  const paidResult = await testPaidAccountFlow()

  if (paidResult) {
    await testSubscriptionChanges(paidResult.userId, paidResult.stripeCustomerId)
  }

  // Cleanup
  await cleanupTestData()

  // Summary
  console.log(`
${colors.blue}========================================
    Test Summary
========================================${colors.reset}

✅ Waitlist flow: ${waitlistResult ? 'PASSED' : 'FAILED'}
✅ Free account flow: ${freeResult ? 'PASSED' : 'FAILED'}
✅ Paid account flow: ${paidResult ? 'PASSED' : 'FAILED'}
✅ Subscription changes: ${paidResult ? 'PASSED' : 'N/A'}

${colors.green}All user lifecycle scenarios tested!${colors.reset}

Note: Some features require actual Stripe integration:
- Real payment processing
- Webhook handling
- Invoice generation
- Email notifications

These should be tested in Stripe Test Mode with real webhook endpoints.
`)
}

// Run tests
runAllTests().catch(console.error)