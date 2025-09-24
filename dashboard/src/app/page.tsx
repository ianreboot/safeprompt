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
      await fetchApiKey(user.id)
      await fetchUsage(user.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchApiKey(userId: string) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (data) {
        setApiKey(data)
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

      const { data: userData } = await supabase
        .from('users')
        .select('monthly_limit, tier')
        .eq('id', userId)
        .single()

      const { count } = await supabase
        .from('validation_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())

      const limit = userData?.monthly_limit || 50000
      const current = count || 0
      const percentage = Math.round((current / limit) * 100)

      setUsage({ current, limit, percentage, tier: userData?.tier || 'beta' })
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  async function copyApiKey() {
    if (apiKey?.key_hint) {
      // In production, fetch the full key from a secure endpoint
      const fullKey = `sp_live_${'*'.repeat(28)}${apiKey.key_hint}`
      await navigator.clipboard.writeText(fullKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function regenerateKey() {
    if (!confirm('This will invalidate your current API key. Continue?')) return

    try {
      // Call API endpoint to regenerate key
      const response = await fetch('/api/regenerate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        await fetchApiKey(user.id)
        alert('New API key generated! Please update your applications.')
      }
    } catch (error) {
      console.error('Error regenerating key:', error)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-safeprompt-green">Loading...</div>
      </div>
    )
  }

  const maskedKey = apiKey
    ? showKey
      ? `sp_live_${'*'.repeat(28)}${apiKey.key_hint}`
      : `sp_live_${'•'.repeat(28)}${apiKey.key_hint}`
    : 'No API key found'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-safeprompt-green" />
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* API Key Card */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-safeprompt-green" />
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
                <div className="mt-2 text-safeprompt-green text-xs">Copied to clipboard!</div>
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
              <BarChart className="w-5 h-5 text-safeprompt-green" />
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
                      usage.percentage > 80 ? 'bg-red-500' : 'bg-safeprompt-green'
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

        {/* Quick Start Guide */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">1. Install the SDK</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>npm install @safeprompt/js</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">2. Initialize the client</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`import SafePrompt from '@safeprompt/js'

const safeprompt = new SafePrompt('${maskedKey}')`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">3. Validate prompts</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`const result = await safeprompt.check(userInput)

if (!result.safe) {
  throw new Error('Potential prompt injection detected')
}`}</code>
              </pre>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href="/docs"
              className="text-safeprompt-green hover:underline text-sm"
            >
              View Full Documentation →
            </a>
            <a
              href="https://api.safeprompt.dev/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-safeprompt-green hover:underline text-sm"
            >
              API Status →
            </a>
          </div>
        </div>

        {/* Billing Section */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Billing</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-400">Current Plan</p>
              <p className="text-lg font-semibold capitalize">{usage.tier} - $5/month</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Next Billing Date</p>
              <p className="text-lg font-semibold">
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button className="px-4 py-2 bg-safeprompt-green text-black rounded hover:bg-green-400 transition-colors">
              Upgrade Plan
            </button>
            <button className="px-4 py-2 border border-gray-700 rounded hover:border-gray-600 transition-colors">
              Manage Billing
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}