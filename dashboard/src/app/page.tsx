'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Key, Copy, Shield, BarChart, LogOut, RefreshCw, Eye, EyeOff } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [apiKey, setApiKey] = useState<any>(null)
  const [usage, setUsage] = useState<any>({ current: 0, limit: 50000, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setUser(user)

      // For demo user, set fake API key
      if (user.email === 'demo@safeprompt.dev') {
        setApiKey({
          key: 'sp_demo_k3y_f0r_pr3v13w_0nly',
          key_hint: 'pr3v13w_0nly',
          created_at: new Date().toISOString(),
          is_active: true
        })
        setUsage({ current: 2543, limit: 10000, percentage: 25, tier: 'demo' })
      } else {
        await fetchApiKey(user.id)
        await fetchUsage(user.id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchApiKey(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('api_key, created_at, is_active')
        .eq('id', userId)
        .single()

      if (data && data.api_key) {
        // Format data to match expected structure
        setApiKey({
          key: data.api_key,
          key_hint: data.api_key.slice(-4),
          created_at: data.created_at,
          is_active: data.is_active,
          last_used_at: null // Will be tracked in api_logs
        })
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
    }
  }

  async function fetchUsage(userId: string) {
    try {
      // Get current month's usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('api_calls_this_month, stripe_customer_id')
        .eq('id', userId)
        .single()

      // Use api_logs table instead of validation_logs
      const { count } = await supabase
        .from('api_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .gte('created_at', startOfMonth.toISOString())

      // Determine limit based on subscription tier
      // TODO: Get actual plan from Stripe subscription data
      const limit = profileData?.stripe_customer_id ? 100000 : 10000
      const current = profileData?.api_calls_this_month || count || 0
      const percentage = Math.round((current / limit) * 100)
      const tier = profileData?.stripe_customer_id ? 'pro' : 'free'

      setUsage({ current, limit, percentage, tier })
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  async function copyApiKey() {
    if (user?.email === 'demo@safeprompt.dev') {
      await navigator.clipboard.writeText('sp_demo_k3y_f0r_pr3v13w_0nly')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else if (apiKey?.key) {
      await navigator.clipboard.writeText(apiKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function regenerateKey() {
    if (user?.email === 'demo@safeprompt.dev') {
      alert('API key regeneration is disabled in demo mode. Sign up for a real account to get a working API key!')
      return
    }

    if (!confirm('This will invalidate your current API key. Continue?')) return

    try {
      // Generate new API key
      const newApiKey = `sp_live_${Math.random().toString(36).substring(2, 34)}`

      // Update profile with new API key
      const { data, error } = await supabase
        .from('profiles')
        .update({
          api_key: newApiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('api_key, created_at, is_active')
        .single()

      if (error) {
        console.error('Error regenerating key:', error)
        alert('Failed to regenerate API key. Please try again.')
      } else {
        await fetchApiKey(user.id)
        alert('New API key generated! Please update your applications.')
      }
    } catch (error) {
      console.error('Error regenerating key:', error)
      alert('Failed to regenerate API key. Please try again.')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    )
  }

  const isDemo = user?.email === 'demo@safeprompt.dev'
  const maskedKey = isDemo
    ? (showKey ? 'sp_demo_k3y_f0r_pr3v13w_0nly' : 'sp_demo_k3y_••••••••••••_0nly')
    : apiKey
      ? (showKey ? apiKey.key : `sp_live_${'•'.repeat(28)}${apiKey.key_hint}`)
      : 'No API key found'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">SafePrompt Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">{user?.email}</span>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white transition-colors"
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
              🎭 Demo Mode - Exploring the dashboard interface. <a href="https://safeprompt.dev" className="underline">Sign up</a> for a real API key.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* API Key Card */}
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

            <div className="bg-black rounded p-4 font-mono text-sm border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="break-all">{maskedKey}</span>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={copyApiKey}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copied && (
                <div className="mt-2 text-primary text-xs">Copied to clipboard!</div>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <p>Created: {apiKey ? new Date(apiKey.created_at).toLocaleDateString() : 'N/A'}</p>
              <p>Last used: {apiKey?.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}</p>
            </div>
          </div>

          {/* Usage Card */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Usage
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Monthly Usage</span>
                  <span>{usage.current.toLocaleString()} / {usage.limit.toLocaleString()}</span>
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
                  {usage.percentage}% used
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Plan</span>
                  <span className="capitalize">{usage.tier}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Resets</span>
                  <span>
                    {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">API Documentation</h2>

          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded">
            <p className="text-sm text-blue-300">
              <strong>Beta Status:</strong> We're in open beta. The API is functional but features are still being added.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Quick Start with cURL</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`curl -X POST https://api.safeprompt.dev/v1/check \\
  -H "Authorization: Bearer ${isDemo ? 'YOUR_API_KEY' : maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your user input here"}'`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">JavaScript (Fetch API)</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`const response = await fetch('https://api.safeprompt.dev/v1/check', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${isDemo ? 'YOUR_API_KEY' : maskedKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
})

const result = await response.json()
// result: { safe: true/false, confidence: 0.95, threats: [] }`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Python Example</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`import requests

response = requests.post(
    'https://api.safeprompt.dev/v1/check',
    headers={'Authorization': f'Bearer ${isDemo ? 'YOUR_API_KEY' : maskedKey}'},
    json={'prompt': user_input}
)

result = response.json()
if not result['safe']:
    raise Exception('Potential prompt injection detected')`}</code>
              </pre>
            </div>

            <div className="mt-6 p-4 bg-gray-800 rounded">
              <h4 className="text-sm font-medium mb-2">Response Format</h4>
              <pre className="bg-black rounded p-2 text-xs overflow-x-auto mt-2">
                <code>{`{
  "safe": true,        // Whether the prompt is safe to use
  "confidence": 0.95,  // Confidence score (0-1)
  "threats": [],       // Array of detected threat types
  "processing_time": 45 // Time in milliseconds
}`}</code>
              </pre>
            </div>

            <div className="mt-6 text-sm text-gray-400">
              <p><strong>Rate Limits:</strong> {usage.limit.toLocaleString()} requests/month</p>
              <p><strong>Endpoint:</strong> https://api.safeprompt.dev/v1/check</p>
              <p className="mt-2"><strong>SDK Status:</strong> npm package coming soon. Use HTTP API for now.</p>
            </div>
          </div>
        </div>

        {/* Billing Section */}
        {!isDemo && (
          <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Billing</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-lg font-semibold capitalize">{usage.tier} - Beta (Free)</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Next Billing Date</p>
                <p className="text-lg font-semibold">N/A - Beta Period</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded">
              <p className="text-sm text-yellow-400">
                <strong>Beta Period:</strong> Free during beta. Paid plans coming Q2 2025.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}