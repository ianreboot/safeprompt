'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Mail, Lock, ArrowRight, Info, Zap, Clock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent') // free, earlybird, waitlist
  const plan = searchParams.get('plan')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(intent ? true : false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Retrieve stored intent from sessionStorage if available
    const storedIntent = sessionStorage.getItem('safeprompt_intent')
    if (storedIntent) {
      const data = JSON.parse(storedIntent)
      setEmail(data.email || '')
      setIsSignUp(true)
    }
  }, [])

  // Intent-specific configuration
  const getIntentConfig = () => {
    if (intent === 'earlybird' || plan === 'earlybird') {
      return {
        title: 'Complete Your Early Bird Registration',
        subtitle: 'Create your account to access payment and lock in $5/mo forever',
        icon: Zap,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        benefits: [
          '100,000 API requests per month',
          'Priority support',
          'Lifetime price lock at $5/mo'
        ]
      }
    } else if (intent === 'free') {
      return {
        title: 'Create Your Free Account',
        subtitle: 'Get instant access to your API key',
        icon: Shield,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        benefits: [
          '10,000 API requests per month',
          'Full API access',
          'No credit card required'
        ]
      }
    } else if (intent === 'waitlist') {
      return {
        title: 'Join the Waitlist',
        subtitle: 'Be first to know when we launch',
        icon: Clock,
        iconColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        benefits: [
          'Early access to new features',
          'Launch day bonuses',
          'Exclusive beta pricing'
        ]
      }
    }
    return null
  }

  const config = getIntentConfig()
  const Icon = config?.icon || Shield

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        // Sign up with metadata about intent
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              signup_intent: intent || 'direct',
              signup_plan: plan || 'free'
            }
          }
        })

        if (error) throw error

        // Handle different post-signup flows
        if (intent === 'earlybird' || plan === 'earlybird') {
          // Redirect to payment
          window.location.href = `/checkout?email=${encodeURIComponent(email)}`
        } else if (intent === 'waitlist') {
          // Add to waitlist and show confirmation
          await fetch('https://api.safeprompt.dev/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'dashboard' })
          })
          setMessage('Added to waitlist! Check your email for confirmation.')
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        window.location.href = '/'
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Panel - Context Aware */}
      {config && (
        <div className={`hidden lg:flex lg:w-1/2 ${config.bgColor} p-12 flex-col justify-center`}>
          <div className="max-w-md">
            <Icon className={`w-12 h-12 ${config.iconColor} mb-6`} />
            <h2 className="text-3xl font-bold mb-4">{config.title}</h2>
            <p className="text-lg text-gray-300 mb-8">{config.subtitle}</p>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                What you get:
              </h3>
              {config.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.iconColor}`} />
                  <span className="text-gray-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right Panel - Auth Form */}
      <div className={`flex-1 flex items-center justify-center px-4 ${config ? 'lg:w-1/2' : ''}`}>
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">SafePrompt</h1>

            {/* Context-aware subtitle */}
            <p className="text-gray-400 mt-2">
              {config ? (
                isSignUp ? config.subtitle : 'Sign in to continue'
              ) : (
                isSignUp ? 'Create your account' : 'Sign in to your dashboard'
              )}
            </p>
          </div>

          {/* Intent Banner */}
          {intent && !isSignUp && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-6 flex items-start gap-2">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">
                  {intent === 'earlybird' ? 'Early Bird Access' :
                   intent === 'free' ? 'Free API Key' :
                   'Waitlist Registration'}
                </p>
                <p className="text-gray-300 mt-1">
                  Please sign in or create an account to continue with your {intent} registration.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('Check your email') || message.includes('waitlist')
                  ? 'bg-green-900/50 text-green-400 border border-green-800'
                  : 'bg-red-900/50 text-red-400 border border-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {isSignUp ? (
                    intent === 'earlybird' ? 'Continue to Payment' :
                    intent === 'waitlist' ? 'Join Waitlist' :
                    'Create Free Account'
                  ) : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between sign in and sign up */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setMessage('')
                }}
                className="text-primary hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Context-aware footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            {intent === 'earlybird' ? (
              <p>🔒 Secure payment via Stripe after account creation</p>
            ) : intent === 'waitlist' ? (
              <p>📧 We'll notify you as soon as we launch</p>
            ) : (
              <p>🚀 Get started in less than 2 minutes</p>
            )}
          </div>

          {/* Links */}
          <div className="mt-8 flex justify-center gap-4 text-sm text-gray-400">
            <a href={process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev"} className="hover:text-white transition-colors">
              Home
            </a>
            <span>•</span>
            <a href="/docs" className="hover:text-white transition-colors">
              Documentation
            </a>
            <span>•</span>
            <a href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/contact"} className="hover:text-white transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImprovedLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}