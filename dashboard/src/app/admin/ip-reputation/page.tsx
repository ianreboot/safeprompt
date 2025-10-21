'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, AlertCircle, RefreshCw, Search, TrendingDown } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const ADMIN_EMAILS = ['ian.ho@rebootmedia.net']

interface IPReputation {
  id: string
  ip_hash: string
  reputation_score: number
  total_requests: number
  blocked_requests: number
  block_rate: number
  sample_count: number
  auto_block: boolean
  first_seen: string
  last_seen: string
}

export default function IPReputationManagement() {
  const [user, setUser] = useState<any>(null)
  const [ips, setIps] = useState<IPReputation[]>([])
  const [filteredIps, setFilteredIps] = useState<IPReputation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'block_rate' | 'reputation_score' | 'sample_count'>('block_rate')

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
      loadIPReputation()
    }
  }, [user])

  useEffect(() => {
    let filtered = ips
    if (searchQuery) {
      filtered = filtered.filter(ip => ip.ip_hash.includes(searchQuery))
    }

    // Sort by selected criteria
    filtered.sort((a, b) => {
      if (sortBy === 'block_rate') return b.block_rate - a.block_rate
      if (sortBy === 'reputation_score') return b.reputation_score - a.reputation_score
      return b.sample_count - a.sample_count
    })

    setFilteredIps(filtered)
  }, [searchQuery, sortBy, ips])

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
      console.error('Error:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  async function loadIPReputation() {
    try {
      const { data, error } = await supabase
        .from('ip_reputation')
        .select('*')
        .order('block_rate', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading IP reputation:', error)
        return
      }

      setIps(data || [])
    } catch (error) {
      console.error('Failed to load IP reputation:', error)
    }
  }

  async function toggleAutoBlock(ipHash: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('ip_reputation')
        .update({ auto_block: !currentState })
        .eq('ip_hash', ipHash)

      if (error) throw error

      // Update local state
      setIps(ips.map(ip =>
        ip.ip_hash === ipHash ? { ...ip, auto_block: !currentState } : ip
      ))
    } catch (error) {
      console.error('Error toggling auto-block:', error)
      alert('Failed to update auto-block setting')
    }
  }

  const stats = {
    total: ips.length,
    autoBlocked: ips.filter(ip => ip.auto_block).length,
    highRisk: ips.filter(ip => ip.block_rate > 0.8).length,
    avgBlockRate: ips.length > 0 ? (ips.reduce((sum, ip) => sum + ip.block_rate, 0) / ips.length * 100).toFixed(1) : '0'
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
                  <Shield className="w-8 h-8 text-red-400" />
                  <h1 className="text-3xl font-bold text-white">IP Reputation Management</h1>
                </div>
                <p className="text-gray-300">Monitor and manage IP reputation auto-blocking</p>
              </div>
              <button
                onClick={loadIPReputation}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">Total IPs Tracked</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">Auto-Blocked</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.autoBlocked}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">High Risk (80%+)</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{stats.highRisk}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">Avg Block Rate</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.avgBlockRate}%</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Search IP Hash</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter IP hash..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="block_rate">Block Rate (highest first)</option>
                  <option value="reputation_score">Reputation Score (worst first)</option>
                  <option value="sample_count">Sample Count (most first)</option>
                </select>
              </div>
            </div>
          </div>

          {/* IP Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">IP Hash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Block Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reputation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Samples</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">First/Last Seen</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Auto-Block</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredIps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No IP reputation data found
                      </td>
                    </tr>
                  ) : (
                    filteredIps.map((ip) => (
                      <tr key={ip.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                          {ip.ip_hash.substring(0, 24)}...
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ip.block_rate > 0.8 ? 'bg-red-500/20 text-red-300' :
                            ip.block_rate > 0.5 ? 'bg-orange-500/20 text-orange-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {(ip.block_rate * 100).toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            ({ip.blocked_requests}/{ip.total_requests})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {ip.reputation_score.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {ip.sample_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-xs">
                          {new Date(ip.first_seen).toLocaleDateString()}<br />
                          {new Date(ip.last_seen).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {ip.auto_block ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                              BLOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                              ALLOWED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => toggleAutoBlock(ip.ip_hash, ip.auto_block)}
                            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                          >
                            {ip.auto_block ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
