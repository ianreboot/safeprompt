'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Clock, Check, ArrowRight, X } from 'lucide-react'

interface IntentRouterProps {
  intent: 'free' | 'waitlist' | 'earlybird' | null
  onClose: () => void
}

export default function IntentRouter({ intent, onClose }: IntentRouterProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'details' | 'success'>('email')
  const [message, setMessage] = useState('')

  if (!intent) return null

  const intentConfig = {
    free: {
      icon: Shield,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      title: 'Start with Free API Key',
      subtitle: 'Get instant access to 10,000 validations/month',
      features: [
        '10,000 requests per month',
        'Full API access',
        'Community support',
        'No credit card required'
      ],
      cta: 'Create Free Account',
      successMessage: 'Account created! Redirecting to your dashboard...'
    },
    waitlist: {
      icon: Clock,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      title: 'Join the Waitlist',
      subtitle: 'Be first to know when we launch publicly',
      features: [
        'Early access to new features',
        'Exclusive beta pricing',
        'Priority support',
        'Launch day bonuses'
      ],
      cta: 'Join Waitlist',
      successMessage: "You're on the list! Check your email for confirmation."
    },
    earlybird: {
      icon: Zap,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600 text-black',
      title: 'Early Bird Access - $5/mo',
      subtitle: 'Lock in this price forever (normally $29/mo)',
      features: [
        '100,000 requests per month',
        'Priority support',
        '99.9% uptime SLA',
        '🔥 Lifetime pricing guarantee'
      ],
      cta: 'Continue to Payment',
      successMessage: 'Redirecting to secure checkout...'
    }
  }

  const config = intentConfig[intent]
  const Icon = config.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (intent === 'waitlist') {
        // Waitlist only needs email
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            source: 'website',
            intent: 'waitlist'
          })
        })

        if (!response.ok) throw new Error('Failed to join waitlist')
        setStep('success')

      } else if (intent === 'free') {
        // Free tier needs account creation
        if (step === 'email') {
          setStep('details')
        } else {
          // Create account via Supabase
          const { data, error } = await (window as any).supabase.auth.signUp({
            email,
            password,
            options: {
              data: { intent: 'free_tier' }
            }
          })

          if (error) throw error
          setStep('success')
          setTimeout(() => {
            window.location.href = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.safeprompt.dev'
          }, 2000)
        }

      } else if (intent === 'earlybird') {
        // Early bird goes to payment
        if (step === 'email') {
          setStep('details')
        } else {
          // Store signup intent and redirect to payment
          sessionStorage.setItem('safeprompt_intent', JSON.stringify({
            intent: 'earlybird',
            email,
            timestamp: Date.now()
          }))

          // In production, this would create a Stripe checkout session
          setStep('success')
          setTimeout(() => {
            const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.safeprompt.dev'
            window.location.href = `${dashboardUrl}/checkout?plan=earlybird&email=${encodeURIComponent(email)}`
          }, 2000)
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`bg-gray-900 rounded-xl ${config.borderColor} border-2 max-w-md w-full relative overflow-hidden`}
        >
          {/* Header */}
          <div className={`${config.bgColor} p-6 relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-black/20`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{config.title}</h2>
                <p className="text-sm text-gray-300">{config.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.bgColor} mb-4`}>
                  <Check className={`w-8 h-8 ${config.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Success!</h3>
                <p className="text-gray-400">{config.successMessage}</p>
              </motion.div>
            ) : (
              <>
                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">What you get:</h3>
                  <ul className="space-y-2">
                    {config.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                      placeholder="developer@company.com"
                      required
                      disabled={step === 'details'}
                    />
                  </div>

                  {step === 'details' && intent !== 'waitlist' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <label className="block text-sm font-medium mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                        placeholder="Min 6 characters"
                        minLength={6}
                        required
                      />
                    </motion.div>
                  )}

                  {message && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${config.buttonColor} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        {step === 'email' ? 'Continue' : config.cta}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {step === 'details' && (
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back to email
                    </button>
                  )}
                </form>

                {/* Context Footer */}
                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-500">
                    {intent === 'waitlist' ?
                      'No spam, unsubscribe anytime' :
                      intent === 'earlybird' ?
                      'Secure payment via Stripe' :
                      'Full access, no credit card required'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}