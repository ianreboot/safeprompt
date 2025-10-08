/**
 * Payment & Subscription Testing Utilities
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../dashboard/.env.development') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const testUtils = {
  async createTestUser(email, tier = 'free') {
    const password = 'TestPassword123!'

    const { data: authData, error: authError} = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) throw authError

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        subscription_tier: tier,
        api_requests_used: 0,
        is_active: true
      })
      .select()
      .single()

    if (profileError) throw profileError

    return { user: authData.user, profile, password }
  },

  async updateUserTier(userId, tier, stripeCustomerId = null, stripeSubscriptionId = null) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async deleteTestUser(userId) {
    await supabase.from('profiles').delete().eq('id', userId)
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error
  },

  getTierLimits(tier) {
    const limits = {
      free: 1000,
      early_bird: 5000,
      starter: 10000,
      business: 100000,
      internal: 999999
    }
    return limits[tier] || limits.free
  },

  async incrementUsage(userId, count = 1) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_requests_used')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('profiles')
      .update({ api_requests_used: (profile?.api_requests_used || 0) + count })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  supabase,

  async generateAPIKey(userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', userId)
      .single()

    if (profile?.api_key) return profile.api_key

    const randomBytes = crypto.randomBytes(16).toString('hex')
    const apiKey = 'sp_test_' + randomBytes

    const { data, error } = await supabase
      .from('profiles')
      .update({ api_key: apiKey })
      .eq('id', userId)
      .select('api_key')
      .single()

    if (error) throw error
    return data.api_key
  },

  async callValidationAPI(apiKey, prompt) {
    const response = await fetch('https://dev-api.safeprompt.dev/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ prompt })
    })

    return {
      status: response.status,
      data: await response.json()
    }
  }
}

export default testUtils
