'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, AlertTriangle, TrendingUp, Globe, RefreshCw, Download, Search, Filter } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Simple admin auth - in production, use proper role-based access
const ADMIN_EMAILS = ['ian.ho@rebootmedia.net']

interface ThreatSample {
  id: string
  created_at: string
  prompt_text: string | null
  prompt_hash: string
  validation_result: any
  attack_vectors: string[]
  threat_severity: string
  confidence_score: number
  ip_hash: string
  ip_country: string | null
  subscription_tier: string
  anonymized_at: string | null
}

export default function ThreatIntelligenceDashboard() {
  const [user, setUser] = useState<any>(null)
  const [samples, setSamples] = useState<ThreatSample[]>([])
  const [filteredSamples, setFilteredSamples] = useState<ThreatSample[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterTier, setFilterTier] = useState('all')

  // Usage state for Header component
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
      loadThreatSamples()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh && user) {
      interval = setInterval(() => {
        loadThreatSamples()
      }, 30000) // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, user])

  useEffect(() => {
    // Filter samples based on search and filters
    let filtered = samples

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.prompt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ip_hash.includes(searchQuery) ||
        s.attack_vectors.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(s => s.threat_severity === filterSeverity)
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(s => s.subscription_tier === filterTier)
    }

    setFilteredSamples(filtered)
  }, [searchQuery, filterSeverity, filterTier, samples])

    async function checkAdminAccess() {
    try {
      // Get session to ensure auth.uid() is set for RLS
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      // Check role (middleware already protected this route, but double-check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        window.location.href = '/'
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

  async function loadThreatSamples() {
    try {
      // Load last 100 threat samples (Phase 1A schema)
      const { data, error } = await supabase
        .from('threat_intelligence_samples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading samples:', error)
        return
      }

      setSamples(data || [])
    } catch (error) {
      console.error('Failed to load threat samples:', error)
    }
  }

  function exportToCSV() {
    const headers = ['Timestamp', 'Prompt Hash', 'Attack Vectors', 'Severity', 'Confidence', 'IP Hash', 'Country', 'Tier', 'Anonymized']
    const rows = filteredSamples.map(s => [
      new Date(s.created_at).toISOString(),
      s.prompt_hash,
      s.attack_vectors.join(';'),
      s.threat_severity,
      s.confidence_score,
      s.ip_hash,
      s.ip_country || 'unknown',
      s.subscription_tier,
      s.anonymized_at ? 'yes' : 'no'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threat-intelligence-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Calculate statistics
  const stats = {
    total: samples.length,
    critical: samples.filter(s => s.threat_severity === 'critical').length,
    high: samples.filter(s => s.threat_severity === 'high').length,
    medium: samples.filter(s => s.threat_severity === 'medium').length,
    low: samples.filter(s => s.threat_severity === 'low').length,
    anonymized: samples.filter(s => s.anonymized_at !== null).length,
    uniqueIPs: new Set(samples.map(s => s.ip_hash)).size,
    freeTier: samples.filter(s => s.subscription_tier === 'free').length,
    paidTiers: samples.filter(s => ['early_bird', 'starter', 'business', 'pro'].includes(s.subscription_tier)).length
  }

  // Get unique values for filters
  const uniqueAttackVectors = Array.from(new Set(samples.flatMap(s => s.attack_vectors)))

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
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 text-purple-400" />
                  <h1 className="text-3xl font-bold text-white">Threat Intelligence Dashboard</h1>
                </div>
                <p className="text-gray-300">
                  Real-time threat intelligence samples (last 100 records)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    autoRefresh
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 text-gray-200'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
                </button>
                <button
                  onClick={loadThreatSamples}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Now
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Samples</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Shield className="w-12 h-12 text-purple-400 opacity-80" />
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Free: {stats.freeTier} | Paid: {stats.paidTiers}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Critical Threats</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-400 opacity-80" />
              </div>
              <div className="mt-3 text-xs text-gray-400">
                High: {stats.high} | Medium: {stats.medium} | Low: {stats.low}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Unique IPs</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.uniqueIPs}</p>
                </div>
                <Globe className="w-12 h-12 text-blue-400 opacity-80" />
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Anonymized</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.anonymized}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-400 opacity-80" />
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {((stats.anonymized / stats.total) * 100 || 0).toFixed(1)}% processed
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Filters</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompt, IP hash, vectors..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Threat Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subscription Tier</label>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="early_bird">Early Bird</option>
                  <option value="starter">Starter</option>
                  <option value="business">Business</option>
                  <option value="pro">Pro (Legacy)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Samples Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Attack Vectors</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">IP Hash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSamples.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No samples found matching filters
                      </td>
                    </tr>
                  ) : (
                    filteredSamples.slice(0, 50).map((sample) => (
                      <tr key={sample.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                          {new Date(sample.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {sample.attack_vectors.map((vector, idx) => (
                              <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                                {vector}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sample.threat_severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                            sample.threat_severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            sample.threat_severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {sample.threat_severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {(sample.confidence_score * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono text-xs">
                          {sample.ip_hash.substring(0, 16)}...
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            ['early_bird', 'starter', 'business', 'pro'].includes(sample.subscription_tier) ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {sample.subscription_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {sample.anonymized_at ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                              Anonymized
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                              Active PII
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredSamples.length > 50 && (
              <div className="px-4 py-3 bg-gray-700/30 text-sm text-gray-400 text-center">
                Showing 50 of {filteredSamples.length} samples (export CSV for full dataset)
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
