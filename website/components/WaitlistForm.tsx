'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [choice, setChoice] = useState<'waitlist' | 'earlybird' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !choice) return

    setIsSubmitting(true)

    if (choice === 'earlybird') {
      // For now, add to waitlist with early bird flag since Stripe is in test mode
      // TODO: Once Stripe is live, redirect to real checkout session
      try {
        const response = await fetch('https://api.safeprompt.dev/api/website', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'waitlist',
            data: {
              email,
              source: 'website',
              earlyBirdInterest: true // Flag for tracking early bird interest
            }
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to join waitlist')
        }

        setSubmitted(true)
      } catch (error) {
        console.error('Early bird signup error:', error)
        alert('Early bird signup temporarily unavailable. You\'ve been added to the waitlist and we\'ll notify you when payment is ready.')
        setSubmitted(true)
      }
    } else {
      // Add to waitlist via API
      try {
        const response = await fetch('https://api.safeprompt.dev/api/website', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'waitlist',
            data: { email, source: 'website' }
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to join waitlist')
        }

        setSubmitted(true)
      } catch (error) {
        console.error('Waitlist error:', error)
        alert(error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.')
      }
    }

    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl border border-safe/50 p-8 max-w-md mx-auto text-center"
      >
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
        <p className="text-muted-foreground">
          We'll email you at <span className="text-foreground font-medium">{email}</span> when SafePrompt is ready for beta access.
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Note: Payment processing is currently being set up. Early bird pricing will be available soon.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <input
            type="email"
            placeholder="developer@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        {/* Choice Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setChoice('waitlist')}
            className={`p-4 rounded-lg border-2 transition text-left ${
              choice === 'waitlist'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <div className="font-semibold mb-1">Join Waitlist</div>
            <div className="text-sm text-muted-foreground">Free • Get notified when ready</div>
          </button>

          <button
            type="button"
            onClick={() => setChoice('earlybird')}
            className={`p-4 rounded-lg border-2 transition text-left relative ${
              choice === 'earlybird'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              POPULAR
            </div>
            <div className="font-semibold mb-1">Early Bird Access</div>
            <div className="text-sm text-muted-foreground">$5/mo • Instant access • Lock in forever</div>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!choice || isSubmitting}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            choice === 'earlybird'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-card border border-border text-foreground hover:bg-secondary'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <span className="loading-dots">Processing</span>
          ) : choice === 'earlybird' ? (
            'Continue to Payment →'
          ) : choice === 'waitlist' ? (
            'Join Waitlist'
          ) : (
            'Select an option'
          )}
        </button>
      </form>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 1.333a8.667 8.667 0 100 17.334 8.667 8.667 0 000-17.334zm3.707 6.293a1 1 0 00-1.414-1.414L9 9.585 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
          <span>No spam</span>
        </span>
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9a5 5 0 1110 0v3.586l1.293-1.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L13 12.586V9A3 3 0 007 9v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L9 12.586V9z" />
          </svg>
          <span>Cancel anytime</span>
        </span>
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2v5a11.952 11.952 0 01-3.384 8.21A26.952 26.952 0 0110 18.181a26.952 26.952 0 01-4.616 2.029A11.952 11.952 0 012 12V7c0-.68.057-1.35.166-2zm8.118 3.475a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 11H13a1 1 0 100-2H8.414l1.87-1.87z" />
          </svg>
          <span>Secure payment</span>
        </span>
      </div>
    </div>
  )
}