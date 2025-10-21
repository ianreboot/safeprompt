import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Supabase client for authentication
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    // SECURITY: Verify authenticated user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // SECURITY: Verify authenticated user matches requested userId (prevent IDOR)
    if (user.id !== userId) {
      console.warn(`SECURITY: IDOR attempt blocked - User ${user.id} attempted to export data for ${userId}`)
      return NextResponse.json({ error: 'Forbidden: You can only export your own data' }, { status: 403 })
    }

    // Fetch all threat intelligence samples for this user (GDPR Article 15 - Right to Access)
    const { data: samples, error: samplesError } = await supabaseAdmin
      .from('threat_intelligence_samples')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })

    if (samplesError) {
      console.error('Error fetching samples:', samplesError)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Fetch user profile for context
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, intelligence_sharing, auto_block_enabled, intelligence_opt_in_date')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Build export data structure (machine-readable format as required by GDPR)
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      profile: profile || null,
      threat_intelligence_samples: samples || [],
      data_usage_explanation: {
        purpose: 'Threat intelligence collection for network defense',
        retention_period: '24 hours for personal data (prompt text, IP address), 90 days for anonymized threat statistics',
        sharing: 'Data is used internally only for improving threat detection. Not sold to third parties.',
        your_rights: {
          access: 'You can export your data using this API',
          deletion: 'You can delete your personal data using the /api/gdpr/delete endpoint',
          opt_out: 'You can disable intelligence sharing in Privacy Settings (paid tiers only)'
        }
      },
      statistics: {
        total_samples: samples?.length || 0,
        anonymized_samples: samples?.filter(s => s.anonymized_at !== null).length || 0,
        samples_with_pii: samples?.filter(s => s.anonymized_at === null).length || 0
      }
    }

    return NextResponse.json(exportData, { status: 200 })
  } catch (error: any) {
    console.error('GDPR export error:', error)
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 })
  }
}
