/**
 * SafePrompt Pricing Configuration
 * Single source of truth for all pricing information across the site
 */

export interface PricingFeature {
  text: string
  included: boolean
  icon?: 'check' | 'x' | 'clock'
}

export interface PricingPlan {
  id: 'free' | 'paid'
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  interval: 'month' | 'year'
  features: PricingFeature[]
  requestsPerMonth: number
  support: string
  availability: string
  ctaText: string
  badgeText?: string
  savingsText?: string
}

export const PRICING: Record<'free' | 'paid', PricingPlan> = {
  paid: {
    id: 'paid',
    name: 'Early Access Beta',
    description: 'Full access with locked-in beta pricing',
    price: 5,
    originalPrice: 29,
    currency: 'USD',
    interval: 'month',
    requestsPerMonth: 10000,
    support: 'Priority support',
    availability: 'Instant access',
    ctaText: 'Get Started - $5/mo',
    badgeText: 'BETA PRICING - SAVE $24/MONTH',
    savingsText: 'You save $288/year with beta pricing locked forever',
    features: [
      {
        text: '10,000 requests/month',
        included: true,
        icon: 'check'
      },
      {
        text: 'Instant API access',
        included: true,
        icon: 'check'
      },
      {
        text: 'Priority support',
        included: true,
        icon: 'check'
      },
      {
        text: 'Lock in beta price forever',
        included: true,
        icon: 'check'
      },
      {
        text: 'Advanced threat detection',
        included: true,
        icon: 'check'
      },
      {
        text: 'Network Defense: Contributes attack data',
        included: true,
        icon: 'check'
      },
      {
        text: 'IP Auto-Blocking: Block known bad actors',
        included: true,
        icon: 'check'
      },
      {
        text: 'Intelligence Opt-out: Disable data collection',
        included: true,
        icon: 'check'
      },
      {
        text: 'GDPR Export/Delete: Full data control',
        included: true,
        icon: 'check'
      },
      {
        text: 'High availability infrastructure',
        included: true,
        icon: 'check'
      }
    ]
  },
  free: {
    id: 'free',
    name: 'Free Plan',
    description: 'Join the waitlist for free access',
    price: 0,
    currency: 'USD',
    interval: 'month',
    requestsPerMonth: 1000,
    support: 'Community support',
    availability: 'Access when capacity allows',
    ctaText: 'Join Waitlist - Free',
    badgeText: undefined,
    savingsText: 'Join the queue for free access. We\'re scaling infrastructure gradually.',
    features: [
      {
        text: '1,000 requests/month',
        included: true,
        icon: 'check'
      },
      {
        text: 'Access when capacity allows',
        included: true,
        icon: 'clock'
      },
      {
        text: 'Network Defense: Contributes attack data',
        included: true,
        icon: 'check'
      },
      {
        text: 'IP Auto-Blocking: Block known bad actors',
        included: false,
        icon: 'x'
      },
      {
        text: 'Intelligence Opt-out: Disable data collection',
        included: false,
        icon: 'x'
      },
      {
        text: 'GDPR Export/Delete: Full data control',
        included: true,
        icon: 'check'
      },
      {
        text: 'Community support only',
        included: false,
        icon: 'x'
      }
    ]
  }
}

/**
 * Pricing helpers for consistent display across site
 */
export const getPricingDisplay = (plan: 'free' | 'paid') => {
  const pricing = PRICING[plan]
  return {
    price: `$${pricing.price}`,
    interval: `/${pricing.interval}`,
    originalPrice: pricing.originalPrice ? `$${pricing.originalPrice}` : undefined,
    savings: pricing.originalPrice
      ? `$${pricing.originalPrice - pricing.price}`
      : undefined,
    requestsDisplay: `${(pricing.requestsPerMonth / 1000).toLocaleString()}K`,
    requestsLong: `${pricing.requestsPerMonth.toLocaleString()} requests/month`
  }
}

/**
 * Quick summary for hero sections
 */
export const PRICING_SUMMARY = {
  headline: 'Free tier available or $5/mo beta (regular $29/mo)',
  freeLimit: '1,000',
  paidLimit: '10,000',
  betaPrice: 5,
  regularPrice: 29,
  savings: 24
}

/**
 * Urgency messaging
 */
export const URGENCY = {
  betaSpotsTotal: 50,
  betaSpotsRemaining: 37, // Update as needed
  message: 'Beta pricing: First 50 users get $5/month forever (regular price will be $29)',
  savingsMessage: 'Join early adopters saving $24/month'
}
