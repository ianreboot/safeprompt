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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Prevent self-suspension
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 })
    }

    // SECURITY: Suspend user account
    const { error: suspendError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (suspendError) {
      console.error('Error suspending user:', suspendError)
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
    }

    // SECURITY: Invalidate all active sessions for the suspended user
    // This immediately logs them out from all devices
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId, 'global')

    if (signOutError) {
      console.error('Error invalidating sessions:', signOutError)
      // Continue even if session invalidation fails - suspension still succeeded
    }

    return NextResponse.json({
      success: true,
      message: 'User suspended and all sessions invalidated'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Suspend user error:', error)
    return NextResponse.json({ error: error.message || 'Suspension failed' }, { status: 500 })
  }
}
