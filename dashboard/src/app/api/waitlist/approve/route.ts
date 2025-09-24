import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Initialize Supabase with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)

// POST - Approve waitlist entry and create user account
export async function POST(req: NextRequest) {
  // Check admin authorization
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin user
  const userId = authHeader.replace('Bearer ', '')
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  // Only allow specific admin emails
  const adminEmails = ['ian@rebootmedia.net', 'admin@safeprompt.dev']
  if (!profile || !adminEmails.includes(profile.email)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { email, sendWelcomeEmail = true } = await req.json()

  try {
    // Check if waitlist entry exists
    const { data: waitlistEntry } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email)
      .is('converted_to_profile_id', null)
      .single()

    if (!waitlistEntry) {
      return NextResponse.json({
        error: 'Waitlist entry not found or already approved'
      }, { status: 404 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15)

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const newUserId = authData.user!.id

    // Profile will be auto-created by trigger, but update it with initial values
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        api_calls_this_month: 0,
        is_active: true
      })
      .eq('id', newUserId)

    // Update waitlist entry
    await supabase
      .from('waitlist')
      .update({
        converted_to_profile_id: newUserId,
        approved_at: new Date().toISOString()
      })
      .eq('id', waitlistEntry.id)

    // Send welcome email if requested
    if (sendWelcomeEmail) {
      await resend.emails.send({
        from: 'SafePrompt <noreply@safeprompt.dev>',
        to: email,
        subject: 'Welcome to SafePrompt - Your Account is Ready!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to SafePrompt!</h2>
            <p>Your waitlist request has been approved! Your account is now ready to use.</p>

            <div style="background: #f4f4f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your temporary password:</strong></p>
              <code style="background: white; padding: 10px; display: block; border-radius: 3px; font-size: 16px;">${tempPassword}</code>
            </div>

            <p><strong>Please log in and change your password immediately:</strong></p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://dashboard.safeprompt.dev/login"
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Log in to SafePrompt Dashboard
              </a>
            </p>

            <p>After logging in, you'll be able to:</p>
            <ul>
              <li>Access your API key</li>
              <li>View usage statistics</li>
              <li>Manage your subscription</li>
              <li>Access documentation and support</li>
            </ul>

            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The SafePrompt Team</p>
          </div>
        `
      })
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: 'Waitlist entry approved and user account created',
      temp_password: sendWelcomeEmail ? null : tempPassword // Only return password if not emailing
    })

  } catch (error) {
    console.error('Error approving waitlist:', error)
    return NextResponse.json({ error: 'Failed to approve waitlist entry' }, { status: 500 })
  }
}

// GET - List waitlist entries pending approval
export async function GET(req: NextRequest) {
  // Check admin authorization
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin user
  const userId = authHeader.replace('Bearer ', '')
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  const adminEmails = ['ian@rebootmedia.net', 'admin@safeprompt.dev']
  if (!profile || !adminEmails.includes(profile.email)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get pending waitlist entries
    const { data: waitlist, error } = await supabase
      .from('waitlist')
      .select('*')
      .is('converted_to_profile_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      pending: waitlist?.filter(w => !w.approved_at) || [],
      approved_not_converted: waitlist?.filter(w => w.approved_at && !w.converted_to_profile_id) || [],
      total: waitlist?.length || 0
    })

  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
  }
}