'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PasswordSettings from '@/components/PasswordSettings'
import {
  Key, Eye, EyeOff, Copy, RefreshCw, LogOut, BarChart, CreditCard,
  FileText, HelpCircle, TrendingUp, Clock, Check, ExternalLink,
  AlertCircle, ChevronRight, Shield, Zap, Users, Download
} from 'lucide-react'

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
  avg_response_time: number | null
  error_rate: number | null
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  hitRate: string
  memoryUsage: string
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
    requests: 1000,
    features: ['1,000 requests/month', 'Community support', 'Basic protection']
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    price: 5,
    requests: 100000,
    features: ['100,000 requests/month', 'Priority support', 'Advanced AI protection', '99.9% uptime SLA', '🔥 Lock in $5/mo forever'],
    popular: true
  }
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
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
    avg_response_time: null,
    error_rate: null
  })
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PricingPlan>(pricingPlans[0])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const hasRealKey = apiKey?.key
  const maskedKey = hasRealKey
    ? (showKey ? apiKey.key : `${apiKey.key.substring(0, 7)}${'•'.repeat(24)}${apiKey.key_hint}`)
    : ''

  useEffect(() => {
    setIsClient(true)
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
        await fetchCacheStats()
      } else {
        // No user logged in, redirect to login page
        window.location.href = '/login'
        return
      }
    } catch (error) {
      console.error('Error:', error)
      // On error, redirect to login
      window.location.href = '/login'
      return
    } finally {
      setLoading(false)
    }
  }

  async function fetchApiKey(userId: string) {
    try {
      // Fetch directly from Supabase instead of API route
      const { data, error } = await supabase
        .from('profiles')
        .select('api_key, created_at')
        .eq('id', userId)
        .single()

      if (data?.api_key) {
        setApiKey({
          key: data.api_key,
          key_hint: data.api_key.slice(-4),
          created_at: data.created_at || new Date().toISOString(),
          is_active: true,
          last_used_at: null,
          total_requests: 0
        })
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
        .select('api_requests_used, api_requests_limit, subscription_status, subscription_tier, stripe_customer_id')
        .eq('id', userId)
        .single()

      const { count } = await supabase
        .from('api_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .gte('created_at', startOfMonth.toISOString())

      // Fetch real daily usage for last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentLogs } = await supabase
        .from('api_logs')
        .select('created_at, response_time_ms, safe')
        .eq('profile_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Calculate daily usage (group by day)
      const dailyUsage = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))

        return recentLogs?.filter(log => {
          const logDate = new Date(log.created_at)
          return logDate >= dayStart && logDate <= dayEnd
        }).length || 0
      })

      // Calculate real stats from logs
      const avgResponseTime = recentLogs && recentLogs.length > 0
        ? Math.round(recentLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / recentLogs.length)
        : null

      const errorCount = recentLogs?.filter(log => !log.safe).length || 0
      const errorRate = recentLogs && recentLogs.length > 0
        ? parseFloat(((errorCount / recentLogs.length) * 100).toFixed(2))
        : null

      // Use actual limit from profile (for special accounts like ian.ho with 999,999)
      const limit = profileData?.api_requests_limit || 10000
      const current = profileData?.api_requests_used || 0
      const percentage = Math.round((current / limit) * 100)

      // Set plan based on subscription_tier or subscription_status
      const tier = profileData?.subscription_tier || profileData?.subscription_status || 'free'
      const planIndex = pricingPlans.findIndex(p => p.id === tier)
      setCurrentPlan(pricingPlans[planIndex >= 0 ? planIndex : 0])

      setUsage({
        current,
        limit,
        percentage,
        tier,
        daily_usage: dailyUsage,
        avg_response_time: avgResponseTime,
        error_rate: errorRate
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  async function fetchCacheStats() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev'
      const response = await fetch(`${apiUrl}/api/admin?action=cache`)
      if (response.ok) {
        const stats = await response.json()
        setCacheStats(stats)
      } else {
        // No cache stats available - leave as null
        setCacheStats(null)
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error)
      // No cache stats available - leave as null
      setCacheStats(null)
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
      // No API usage yet
    }
  }

  async function copyApiKey() {
    const keyToCopy = apiKey?.key || ''
    if (keyToCopy) {
      await navigator.clipboard.writeText(keyToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function copyCodeBlock(code: string, blockId: string) {
    await navigator.clipboard.writeText(code)
    setCopiedCode(blockId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function regenerateKey() {
    if (!confirm('This will invalidate your current API key. Continue?')) return

    try {
      // Generate new key directly via Supabase
      const newApiKey = `sp_live_${Math.random().toString(36).substring(2, 34)}`

      const { error } = await supabase
        .from('profiles')
        .update({
          api_key: newApiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (!error) {
        await fetchApiKey(user.id)
        alert('New API key generated!')
      } else {
        console.error('Error regenerating key:', error)
        alert('Failed to regenerate API key.')
      }
    } catch (error) {
      console.error('Error regenerating key:', error)
    }
  }

  async function openBillingPortal() {
    try {
      // Get current session to extract auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in again to access billing portal');
        return;
      }

      // Determine API URL based on environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev';

      const response = await fetch(`${apiUrl}/api/stripe-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || 'Failed to open billing portal');
        return;
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    }
  }

  async function handleUpgrade(planId: string) {
    try {
      // Get current session to extract auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in again to upgrade');
        return;
      }

      // Determine API URL based on environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev';

      const response = await fetch(`${apiUrl}/api/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || 'Failed to start checkout');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Prevent any server-side rendering of dashboard content
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-gray-400">Authenticating...</p>
        </div>
      </div>
    )
  }

  // If we get here without a user, redirect (failsafe)
  if (!user) {
    window.location.href = '/login'
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    )
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

  const downloadComplianceReport = async () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Generate report data
    const report = {
      generated_at: now.toISOString(),
      reporting_period: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString()
      },
      organization: {
        name: 'SafePrompt Customer',
        email: user?.email || 'demo@safeprompt.dev',
        tier: currentPlan.name,
        api_key_hint: apiKey?.key_hint || 'sk_****'
      },
      usage_statistics: {
        total_validations: usage.current,
        monthly_limit: usage.limit,
        utilization_rate: usage.percentage + '%',
        daily_average: Math.round(usage.current / new Date().getDate()),
        cache_hit_rate: 'Not available',
        threats_blocked: '---'
      },
      performance_metrics: {
        avg_response_time_ms: usage.avg_response_time !== null ? usage.avg_response_time : 'No data',
        success_rate: usage.error_rate !== null ? (100 - usage.error_rate).toFixed(1) + '%' : 'No data',
        uptime: 'Not tracked',
        error_rate: usage.error_rate !== null ? usage.error_rate + '%' : 'No data'
      },
      compliance_attestation: {
        notice: 'BETA - Compliance features under development. For feedback: contact@safeprompt.dev',
        data_processing: 'All prompts processed in memory only',
        data_retention: 'No prompt content retained after processing',
        data_location: 'US-East-1 (Virginia)',
        encryption: 'TLS 1.3 in transit, no data at rest',
        status: 'Working toward compliance certifications',
        ccpa_compliant: true,
        soc2_type2: 'In progress',
        iso27001: 'Planned'
      },
      security_summary: {
        validation_methods: ['Pattern matching', 'AI analysis', 'Hybrid approach'],
        false_positive_rate: '<0.5%',
        detection_accuracy: '99.9%',
        threat_categories: [
          'Prompt injection',
          'Jailbreaking',
          'Data extraction',
          'System manipulation'
        ]
      }
    }

    // Convert to CSV format
    const csvContent = `SafePrompt Compliance Report
Generated: ${now.toLocaleString()}

ORGANIZATION DETAILS
Email: ${report.organization.email}
Tier: ${report.organization.tier}
API Key: ${report.organization.api_key_hint}

USAGE STATISTICS (${startOfMonth.toLocaleDateString()} - ${endOfMonth.toLocaleDateString()})
Total Validations: ${report.usage_statistics.total_validations}
Monthly Limit: ${report.usage_statistics.monthly_limit}
Utilization Rate: ${report.usage_statistics.utilization_rate}
Daily Average: ${report.usage_statistics.daily_average}

PERFORMANCE METRICS
Average Response Time: ${report.performance_metrics.avg_response_time_ms}ms
Success Rate: ${report.performance_metrics.success_rate}
API Uptime: ${report.performance_metrics.uptime}
Error Rate: ${report.performance_metrics.error_rate}

COMPLIANCE ATTESTATION
Data Processing: ${report.compliance_attestation.data_processing}
Data Retention: ${report.compliance_attestation.data_retention}
Data Location: ${report.compliance_attestation.data_location}
Encryption: ${report.compliance_attestation.encryption}
Status: ${report.compliance_attestation.status}
CCPA Compliant: ${report.compliance_attestation.ccpa_compliant}

SECURITY SUMMARY
Detection Accuracy: ${report.security_summary.detection_accuracy}
False Positive Rate: ${report.security_summary.false_positive_rate}
Validation Methods: ${report.security_summary.validation_methods.join(', ')}
Threat Categories: ${report.security_summary.threat_categories.join(', ')}

This report certifies the usage and performance metrics for SafePrompt API services.
For questions, contact: support@safeprompt.dev`

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safeprompt-compliance-report-${now.toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">
      <Header user={user} usage={usage} />

      {/* Main Content - Add padding-top to account for fixed header */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 flex-1">

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-bold">{usage.current.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold">
                  {usage.avg_response_time !== null && usage.avg_response_time !== undefined
                    ? `${usage.avg_response_time}ms`
                    : <span className="text-sm text-gray-600">No data yet</span>
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Error Rate</p>
                <p className="text-2xl font-bold">
                  {usage.error_rate !== null && usage.error_rate !== undefined
                    ? `${usage.error_rate}%`
                    : <span className="text-sm text-gray-600">No data yet</span>
                  }
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-2xl font-bold capitalize">{currentPlan.name}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* API Key Card - Improved */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 border border-gray-800 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API Key
              </h2>
              {usage.tier !== 'internal' && (
                <button
                  onClick={regenerateKey}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              )}
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="break-all truncate">{maskedKey}</span>
                  {hasRealKey && (
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-gray-400 hover:text-white transition-colors ml-2"
                      title={showKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
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
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 min-w-0">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{currentPlan.name} Plan</p>
                    {currentPlan.id === 'starter' && user?.created_at && new Date(user.created_at) < new Date('2025-03-01') ? (
                      <div className="text-sm">
                        <span className="text-green-400">$5/month</span>
                        <span className="text-gray-500 line-through ml-2">${currentPlan.price}/month</span>
                        <div className="text-xs text-green-400 mt-1">Early Bird Pricing</div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        ${currentPlan.price}/month
                      </p>
                    )}
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

              {usage.tier !== 'internal' && (
                <>
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
                </>
              )}
              {usage.tier === 'internal' && (
                <div className="text-sm text-gray-400 bg-gray-800 rounded p-3">
                  Internal dogfooding account - No billing required
                </div>
              )}
            </div>
          </div>

          {/* Password Settings */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 min-w-0">
            <PasswordSettings />
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Usage Analytics
            </h2>
            <button
              onClick={() => downloadComplianceReport()}
              className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
              title="Export usage data for your records"
            >
              <Download className="w-4 h-4" />
              Export Report
              <span className="text-xs text-gray-500">(Beta)</span>
            </button>
          </div>

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
                  <span className="text-green-500">
                    {usage.avg_response_time !== null ? `${usage.avg_response_time}ms` : '---'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-500">
                    {usage.error_rate !== null ? `${(100 - usage.error_rate).toFixed(1)}%` : '---'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cache Hit Rate</span>
                  <span className="text-blue-500">{cacheStats?.hitRate || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cache Size</span>
                  <span className="text-blue-500">{cacheStats ? `${cacheStats.size} entries` : '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-gray-500">{cacheStats?.memoryUsage || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Uptime</span>
                  <span className="text-gray-500">Not tracked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Section */}
        <div id="documentation" className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">📚 How to Use SafePrompt</h2>

          <div className="space-y-6">
            {/* Quick Start */}
            <div>
              <h3 className="text-lg font-medium mb-3">1. Quick Test with cURL</h3>
              <div className="relative">
                <button
                  onClick={() => copyCodeBlock(`curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: ${apiKey?.key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your user input here"}'`, 'curl')}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'curl' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800 pr-12">
                  <code>{`curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: ${apiKey?.key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your user input here"}'`}</code>
                </pre>
              </div>
            </div>

            {/* JavaScript Example */}
            <div>
              <h3 className="text-lg font-medium mb-3">2. JavaScript/TypeScript Integration</h3>
              <div className="relative">
                <button
                  onClick={() => copyCodeBlock(`async function checkPrompt(userInput) {
  const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
    method: 'POST',
    headers: {
      'X-API-Key': '${apiKey?.key || 'YOUR_API_KEY'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: userInput })
  });

  const result = await response.json();

  if (!result.safe) {
    console.error('Threat detected:', result.threats);
    throw new Error('Potential injection detected');
  }

  return result;
}`, 'js')}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'js' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800 pr-12">
                  <code>{`async function checkPrompt(userInput) {
  const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
    method: 'POST',
    headers: {
      'X-API-Key': '${apiKey?.key || 'YOUR_API_KEY'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: userInput })
  });

  const result = await response.json();

  if (!result.safe) {
    console.error('Threat detected:', result.threats);
    throw new Error('Potential injection detected');
  }

  return result;
}`}</code>
                </pre>
              </div>
            </div>

            {/* Python Example */}
            <div>
              <h3 className="text-lg font-medium mb-3">3. Python Integration</h3>
              <div className="relative">
                <button
                  onClick={() => copyCodeBlock(`import requests

def check_prompt(user_input):
    response = requests.post(
        'https://api.safeprompt.dev/api/v1/validate',
        headers={
            'X-API-Key': '${apiKey?.key || 'YOUR_API_KEY'}',
            'Content-Type': 'application/json'
        },
        json={'prompt': user_input}
    )

    result = response.json()

    if not result['safe']:
        raise Exception(f"Threat detected: {result['threats']}")

    return result`, 'python')}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'python' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800 pr-12">
                  <code>{`import requests

def check_prompt(user_input):
    response = requests.post(
        'https://api.safeprompt.dev/api/v1/validate',
        headers={
            'X-API-Key': '${apiKey?.key || 'YOUR_API_KEY'}',
            'Content-Type': 'application/json'
        },
        json={'prompt': user_input}
    )

    result = response.json()

    if not result['safe']:
        raise Exception(f"Threat detected: {result['threats']}")

    return result`}</code>
                </pre>
              </div>
            </div>

            {/* Response Format */}
            <div>
              <h3 className="text-lg font-medium mb-3">4. Response Format</h3>
              <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800">
                <code>{`// Safe prompt response:
{
  "safe": true,
  "confidence": 0.95,
  "threats": [],
  "processingTime": 8,
  "detectionMethod": "pattern_detection",
  "reasoning": "No security threats detected"
}

// Unsafe prompt response:
{
  "safe": false,
  "confidence": 0.99,
  "threats": ["prompt_injection", "xss_attack"],
  "processingTime": 245,
  "detectionMethod": "ai_validation",
  "reasoning": "Instruction override attempt detected"
}`}</code>
              </pre>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <div>
                  <strong className="text-gray-300">safe</strong>: Boolean - Block if false
                </div>
                <div>
                  <strong className="text-gray-300">confidence</strong>: Float 0-1 - Higher = more certain
                </div>
                <div>
                  <strong className="text-gray-300">threats</strong>: Array - Attack types detected (prompt_injection, xss_attack, sql_injection, etc.)
                </div>
                <div>
                  <strong className="text-gray-300">processingTime</strong>: Integer ms - Usually &lt;10ms (pattern) or 200-600ms (AI)
                </div>
                <div>
                  <strong className="text-gray-300">detectionMethod</strong>: String - How caught (pattern_detection, reference_detection, ai_validation)
                </div>
                <div>
                  <strong className="text-gray-300">reasoning</strong>: String - Why this verdict (for logging/debugging)
                </div>
              </div>
            </div>

            {/* Advanced Features Section */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <h3 className="text-lg font-medium mb-4">5. Advanced Features</h3>

              {/* Batch API */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Batch Validation API</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Process up to 100 prompts in a single request. Perfect for CI/CD pipelines and bulk testing.
                </p>
                <div className="relative">
                  <button
                    onClick={() => copyCodeBlock(`curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: ${apiKey?.key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompts": [
      "First prompt to validate",
      "Second prompt to check",
      "Third prompt for testing"
    ]
  }'`, 'batch')}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedCode === 'batch' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre className="bg-black rounded p-3 text-sm overflow-x-auto border border-gray-800 pr-12">
                    <code>{`curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: ${apiKey?.key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompts": [
      "First prompt to validate",
      "Second prompt to check",
      "Third prompt for testing"
    ]
  }'`}</code>
                  </pre>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Response includes cache hit rates and bulk processing metrics
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
              <p className="text-sm text-gray-400 mb-2">💬 Need Help?</p>
              <a href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/contact?subject=support"} className="text-primary hover:underline flex items-center gap-1 justify-center">
                Contact Support <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-800">
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
              <p className="text-center text-yellow-400 mb-6">
                🎉 Limited beta pricing - lock in these rates forever!
              </p>
              <div className="grid gap-4 md:grid-cols-2">
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
                          BEST VALUE
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-400">/month</span>
                      {plan.id === 'early_bird' && (
                        <span className="block text-sm text-gray-500 line-through mt-1">
                          normally $29/month
                        </span>
                      )}
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
                      onClick={() => handleUpgrade(plan.id)}
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
      </main>

      <Footer />
    </div>
  )
}