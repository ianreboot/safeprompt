'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Key, Eye, EyeOff, Copy, RefreshCw, LogOut, BarChart, CreditCard,
  FileText, HelpCircle, TrendingUp, Clock, Check, ExternalLink,
  AlertCircle, ChevronRight, Shield, Zap, Users
} from 'lucide-react'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ApiKey {
  key: string
  key_hint: string
  created_at: string
  is_active: boolean
  last_used_at: string | null
  total_requests: number
}

interface Usage {
  current: number
  limit: number
  percentage: number
  tier: string
  daily_usage: number[]
  avg_response_time: number
  error_rate: number
}

interface PricingPlan {
  id: string
  name: string
  price: number
  requests: number
  features: string[]
  popular?: boolean
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    requests: 10000,
    features: ['10,000 requests/month', 'Community support', 'Basic analytics']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    requests: 100000,
    features: ['100,000 requests/month', 'Email support', 'Advanced analytics', '99.9% uptime SLA'],
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    requests: 1000000,
    features: ['1,000,000 requests/month', 'Priority support', 'Custom integration help', '99.95% uptime SLA']
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 499,
    requests: 10000000,
    features: ['10,000,000 requests/month', 'Dedicated support', 'Custom models', '99.99% uptime SLA']
  }
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState<ApiKey | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [usage, setUsage] = useState<Usage>({
    current: 0,
    limit: 10000,
    percentage: 0,
    tier: 'free',
    daily_usage: [],
    avg_response_time: 0,
    error_rate: 0
  })
  const [currentPlan, setCurrentPlan] = useState<PricingPlan>(pricingPlans[0])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const isDemo = user?.email === 'demo@safeprompt.dev'
  const maskedKey = showKey && apiKey?.key
    ? apiKey.key
    : (apiKey?.key ? `${apiKey.key.substring(0, 7)}${'•'.repeat(24)}${apiKey.key_hint}` : 'sp_demo_k3y_f0r_pr3v13w_0nly')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await fetchApiKey(user.id)
        await fetchUsage(user.id)
        await fetchLastUsed(user.id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchApiKey(userId: string) {
    try {
      const response = await fetch('/api/user/api-key', {
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.api_key) {
          setApiKey({
            key: data.api_key,
            key_hint: data.api_key.slice(-4),
            created_at: new Date().toISOString(),
            is_active: true,
            last_used_at: null,
            total_requests: 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
    }
  }

  async function fetchUsage(userId: string) {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('api_calls_this_month, subscription_status, stripe_customer_id')
        .eq('id', userId)
        .single()

      const { count } = await supabase
        .from('api_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .gte('created_at', startOfMonth.toISOString())

      // Generate mock daily usage for demo
      const dailyUsage = Array.from({ length: 7 }, (_, i) =>
        Math.floor(Math.random() * 500) + 100
      )

      const tier = profileData?.subscription_status || 'free'
      const planIndex = pricingPlans.findIndex(p => p.id === tier)
      setCurrentPlan(pricingPlans[planIndex >= 0 ? planIndex : 0])

      const limit = pricingPlans[planIndex >= 0 ? planIndex : 0].requests
      const current = profileData?.api_calls_this_month || count || (isDemo ? 2534 : 0)
      const percentage = Math.round((current / limit) * 100)

      setUsage({
        current,
        limit,
        percentage,
        tier,
        daily_usage: dailyUsage,
        avg_response_time: 45,
        error_rate: 0.1
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  async function fetchLastUsed(userId: string) {
    try {
      // Fetch the most recent API log
      const { data } = await supabase
        .from('api_logs')
        .select('created_at')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data && apiKey) {
        setApiKey({
          ...apiKey,
          last_used_at: data.created_at,
          total_requests: usage.current
        })
      }
    } catch (error) {
      // If no logs found, that's okay
      console.log('No API usage yet')
    }
  }

  async function copyApiKey() {
    const keyToCopy = isDemo ? 'sp_demo_k3y_f0r_pr3v13w_0nly' : apiKey?.key || ''
    await navigator.clipboard.writeText(keyToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function copyCodeBlock(code: string, blockId: string) {
    await navigator.clipboard.writeText(code)
    setCopiedCode(blockId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function regenerateKey() {
    if (isDemo) {
      alert('API key regeneration is disabled in demo mode.')
      return
    }

    if (!confirm('This will invalidate your current API key. Continue?')) return

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        await fetchApiKey(user.id)
        alert('New API key generated!')
      }
    } catch (error) {
      console.error('Error regenerating key:', error)
    }
  }

  async function openBillingPortal() {
    if (isDemo) {
      setShowUpgradeModal(true)
      return
    }

    // In production, this would open Stripe billing portal
    window.open('https://billing.stripe.com/p/login/test_xxx', '_blank')
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

  const formatLastUsed = () => {
    if (!apiKey?.last_used_at && usage.current === 0) return 'Never'
    if (!apiKey?.last_used_at) return 'Recently' // If we have usage but no timestamp

    const date = new Date(apiKey.last_used_at)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hours ago`
    if (hours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary">SafePrompt</h1>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm text-gray-300 hover:text-white">Dashboard</a>
                <a href="#docs" className="text-sm text-gray-300 hover:text-white">Docs</a>
                <a href="https://status.safeprompt.dev" className="text-sm text-gray-300 hover:text-white">Status</a>
                <a href="#support" className="text-sm text-gray-300 hover:text-white">Support</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-yellow-900/20 border-b border-yellow-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-sm text-yellow-400">
              🎭 Demo Mode - <button onClick={() => setShowUpgradeModal(true)} className="underline">Sign up</button> for a real API key.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-bold">{usage.current.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold">{usage.avg_response_time}ms</p>
              </div>
              <Clock className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Error Rate</p>
                <p className="text-2xl font-bold">{usage.error_rate}%</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-2xl font-bold capitalize">{currentPlan.name}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* API Key Card - Improved */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API Key
              </h2>
              <button
                onClick={regenerateKey}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>

            <div className="relative bg-black rounded border border-gray-800">
              {/* Copy button in top-right corner like standard docs */}
              <button
                onClick={copyApiKey}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <div className="p-4 pr-12 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="break-all">{maskedKey}</span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-gray-400 hover:text-white transition-colors ml-2"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="ml-2">{apiKey ? new Date(apiKey.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Last used:</span>
                <span className="ml-2">{formatLastUsed()}</span>
              </div>
              <div>
                <span className="text-gray-400">Total requests:</span>
                <span className="ml-2">{usage.current.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 text-green-500">Active</span>
              </div>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{currentPlan.name} Plan</p>
                    <p className="text-sm text-gray-400">
                      ${currentPlan.price}/month
                    </p>
                  </div>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">CURRENT</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {currentPlan.requests.toLocaleString()} requests/month
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Usage This Month</span>
                  <span className={usage.percentage > 80 ? 'text-red-500' : ''}>
                    {usage.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usage.percentage > 80 ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {usage.current.toLocaleString()} / {usage.limit.toLocaleString()} requests
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full bg-primary text-black font-semibold py-2 px-4 rounded hover:bg-primary/90 transition-colors"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={openBillingPortal}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Manage Billing
                </button>
              </div>

              <div className="text-xs text-gray-500">
                Next billing: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-primary" />
            Usage Analytics
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Usage Chart (simplified) */}
            <div>
              <h3 className="text-sm text-gray-400 mb-3">Daily Requests (Last 7 Days)</h3>
              <div className="flex items-end gap-2 h-32">
                {usage.daily_usage.map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(value / Math.max(...usage.daily_usage)) * 100}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-400 mb-3">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-green-500">{usage.avg_response_time}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-500">{(100 - usage.error_rate).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Threats Blocked</span>
                  <span className="text-orange-500">342 this month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Uptime</span>
                  <span className="text-green-500">99.99%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">cURL</h3>
                <button
                  onClick={() => copyCodeBlock(`curl -X POST https://api.safeprompt.dev/v1/check \\
  -H "Authorization: Bearer ${isDemo ? 'YOUR_API_KEY' : apiKey?.key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your user input here"}'`, 'curl')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'curl' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`curl -X POST https://api.safeprompt.dev/v1/check \\
  -H "Authorization: Bearer ${isDemo ? 'YOUR_API_KEY' : apiKey?.key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your user input here"}'`}</code>
              </pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400 mb-2">📚 Documentation</p>
                <a href="https://docs.safeprompt.dev" className="text-primary hover:underline flex items-center gap-1">
                  API Reference <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">💬 Support</p>
                <a href="#" onClick={() => alert('Support form would open here')} className="text-primary hover:underline">
                  Get Help →
                </a>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-800">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Choose Your Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-gray-800 rounded-lg p-6 border ${
                      plan.popular ? 'border-primary' : 'border-gray-700'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-black text-xs px-3 py-1 rounded-full font-semibold">
                          POPULAR
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                        currentPlan.id === plan.id
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-primary text-black hover:bg-primary/90'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                      disabled={currentPlan.id === plan.id}
                      onClick={() => {
                        if (isDemo) {
                          alert('Sign up for a real account to select a plan')
                        } else {
                          alert(`Would redirect to Stripe checkout for ${plan.name} plan`)
                        }
                      }}
                    >
                      {currentPlan.id === plan.id ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}