#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '/home/projects/.env' })

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
)

async function createDemoUser() {
  try {
    console.log('Creating demo user...')

    // Create the demo user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@safeprompt.dev',
      password: 'demo123',
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        is_demo: true
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Demo user already exists in auth')

        // Get the existing user
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const demoUser = users.find(u => u.email === 'demo@safeprompt.dev')

        if (demoUser) {
          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            demoUser.id,
            { password: 'demo123' }
          )

          if (updateError) {
            console.error('Error updating demo user password:', updateError)
          } else {
            console.log('Demo user password updated')
          }

          await ensureUserRecord(demoUser.id)
        }
      } else {
        throw authError
      }
    } else {
      console.log('Demo user created in auth:', authData.user.id)
      await ensureUserRecord(authData.user.id)
    }

    console.log('Demo user setup complete!')
    console.log('Email: demo@safeprompt.dev')
    console.log('Password: demo123')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

async function ensureUserRecord(userId) {
  // Check if user record exists in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!existingUser) {
    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'demo@safeprompt.dev',
        tier: 'free',
        subscription_status: 'active',
        api_calls_limit: 10000,
        api_calls_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userError) {
      console.error('Error creating user record:', userError)
    } else {
      console.log('User record created in database')
    }
  } else {
    console.log('User record already exists in database')
  }

  // Create demo API key
  const { data: existingKey } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existingKey) {
    const demoApiKey = 'sp_demo_' + Math.random().toString(36).substring(2, 15)

    const { error: keyError } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        key: demoApiKey,
        name: 'Demo API Key',
        is_active: true,
        last_used: null,
        created_at: new Date().toISOString()
      })

    if (keyError) {
      console.error('Error creating API key:', keyError)
    } else {
      console.log('Demo API key created:', demoApiKey)
    }
  } else {
    console.log('API key already exists for demo user')
  }
}

// Run the script
createDemoUser()