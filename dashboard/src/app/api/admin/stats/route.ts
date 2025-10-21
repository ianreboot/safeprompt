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

export async function GET(request: Request) {
  try {
    // SECURITY: CSRF protection via custom header verification
    const csrfHeader = request.headers.get('x-requested-with')
    if (csrfHeader !== 'XMLHttpRequest') {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin' }, { status: 403 })
    }

    // SECURITY: Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 })
    }

    // SECURITY: Verify admin role
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // SECURITY: Calculate stats server-side to prevent manipulation

    // Fetch all profiles
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, subscription_status')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Fetch total API calls count
    const { count: totalCalls, error: callsError } = await supabaseAdmin
      .from('api_logs')
      .select('*', { count: 'exact', head: true })

    if (callsError) {
      console.error('Error fetching API logs count:', callsError)
    }

    // Calculate stats - only count PAID subscribers
    const totalUsers = profilesData?.length || 0

    // Active subscribers = users with paid tier AND active status
    // Only the 3 actual paid tiers (early_bird, starter, business)
    const paidTiers = ['early_bird', 'starter', 'business']
    const activeSubscribers = profilesData?.filter(p =>
      p.subscription_status === 'active' &&
      paidTiers.includes(p.subscription_tier)
    ) || []

    // Calculate revenue based on actual subscription tiers
    // IMPORTANT: This is the source of truth for financial reporting
    // Pricing: $5 (Early Bird), $29 (Starter), $99 (Business)
    const revenue = activeSubscribers.reduce((total, user) => {
      switch(user.subscription_tier) {
        case 'early_bird': return total + 5
        case 'starter': return total + 29
        case 'business': return total + 99
        default: return total
      }
    }, 0)

    const stats = {
      totalUsers,
      activeUsers: activeSubscribers.length,
      revenue,
      totalApiCalls: totalCalls || 0
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 })
  }
}
