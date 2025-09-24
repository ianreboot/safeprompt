import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { Resend } from 'resend'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Initialize Supabase with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionChange(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionCanceled(subscription)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentSuccess(invoice)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentFailure(invoice)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email!
  const customerId = session.customer as string

  // Check if user exists
  const { data: { users } } = await supabase.auth.admin.listUsers()
  let user = users.find(u => u.email === customerEmail)

  if (!user) {
    // Create new user
    const { data: authData } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
      password: Math.random().toString(36).substring(2, 15) // Temp password
    })
    user = authData?.user
  }

  if (user) {
    // Update profile with Stripe customer ID
    await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // Send welcome email
    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: customerEmail,
      subject: 'Welcome to SafePrompt - Access Your Dashboard',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to SafePrompt!</h2>
          <p>Thank you for signing up. Your account has been created successfully.</p>

          <h3>Next Steps:</h3>
          <ol>
            <li>Visit your dashboard at <a href="https://dashboard.safeprompt.dev">dashboard.safeprompt.dev</a></li>
            <li>Log in with your email: ${customerEmail}</li>
            <li>Access your API key from the dashboard</li>
            <li>Start protecting your AI applications!</li>
          </ol>

          <p style="background: #f4f4f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Important:</strong> For security reasons, your API key is only visible in the dashboard. Never share your API key or commit it to version control.
          </p>

          <p>If you have any questions, reply to this email or visit our documentation.</p>

          <p>Best regards,<br>The SafePrompt Team</p>
        </div>
      `
    })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    // Update subscription status
    const status = subscription.status
    const planId = subscription.items.data[0]?.price.id

    // Store subscription metadata (could be in a separate table)
    await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        subscription_plan_id: planId,
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    // Mark subscription as canceled but keep access until period end
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_cancel_at: new Date(subscription.canceled_at! * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
  }
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  // Reset monthly API calls counter on successful payment
  const customerId = invoice.customer as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        api_calls_this_month: 0,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    // Mark account for review/suspension
    await supabase
      .from('profiles')
      .update({
        payment_status: 'failed',
        payment_failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    // Send payment failure email
    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: profile.email,
      subject: 'Payment Failed - Action Required',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Failed</h2>
          <p>We were unable to process your payment for SafePrompt.</p>

          <p style="background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Action Required:</strong> Please update your payment method within 7 days to avoid service interruption.
          </p>

          <p>To update your payment method:</p>
          <ol>
            <li>Log in to your <a href="https://dashboard.safeprompt.dev">dashboard</a></li>
            <li>Go to the Billing section</li>
            <li>Update your payment information</li>
          </ol>

          <p>If you believe this is an error or need assistance, please contact us immediately.</p>

          <p>Best regards,<br>The SafePrompt Team</p>
        </div>
      `
    })
  }
}