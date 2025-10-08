'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, Shield, TrendingUp, Activity, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const ADMIN_EMAILS = ['ian.ho@rebootmedia.net']

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSamples: 0,
    safeSamples: 0,
    unsafeSamples: 0,
    avgThreatSeverity: 0,
    totalIPsTracked: 0,
    autoBlockedIPs: 0,
    allowlistedIPs: 0,
    avgBlockRate: 0,
    dailyVolume: [] as {date: string, count: number}[]
  })

  const [usage] = useState({
    current: 0,
    limit: 999999999,
    percentage: 0,
    tier: 'internal',
    daily_usage: [],
    avg_response_time: null,
    error_rate: null
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !ADMIN_EMAILS.includes(session.user.email!)) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)
    } catch (error) {
      console.error('Admin access check failed:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalytics() {
    try {
      // Load threat intelligence samples
      const { data: samples } = await supabase
        .from('threat_intelligence_samples')
        .select('created_at, threat_severity, validation_result')

      // Load IP reputation data
      const { data: ipReputation } = await supabase
        .from('ip_reputation')
        .select('auto_block, block_rate')

      // Load allowlist data
      const { data: allowlist } = await supabase
        .from('ip_allowlist')
        .select('active')

      // Calculate collection metrics
      const totalSamples = samples?.length || 0
      const unsafeSamples = samples?.filter(s =>
        s.validation_result?.safe === false || s.threat_severity !== 'low'
      ).length || 0
      const safeSamples = totalSamples - unsafeSamples

      // Calculate average threat severity score (critical=4, high=3, medium=2, low=1)
      const severityScores = samples?.map(s => {
        switch(s.threat_severity) {
          case 'critical': return 4
          case 'high': return 3
          case 'medium': return 2
          default: return 1
        }
      }) || []
      const avgThreatSeverity = severityScores.length > 0
        ? severityScores.reduce((a, b) => a + b, 0) / severityScores.length
        : 0

      // Calculate daily volume (last 7 days)
      const dailyVolume = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toISOString().split('T')[0]
        const count = samples?.filter(s => s.created_at.startsWith(dateStr)).length || 0
        return { date: dateStr, count }
      })

      // Calculate IP blocking stats
      const totalIPsTracked = ipReputation?.length || 0
      const autoBlockedIPs = ipReputation?.filter(ip => ip.auto_block).length || 0
      const avgBlockRate = ipReputation && ipReputation.length > 0
        ? ipReputation.reduce((sum, ip) => sum + ip.block_rate, 0) / ipReputation.length
        : 0

      const allowlistedIPs = allowlist?.filter(a => a.active).length || 0

      setStats({
        totalSamples,
        safeSamples,
        unsafeSamples,
        avgThreatSeverity,
        totalIPsTracked,
        autoBlockedIPs,
        allowlistedIPs,
        avgBlockRate,
        dailyVolume
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <Header user={user} usage={usage} />
        <main className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Header user={user} usage={usage} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                  <h1 className="text-3xl font-bold text-white">Intelligence Analytics</h1>
                </div>
                <p className="text-gray-300">Threat intelligence collection and IP blocking metrics</p>
              </div>
              <button
                onClick={loadAnalytics}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Collection Metrics */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Collection Metrics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Total Samples Collected</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalSamples}</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Safe vs Unsafe Ratio</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {stats.safeSamples}:{stats.unsafeSamples}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.totalSamples > 0 ? ((stats.safeSamples / stats.totalSamples) * 100).toFixed(1) : 0}% safe
                </p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Avg Threat Severity</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">
                  {stats.avgThreatSeverity.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-2">1=Low, 4=Critical</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Daily Average (7d)</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">
                  {(stats.dailyVolume.reduce((sum, d) => sum + d.count, 0) / 7).toFixed(0)}
                </p>
                <p className="text-xs text-gray-400 mt-2">samples/day</p>
              </div>
            </div>
          </div>

          {/* Daily Volume Chart */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Collection Volume (Last 7 Days)</h3>
            <div className="flex items-end gap-2 h-64">
              {stats.dailyVolume.map((day, idx) => {
                const maxCount = Math.max(...stats.dailyVolume.map(d => d.count), 1)
                const heightPercent = (day.count / maxCount) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-400"
                      style={{ height: `${heightPercent}%` }}
                      title={`${day.count} samples`}
                    />
                    <span className="text-xs text-gray-400 mt-2 rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-white mt-1">{day.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* IP Blocking Stats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">IP Blocking Stats</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Total IPs Tracked</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalIPsTracked}</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Auto-Blocked IPs</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{stats.autoBlockedIPs}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.totalIPsTracked > 0 ? ((stats.autoBlockedIPs / stats.totalIPsTracked) * 100).toFixed(1) : 0}% of tracked
                </p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Avg Block Rate</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">
                  {(stats.avgBlockRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-2">across all tracked IPs</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400">Allowlisted IPs</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{stats.allowlistedIPs}</p>
                <p className="text-xs text-gray-400 mt-2">CI/CD, testing, internal</p>
              </div>
            </div>
          </div>

          {/* Block Rate Distribution */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Collection Status</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-green-500 rounded-full h-4"
                      style={{ width: `${stats.totalSamples > 0 ? 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-white">Active</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Network Defense Coverage</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-purple-500 rounded-full h-4"
                      style={{
                        width: `${stats.totalIPsTracked > 0 ? Math.min((stats.totalIPsTracked / 1000) * 100, 100) : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-white">
                    {stats.totalIPsTracked}/1000 IPs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
