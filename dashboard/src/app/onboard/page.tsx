'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, Loader, CreditCard, Clock } from 'lucide-react'

function OnboardContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  const email = searchParams.get('email') || ''

  const [step, setStep] = useState<'creating' | 'payment' | 'waitlist' | 'complete'>('creating')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [stripeSession, setStripeSession] = useState<string | null>(null)

  useEffect(() => {
    // Retrieve stored intent from sessionStorage
    const storedIntent = sessionStorage.getItem('signup_intent')
    if (storedIntent) {
      const data = JSON.parse(storedIntent)
      handleSignup(data.email || email, data.plan || plan)
    } else if (email) {
      handleSignup(email, plan)
    } else {
      // No email provided, redirect back to signup
      window.location.href = 'https://safeprompt.dev/signup'
    }
  }, [])

  async function handleSignup(userEmail: string, userPlan: string) {
    try {
      // Step 1: Create Supabase auth user
      const password = sessionStorage.getItem('temp_password') || generateSecurePassword()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
        options: {
          data: {
            plan: userPlan,
            signup_source: 'unified_signup',
            beta_user: true
          }
        }
      })

      if (authError) throw authError

      const user = authData.user
      if (!user) throw new Error('User creation failed')

      setUserId(user.id)

      // Step 2: Handle based on plan
      if (userPlan === 'paid') {
        // Create Stripe checkout session
        setStep('payment')
        await createStripeSession(user.id, userEmail)
      } else {
        // Add to waitlist
        setStep('waitlist')
        await addToWaitlist(userEmail, user.id)
      }

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Something went wrong during signup')
    }
  }

  async function createStripeSession(userId: string, email: string) {
    try {
      // Call consolidated admin API for Stripe checkout
      const response = await fetch('https://api.safeprompt.dev/api/admin?action=create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          priceId: process.env.NEXT_PUBLIC_STRIPE_BETA_PRICE_ID || 'price_beta_5',
          successUrl: 'https://dashboard.safeprompt.dev?welcome=true',
          cancelUrl: 'https://safeprompt.dev/signup'
        })
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (err: any) {
      console.error('Stripe error:', err)
      setError('Payment setup failed. Please try again.')
    }
  }

  async function addToWaitlist(email: string, userId: string) {
    try {
      // Add to waitlist via consolidated website API
      const response = await fetch('https://api.safeprompt.dev/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'waitlist',
          data: {
            email,
            userId,
            source: 'unified_signup',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) throw new Error('Failed to join waitlist')

      // Profile already created by auth trigger, waitlist tracked separately
      setStep('complete')
    } catch (err: any) {
      console.error('Waitlist error:', err)
      setError('Failed to join waitlist. Please contact support.')
    }
  }

  function generateSecurePassword() {
    // Generate a secure random password for the user
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Render different states
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = 'https://safeprompt.dev/signup'}
              className="bg-gray-800 px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'creating') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Creating your account...</h2>
          <p className="text-sm text-gray-400">This will only take a moment</p>
        </div>
      </div>
    )
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Redirecting to secure payment...</h2>
          <p className="text-sm text-gray-400">You'll be taken to Stripe to complete your subscription</p>
          <div className="mt-6">
            <Loader className="w-6 h-6 text-primary animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'waitlist') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Adding you to the waitlist...</h2>
          <p className="text-sm text-gray-400">We'll notify you as soon as your spot opens</p>
          <div className="mt-6">
            <Loader className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
          <p className="text-gray-400 mb-6">
            We've added you to the waitlist and will email you at <strong>{email}</strong> as soon as your spot opens up.
          </p>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <ul className="text-left space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-500">1.</span>
                <span>You'll receive a confirmation email within 5 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">2.</span>
                <span>We'll notify you when your spot opens (typically 2-3 weeks)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">3.</span>
                <span>You'll get 24 hours to claim your free account</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = 'https://safeprompt.dev'}
              className="w-full bg-gray-800 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Homepage
            </button>

            <button
              onClick={() => window.location.href = 'https://safeprompt.dev/signup?plan=paid'}
              className="w-full text-sm text-primary hover:underline"
            >
              Don't want to wait? Get instant access for $5/month →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function Onboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <OnboardContent />
    </Suspense>
  )
}