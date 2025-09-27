'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Check, X, AlertCircle, Clock, Users, ArrowRight, Lock, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UnifiedSignup() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'paid' | 'free'>('paid') // Default to paid!
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [betaSpotsLeft] = useState(37) // Actual: 50 total - 13 current users

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Store intent in sessionStorage for dashboard
      sessionStorage.setItem('signup_intent', JSON.stringify({
        plan: selectedPlan,
        email,
        timestamp: Date.now()
      }))

      // Redirect to dashboard for actual signup (needs API access)
      const params = new URLSearchParams({
        plan: selectedPlan,
        email,
        intent: 'signup'
      })

      window.location.href = `https://dashboard.safeprompt.dev/onboard?${params.toString()}`
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">SafePrompt</span>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to home
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Urgency Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm">
              <strong>Beta pricing: First 50 users get $5/month forever</strong> (regular price will be $29)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-600">
            <Users className="w-4 h-4" />
            <span>Join early adopters saving $24/month</span>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Plan Selection */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-2">Secure Your AI in 60 Seconds</h1>
            <p className="text-gray-400 mb-8">
              Choose your plan and get instant API access. No complex setup required.
            </p>

            {/* Plan Cards */}
            <div className="space-y-4 mb-8">
              {/* Paid Plan - Visually Prominent */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlan('paid')}
                className={`relative cursor-pointer rounded-xl p-6 transition-all ${
                  selectedPlan === 'paid'
                    ? 'bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20'
                    : 'bg-gray-900 border border-gray-800 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Best Value Badge */}
                <div className="absolute -top-3 left-6 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                  BETA PRICING - SAVE $24/MONTH
                </div>

                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'paid' ? 'border-primary bg-primary' : 'border-gray-600'
                  }`}>
                    {selectedPlan === 'paid' && <Check className="w-3 h-3 text-black" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-6 h-6 text-yellow-500" />
                      <h3 className="text-xl font-semibold">Early Access Beta</h3>
                      <div className="ml-auto">
                        <span className="text-3xl font-bold text-primary">$5</span>
                        <span className="text-sm text-gray-500">/month</span>
                        <span className="ml-2 text-sm line-through text-gray-600">$29</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>100,000 requests/month</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Instant API access</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Priority support</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Lock in beta price forever</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Advanced threat detection</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>99.9% uptime SLA</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-900/30">
                      <p className="text-xs text-green-400">
                        💰 <strong>You save $288/year</strong> with beta pricing locked forever.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Free Plan - Subdued */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedPlan('free')}
                className={`relative cursor-pointer rounded-xl p-6 transition-all ${
                  selectedPlan === 'free'
                    ? 'bg-gray-800 border-2 border-gray-600'
                    : 'bg-gray-900/50 border border-gray-800 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'free' ? 'border-gray-500 bg-gray-500' : 'border-gray-700'
                  }`}>
                    {selectedPlan === 'free' && <Check className="w-3 h-3 text-black" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-6 h-6 text-gray-500" />
                      <h3 className="text-xl font-semibold text-gray-300">Free Plan (Waitlist)</h3>
                      <div className="ml-auto">
                        <span className="text-2xl font-bold text-gray-400">$0</span>
                        <span className="text-sm text-gray-600">/month</span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>10,000 requests/month</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>Access when we launch</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <X className="w-4 h-4 text-gray-600" />
                        <span>Community support only</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-900/10 rounded-lg border border-blue-900/20">
                      <p className="text-xs text-blue-400">
                        💡 <strong>Be first to know when we launch.</strong> Get early access benefits.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SSL encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>SOC2 compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Secure payments via Stripe</span>
              </div>
            </div>
          </div>

          {/* Right: Account Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedPlan === 'paid' ? 'Create Your Account' : 'Join the Waitlist'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                      placeholder="developer@company.com"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      We'll send your API key here
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                      placeholder="Min 8 characters"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Dynamic CTA based on selection */}
                  <AnimatePresence mode="wait">
                    {selectedPlan === 'paid' ? (
                      <motion.div
                        key="paid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-primary text-black font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? 'Processing...' : (
                            <>
                              Continue to Payment
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        <p className="text-xs text-center text-gray-500">
                          Next: Secure payment via Stripe
                        </p>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">
                            Cancel anytime. No questions asked.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="free"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? 'Processing...' : (
                            <>
                              Join Waitlist
                              <Clock className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        <p className="text-xs text-center text-gray-500">
                          We'll email you when you're invited
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedPlan('paid')}
                          className="w-full text-xs text-primary hover:underline"
                        >
                          Skip the wait - get instant access for $5/month
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-600 mb-2">Trusted by developers at</p>
                <div className="flex justify-center gap-4 opacity-50">
                  <span className="text-xs">Vercel</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">Supabase</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">Railway</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 pt-16 border-t border-gray-800">
          <h2 className="text-2xl font-bold mb-8">Quick Answers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Why is there a waitlist for free?</h3>
              <p className="text-sm text-gray-400">
                We're in beta and managing server capacity carefully. Paid beta users help us scale infrastructure for everyone.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-sm text-gray-400">
                Yes! Upgrade anytime, downgrade at the end of any billing cycle. No contracts or penalties.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after 50 beta users?</h3>
              <p className="text-sm text-gray-400">
                First 50 beta users keep $5/month forever. After that, pricing increases to $29/month for new signups.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do I need a credit card for free?</h3>
              <p className="text-sm text-gray-400">
                No credit card needed for the waitlist. We'll email you when we're ready to onboard more users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}