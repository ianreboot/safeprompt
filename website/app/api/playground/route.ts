import { NextResponse } from 'next/server'

// SECURITY: API key stored server-side only, never exposed to client
const PLAYGROUND_API_KEY = process.env.SAFEPROMPT_PLAYGROUND_API_KEY || 'sp_test_unlimited_dogfood_key_2025'
const SAFEPROMPT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, mode, session_token } = body

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
      )
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: 'Prompt too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // SECURITY: Make request with server-side API key
    const response = await fetch(`${SAFEPROMPT_API_URL}/api/v1/validate`, {
      method: 'POST',
      headers: {
        'X-API-Key': PLAYGROUND_API_KEY,
        'X-User-IP': '203.0.113.10', // Playground demo IP (TEST-NET-3 RFC 5737)
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        mode: mode || 'optimized',
        session_token
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Validation failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Playground API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
