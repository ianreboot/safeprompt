import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Retrieve user's API key
export async function GET(req: NextRequest) {
  // Get user ID from authorization header
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authHeader.replace('Bearer ', '')

  try {
    // Fetch user's profile with API key
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('api_key, subscription_status, api_calls_this_month, subscription_limit')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Return masked API key for display
    const maskedKey = profile.api_key
      ? `${profile.api_key.substring(0, 7)}...${profile.api_key.substring(profile.api_key.length - 4)}`
      : null

    return NextResponse.json({
      api_key: profile.api_key,
      masked_key: maskedKey,
      subscription_status: profile.subscription_status,
      usage: {
        current: profile.api_calls_this_month || 0,
        limit: profile.subscription_limit || 10000
      }
    })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Generate new API key
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authHeader.replace('Bearer ', '')

  try {
    // Generate new API key
    const newApiKey = `sp_live_${generateRandomKey()}`

    // Update profile with new API key
    const { data, error } = await supabase
      .from('profiles')
      .update({
        api_key: newApiKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
    }

    return NextResponse.json({
      api_key: newApiKey,
      message: 'API key regenerated successfully'
    })
  } catch (error) {
    console.error('Error generating API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate random API key
function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}