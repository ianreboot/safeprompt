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
  pattern_detected: string[]
  ai_reasoning: string | null
  confidence_score: number
  client_ip_hash: string
  user_tier: string
  is_anonymized: boolean
}

interface PatternCount {
  pattern: string
  count: number
  percentage: number
}

interface CountryCount {
  country_code: string
  country_name: string
  count: number
  percentage: number
}

export default function ThreatIntelligenceDashboard() {
  const [user, setUser] = useState<any>(null)
  const [samples, setSamples] = useState<ThreatSample[]>([])
  const [filteredSamples, setFilteredSamples] = useState<ThreatSample[]>([])
  const [patternCounts, setPatternCounts] = useState<PatternCount[]>([])
  const [countryCounts, setCountryCounts] = useState<CountryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPattern, setFilterPattern] = useState('all')
  const [novelCount, setNovelCount] = useState(0)

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
    // Filter samples based on search and pattern filter
    let filtered = samples

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.prompt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ai_reasoning?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.client_ip_hash.includes(searchQuery)
      )
    }

    if (filterPattern !== 'all') {
      filtered = filtered.filter(s => s.pattern_detected.includes(filterPattern))
    }

    setFilteredSamples(filtered)
  }, [searchQuery, filterPattern, samples])

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user || !ADMIN_EMAILS.includes(session.user.email!)) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)
      setLoading(false)
    } catch (error) {
      console.error('Admin access check failed:', error)
      window.location.href = '/login'
    }
  }

  // Country code to name mapping
  const countryNames: Record<string, string> = {
    'US': 'United States', 'CN': 'China', 'RU': 'Russia', 'BR': 'Brazil',
    'IN': 'India', 'DE': 'Germany', 'GB': 'United Kingdom', 'FR': 'France',
    'JP': 'Japan', 'CA': 'Canada', 'AU': 'Australia', 'KR': 'South Korea',
    'NL': 'Netherlands', 'IT': 'Italy', 'ES': 'Spain', 'SE': 'Sweden',
    'PL': 'Poland', 'UA': 'Ukraine', 'TR': 'Turkey', 'ID': 'Indonesia',
    'MX': 'Mexico', 'AR': 'Argentina', 'TH': 'Thailand', 'VN': 'Vietnam',
    'PH': 'Philippines', 'MY': 'Malaysia', 'SG': 'Singapore', 'ZA': 'South Africa',
    'EG': 'Egypt', 'SA': 'Saudi Arabia', 'AE': 'UAE', 'IL': 'Israel',
    'NG': 'Nigeria', 'KE': 'Kenya', 'PK': 'Pakistan', 'BD': 'Bangladesh',
    'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'CZ': 'Czech Republic',
    'RO': 'Romania', 'HU': 'Hungary', 'GR': 'Greece', 'PT': 'Portugal',
    'DK': 'Denmark', 'FI': 'Finland', 'NO': 'Norway', 'IE': 'Ireland',
    'NZ': 'New Zealand', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru'
  }

  async function loadThreatSamples() {
    try {
      // Load last 24 hours of blocked samples (before anonymization)
      const { data, error } = await supabase
        .from('threat_intelligence_samples')
        .select('*')
        .eq('blocked', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setSamples(data || [])

      // Calculate pattern frequency
      const patternMap = new Map<string, number>()
      const countryMap = new Map<string, number>()
      let totalBlocks = 0
      let novelAttacks = 0

      data?.forEach(sample => {
        totalBlocks++

        if (sample.pattern_detected && sample.pattern_detected.length > 0) {
          sample.pattern_detected.forEach((pattern: string) => {
            patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1)
          })
        } else if (!sample.is_anonymized) {
          // Novel attack: AI validation triggered but no pattern match
          novelAttacks++
        }

        // Count by country
        const countryCode = (sample as any).ip_country
        if (countryCode) {
          countryMap.set(countryCode, (countryMap.get(countryCode) || 0) + 1)
        }
      })

      setNovelCount(novelAttacks)

      // Convert pattern counts to sorted array
      const counts: PatternCount[] = Array.from(patternMap.entries())
        .map(([pattern, count]) => ({
          pattern,
          count,
          percentage: totalBlocks > 0 ? (count / totalBlocks) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setPatternCounts(counts)

      // Convert country counts to sorted array
      const countries: CountryCount[] = Array.from(countryMap.entries())
        .map(([country_code, count]) => ({
          country_code,
          country_name: countryNames[country_code] || country_code,
          count,
          percentage: totalBlocks > 0 ? (count / totalBlocks) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setCountryCounts(countries)

    } catch (error) {
      console.error('Failed to load threat samples:', error)
    }
  }

  function exportToCSV() {
    const headers = ['Timestamp', 'Prompt (first 200 chars)', 'Pattern', 'AI Reasoning', 'IP Hash', 'Tier', 'Anonymized']
    const rows = filteredSamples.map(s => [
      new Date(s.created_at).toISOString(),
      s.prompt_text ? s.prompt_text.substring(0, 200).replace(/,/g, ';') : '[anonymized]',
      s.pattern_detected.join(';'),
      s.ai_reasoning ? s.ai_reasoning.substring(0, 200).replace(/,/g, ';') : '',
      s.client_ip_hash,
      s.user_tier,
      s.is_anonymized ? 'yes' : 'no'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threat-intelligence-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const uniquePatterns = Array.from(new Set(samples.flatMap(s => s.pattern_detected)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        usage={usage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Threat Intelligence Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time view of blocked attacks (last 24 hours before anonymization)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
              </button>
              <button
                onClick={loadThreatSamples}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Now
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Blocks (24h)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{samples.length}</p>
              </div>
              <Shield className="h-12 w-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pattern Detected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {samples.filter(s => s.pattern_detected.length > 0).length}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500 opacity-80" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {((samples.filter(s => s.pattern_detected.length > 0).length / samples.length) * 100 || 0).toFixed(1)}% of blocks
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novel Attacks</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{novelCount}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-orange-500 opacity-80" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              No pattern match, AI only
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique IPs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(samples.map(s => s.client_ip_hash)).size}
                </p>
              </div>
              <Globe className="h-12 w-12 text-purple-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Pattern Frequency Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Top 10 Attack Patterns (Last 24h)
          </h2>
          <div className="space-y-3">
            {patternCounts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pattern data available</p>
            ) : (
              patternCounts.map((item, idx) => (
                <div key={item.pattern} className="flex items-center gap-3">
                  <div className="w-8 text-right text-sm font-medium text-gray-600">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.pattern}</span>
                      <span className="text-sm text-gray-600">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                Search prompts, reasoning, or IP hash
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Filter by Pattern
              </label>
              <select
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Patterns</option>
                {uniquePatterns.map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredSamples.length} of {samples.length} samples
            </p>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Blocked Prompts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Real-Time Blocked Prompts</h2>
            <p className="text-sm text-gray-600 mt-1">
              {novelCount > 0 && (
                <span className="text-orange-600 font-medium">
                  ⚠️ {novelCount} novel attacks detected (no pattern match)
                </span>
              )}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prompt (first 200 chars)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pattern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Reasoning
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSamples.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No blocked prompts in the last 24 hours
                    </td>
                  </tr>
                ) : (
                  filteredSamples.map((sample) => (
                    <tr key={sample.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(sample.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                        <div className="truncate">
                          {sample.is_anonymized ? (
                            <span className="text-gray-400 italic">[anonymized after 24h]</span>
                          ) : (
                            sample.prompt_text?.substring(0, 200) || '[no prompt]'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sample.pattern_detected.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sample.pattern_detected.map((pattern, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded"
                              >
                                {pattern}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                            NOVEL (AI only)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate">
                          {sample.ai_reasoning || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {sample.client_ip_hash.substring(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          sample.user_tier === 'pro' ? 'bg-purple-100 text-purple-800' :
                          sample.user_tier === 'business' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sample.user_tier}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Threat Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Top 10 Attacking Countries (Last 24h)
          </h2>
          <div className="space-y-3">
            {countryCounts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No geographic data available</p>
                <p className="text-sm text-gray-500 mt-2">
                  Country codes are extracted from IP geolocation
                </p>
              </div>
            ) : (
              countryCounts.map((item, idx) => (
                <div key={item.country_code} className="flex items-center gap-3">
                  <div className="w-8 text-right text-sm font-medium text-gray-600">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.country_code}</span>
                        {item.country_name}
                      </span>
                      <span className="text-sm text-gray-600">{item.count} attacks ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {countryCounts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Geographic data based on IP geolocation • {new Set(samples.map((s: any) => s.ip_country).filter(Boolean)).size} unique countries detected
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
