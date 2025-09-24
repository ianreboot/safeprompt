import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get current subscription status
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authHeader.replace('Bearer ', '')

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status, subscription_plan_id, subscription_period_end')
      .eq('id', userId)
      .single()

    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json({
        subscription: null,
        status: 'no_subscription'
      })
    }

    // Get subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        subscription: null,
        status: 'no_active_subscription'
      })
    }

    const subscription = subscriptions.data[0]
    const product = await stripe.products.retrieve(
      subscription.items.data[0].price.product as string
    )

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: product.name,
        price: subscription.items.data[0].price.unit_amount! / 100,
        currency: subscription.items.data[0].price.currency,
        period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

// POST - Create/update subscription
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authHeader.replace('Bearer ', '')
  const { priceId, action } = await req.json()

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const { data: user } = await supabase.auth.admin.getUserById(userId)

      const customer = await stripe.customers.create({
        email: user?.user?.email,
        metadata: { user_id: userId }
      })

      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    if (action === 'upgrade' || action === 'downgrade') {
      // Update existing subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]

        // Update subscription with new price
        const updated = await stripe.subscriptions.update(subscription.id, {
          items: [{
            id: subscription.items.data[0].id,
            price: priceId
          }]
        })

        return NextResponse.json({
          subscription: updated,
          message: `Plan ${action}d successfully`
        })
      }
    }

    // Create new subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    })

    return NextResponse.json({ checkout_url: session.url })
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 })
  }
}

// DELETE - Cancel subscription
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authHeader.replace('Bearer ', '')

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    // Cancel at period end
    const canceled = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true
    })

    return NextResponse.json({
      message: 'Subscription will be canceled at period end',
      cancel_at: canceled.cancel_at
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}