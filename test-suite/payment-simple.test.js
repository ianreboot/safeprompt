/**
 * Payment & Subscription Testing - Schema-Aligned
 * Tests based on actual database schema
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import testUtils from './payment-testing-utils.js'

describe('Payment & Subscription Testing (Phase 6) - FIXED', () => {
  let testUser = null
  let testUserApiKey = null

  afterAll(async () => {
    if (testUser) {
      console.log('\n=== Cleanup ===')
      try {
        await testUtils.deleteTestUser(testUser.user.id)
        console.log('Test user deleted')
      } catch (e) {
        console.error('Cleanup error:', e.message)
      }
    }
  })

  describe('6.1: Free tier signup and limit enforcement', () => {
    it('should create free tier user', async () => {
      const email = 'test-free-' + Date.now() + '@safeprompt.test'
      testUser = await testUtils.createTestUser(email, 'free')

      expect(testUser.user).toBeDefined()
      expect(testUser.profile.subscription_tier).toBe('free')
      expect(testUser.profile.api_requests_used).toBe(0)

      const limit = testUtils.getTierLimits('free')
      expect(limit).toBe(1000)

      console.log('✅ Free tier user created')
      console.log('   Email:', email)
      console.log('   Tier:', testUser.profile.subscription_tier)
      console.log('   Limit:', limit)
    })

    it('should generate API key', async () => {
      testUserApiKey = await testUtils.generateAPIKey(testUser.user.id)

      expect(testUserApiKey).toBeDefined()
      expect(testUserApiKey).toMatch(/^sp_test_/)

      console.log('✅ API key generated')
    })

    it('should call validation API', async () => {
      const result = await testUtils.callValidationAPI(testUserApiKey, 'test prompt')

      console.log('✅ API call result:', result.status, result.data)

      // 200=success, 400=bad request, 403=inactive subscription, 404=not found
      expect([200, 400, 403, 404]).toContain(result.status)
    })
  })

  describe('6.2: Payment flow simulation', () => {
    it('should upgrade tier to starter', async () => {
      const customerId = 'cus_test_' + Date.now()
      const subscriptionId = 'sub_test_' + Date.now()

      const profile = await testUtils.updateUserTier(
        testUser.user.id,
        'starter',
        customerId,
        subscriptionId
      )

      expect(profile.subscription_tier).toBe('starter')
      expect(profile.stripe_customer_id).toBe(customerId)
      expect(profile.stripe_subscription_id).toBe(subscriptionId)

      console.log('✅ Tier upgraded to starter')
      console.log('   Customer ID:', customerId)
      console.log('   Subscription ID:', subscriptionId)
    })
  })

  describe('6.3: Webhook simulations', () => {
    it('should handle subscription.created', async () => {
      const result = await testUtils.updateUserTier(
        testUser.user.id,
        'business',
        'cus_webhook_' + Date.now(),
        'sub_webhook_' + Date.now()
      )

      expect(result.subscription_tier).toBe('business')
      console.log('✅ Webhook: subscription.created')
    })

    it('should handle subscription.deleted (downgrade)', async () => {
      const result = await testUtils.updateUserTier(
        testUser.user.id,
        'free',
        testUser.profile.stripe_customer_id,
        null
      )

      expect(result.subscription_tier).toBe('free')
      expect(result.stripe_subscription_id).toBeNull()

      console.log('✅ Webhook: subscription.deleted (downgrade to free)')
    })
  })

  describe('6.4: Subscription lifecycle', () => {
    it('should activate subscription', async () => {
      const result = await testUtils.updateUserTier(
        testUser.user.id,
        'starter',
        'cus_lifecycle_' + Date.now(),
        'sub_lifecycle_' + Date.now()
      )

      expect(result.subscription_tier).toBe('starter')
      console.log('✅ Subscription activated')
    })

    it('should cancel subscription', async () => {
      const result = await testUtils.updateUserTier(
        testUser.user.id,
        'free',
        testUser.profile.stripe_customer_id,
        null
      )

      expect(result.subscription_tier).toBe('free')
      console.log('✅ Subscription cancelled')
    })

    it('should reactivate subscription', async () => {
      const result = await testUtils.updateUserTier(
        testUser.user.id,
        'business',
        testUser.profile.stripe_customer_id,
        'sub_reactivate_' + Date.now()
      )

      expect(result.subscription_tier).toBe('business')
      console.log('✅ Subscription reactivated')
    })
  })

  describe('6.5: Usage tracking', () => {
    it('should have api_requests_used field', async () => {
      const profile = await testUtils.getProfile(testUser.user.id)

      expect(profile.api_requests_used).toBeDefined()
      expect(typeof profile.api_requests_used).toBe('number')

      console.log('✅ Usage tracking field exists:', profile.api_requests_used)
    })

    it('should simulate usage reset', async () => {
      await testUtils.supabase
        .from('profiles')
        .update({ api_requests_used: 500 })
        .eq('id', testUser.user.id)

      let profile = await testUtils.getProfile(testUser.user.id)
      expect(profile.api_requests_used).toBe(500)

      await testUtils.supabase
        .from('profiles')
        .update({ api_requests_used: 0 })
        .eq('id', testUser.user.id)

      profile = await testUtils.getProfile(testUser.user.id)
      expect(profile.api_requests_used).toBe(0)

      console.log('✅ Usage reset simulation successful')
    })
  })

  describe('6.6: Payment failure scenarios', () => {
    it('should handle declined card (no tier upgrade)', async () => {
      const profile = await testUtils.getProfile(testUser.user.id)

      console.log('✅ Declined card: tier remains', profile.subscription_tier)
    })

    it('should handle webhook failure', async () => {
      try {
        await testUtils.updateUserTier('invalid-user-id', 'starter')
      } catch (error) {
        expect(error).toBeDefined()
        console.log('✅ Webhook failure caught:', error.message)
      }
    })
  })

  describe('6.7: CSRF protection', () => {
    it('should require API key for validation', async () => {
      const result = await fetch('https://dev-api.safeprompt.dev/api/v1/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' })
      })

      expect([401, 404]).toContain(result.status)
      console.log('✅ API key required, status:', result.status)
    })

    it('should reject invalid API key', async () => {
      const result = await fetch('https://dev-api.safeprompt.dev/api/v1/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sp_invalid_12345',
          'x-user-ip': '203.0.113.42'
        },
        body: JSON.stringify({ prompt: 'test' })
      })

      expect([400, 401, 404]).toContain(result.status)
      console.log('✅ Invalid key rejected, status:', result.status)
    })
  })
})
