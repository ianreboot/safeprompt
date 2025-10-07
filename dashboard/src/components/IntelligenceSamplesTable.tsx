'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Brain, Search, ChevronLeft, ChevronRight, AlertTriangle, Shield } from 'lucide-react'

interface IntelligenceSample {
  id: string
  prompt_text: string | null
  prompt_hash: string
  ip_hash: string
  threat_type: string
  confidence: number
  created_at: string
  anonymized_at: string | null
  user_id: string | null
}

export default function IntelligenceSamplesTable() {
  const [samples, setSamples] = useState<IntelligenceSample[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAnonymizedOnly, setShowAnonymizedOnly] = useState(false)
  const pageSize = 20

  useEffect(() => {
    fetchSamples()
  }, [page, searchQuery, showAnonymizedOnly])

  async function fetchSamples() {
    setLoading(true)
    try {
      let query = supabase
        .from('intelligence_samples')
        .select('*', { count: 'exact' })

      // Filter by anonymization status
      if (showAnonymizedOnly) {
        query = query.not('anonymized_at', 'is', null)
      } else {
        query = query.is('anonymized_at', null) // Show only non-anonymized by default
      }

      // Search filter
      if (searchQuery) {
        query = query.or(`threat_type.ilike.%${searchQuery}%,prompt_hash.ilike.%${searchQuery}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      setSamples(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error: any) {
      console.error('Error fetching intelligence samples:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatThreatType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function getTimeRemaining(createdAt: string): string {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    const hoursRemaining = Math.max(0, 24 - hoursElapsed)

    if (hoursRemaining === 0) return 'Ready for anonymization'
    if (hoursRemaining < 1) return `${Math.round(hoursRemaining * 60)}m until anonymization`
    return `${Math.round(hoursRemaining)}h until anonymization`
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Intelligence Samples
        </h2>

        <div className="flex items-center gap-3">
          {/* Anonymization Filter Toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAnonymizedOnly}
              onChange={(e) => {
                setShowAnonymizedOnly(e.target.checked)
                setPage(1)
              }}
              className="rounded bg-black border-gray-800 text-primary focus:ring-primary"
            />
            <span className="text-gray-400">Show anonymized</span>
          </label>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search threat type or hash..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-4 py-2 bg-black border border-gray-800 rounded text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading samples...</div>
      ) : samples.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          {showAnonymizedOnly ? 'No anonymized samples found' : 'No active intelligence samples'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-3">Threat Type</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Prompt</th>
                  <th className="pb-3">Hash</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample) => (
                  <tr key={sample.id} className="border-b border-gray-800/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="font-medium">{formatThreatType(sample.threat_type)}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sample.confidence >= 0.9
                          ? 'bg-red-900/50 text-red-400'
                          : sample.confidence >= 0.7
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {(sample.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 max-w-xs">
                      {sample.prompt_text ? (
                        <div className="font-mono text-xs bg-black/50 px-2 py-1 rounded border border-gray-800 truncate">
                          {sample.prompt_text.substring(0, 60)}
                          {sample.prompt_text.length > 60 && '...'}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic text-xs">Anonymized</span>
                      )}
                    </td>
                    <td className="py-3">
                      <code className="text-xs text-gray-400">{sample.prompt_hash.substring(0, 12)}...</code>
                    </td>
                    <td className="py-3">
                      {sample.anonymized_at ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                          <Shield className="w-3 h-3" />
                          <span>Anonymized</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {getTimeRemaining(sample.created_at)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-xs text-gray-400">
                      {new Date(sample.created_at).toLocaleDateString()}<br />
                      {new Date(sample.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <strong className="text-blue-400">Privacy Notice:</strong> Prompt text is automatically deleted after
          24 hours. Only cryptographic hashes remain for network defense. Currently showing{' '}
          {showAnonymizedOnly ? 'anonymized' : 'active'} samples.
        </p>
      </div>
    </div>
  )
}
