import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Initialize Supabase with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // TODO: Send welcome email with password reset link
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

    // TODO: Send payment failure email
  }
}