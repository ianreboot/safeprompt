'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Search, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Edit, Save, X } from 'lucide-react'

interface IPReputation {
  ip_hash: string
  total_samples: number
  blocked_samples: number
  block_rate: number
  reputation_score: number
  auto_block: boolean
  primary_attack_types: string[]
  first_seen: string
  last_seen: string
}

export default function IPReputationManager() {
  const [ipReputations, setIpReputations] = useState<IPReputation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingIp, setEditingIp] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<number>(0)
  const [editAutoBlock, setEditAutoBlock] = useState(false)
  const pageSize = 20

  useEffect(() => {
    fetchIPReputations()
  }, [page, searchQuery])

  async function fetchIPReputations() {
    setLoading(true)
    try {
      let query = supabase
        .from('ip_reputation')
        .select('*', { count: 'exact' })

      if (searchQuery) {
        query = query.ilike('ip_hash', `%${searchQuery}%`)
      }

      const { data, error, count } = await query
        .order('block_rate', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      setIpReputations(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error: any) {
      console.error('Error fetching IP reputations:', error)
    } finally {
      setLoading(false)
    }
  }

  function startEditing(ip: IPReputation) {
    setEditingIp(ip.ip_hash)
    setEditScore(ip.reputation_score)
    setEditAutoBlock(ip.auto_block)
  }

  function cancelEditing() {
    setEditingIp(null)
    setEditScore(0)
    setEditAutoBlock(false)
  }

  async function saveEdits(ipHash: string) {
    try {
      const { error } = await supabase
        .from('ip_reputation')
        .update({
          reputation_score: editScore,
          auto_block: editAutoBlock
        })
        .eq('ip_hash', ipHash)

      if (error) throw error

      await fetchIPReputations()
      setEditingIp(null)
    } catch (error: any) {
      console.error('Error updating IP reputation:', error)
      alert(`Failed to update: ${error.message}`)
    }
  }

  function getReputationColor(score: number): string {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  function getReputationBadge(score: number): string {
    if (score >= 0.8) return 'bg-green-900/50 text-green-400'
    if (score >= 0.5) return 'bg-yellow-900/50 text-yellow-400'
    return 'bg-red-900/50 text-red-400'
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          IP Reputation Management
        </h2>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search IP hash..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-4 py-2 bg-black border border-gray-800 rounded text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading IP reputations...</div>
      ) : ipReputations.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No IP reputation data found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-3">IP Hash</th>
                  <th className="pb-3">Samples</th>
                  <th className="pb-3">Block Rate</th>
                  <th className="pb-3">Reputation</th>
                  <th className="pb-3">Auto-Block</th>
                  <th className="pb-3">Attack Types</th>
                  <th className="pb-3">Last Seen</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ipReputations.map((ip) => (
                  <tr key={ip.ip_hash} className="border-b border-gray-800/50">
                    <td className="py-3">
                      <code className="text-xs bg-black/50 px-2 py-1 rounded">
                        {ip.ip_hash.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="py-3">
                      <div className="text-xs text-gray-400">
                        {ip.blocked_samples} / {ip.total_samples}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              ip.block_rate >= 0.7 ? 'bg-red-500' :
                              ip.block_rate >= 0.4 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, ip.block_rate * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs">{(ip.block_rate * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {editingIp === ip.ip_hash ? (
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={editScore}
                          onChange={(e) => setEditScore(parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 bg-black border border-gray-800 rounded text-xs focus:outline-none focus:border-primary"
                        />
                      ) : (
                        <span className={`text-sm font-semibold ${getReputationColor(ip.reputation_score)}`}>
                          {ip.reputation_score.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingIp === ip.ip_hash ? (
                        <input
                          type="checkbox"
                          checked={editAutoBlock}
                          onChange={(e) => setEditAutoBlock(e.target.checked)}
                          className="rounded bg-black border-gray-800 text-primary focus:ring-primary"
                        />
                      ) : ip.auto_block ? (
                        <div className="flex items-center gap-1.5 text-xs text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <CheckCircle className="w-3 h-3" />
                          <span>Disabled</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {ip.primary_attack_types?.slice(0, 2).map((type, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                        {ip.primary_attack_types?.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                            +{ip.primary_attack_types.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-400">
                      {new Date(ip.last_seen).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {editingIp === ip.ip_hash ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdits(ip.ip_hash)}
                            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-1 text-gray-400 hover:text-white text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(ip)}
                          className="flex items-center gap-1 text-primary hover:text-blue-400 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-black border border-gray-800 rounded text-sm hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 bg-black border border-gray-800 rounded text-sm hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">
          <strong className="text-blue-400">Auto-Block Criteria:</strong> IPs with block rate &gt;70% and 10+
          samples are automatically flagged for blocking. Reputation score is calculated as (1 - block_rate).
          Lower scores = worse reputation.
        </p>
      </div>
    </div>
  )
}
