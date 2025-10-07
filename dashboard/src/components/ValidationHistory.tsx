'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Search, ChevronLeft, ChevronRight, Download, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'

interface ValidationRecord {
  id: string
  created_at: string
  prompt_text: string | null
  is_safe: boolean
  block_reason: string | null
  pattern_detected: string[] | null
  ai_reasoning: string | null
  confidence_score: number | null
  response_time_ms: number
  session_token: string | null
}

export default function ValidationHistory({ userId }: { userId: string }) {
  const [validations, setValidations] = useState<ValidationRecord[]>([])
  const [filteredValidations, setFilteredValidations] = useState<ValidationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'unsafe'>('all')
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d')
  const pageSize = 20

  useEffect(() => {
    loadValidations()
  }, [page, dateRange])

  useEffect(() => {
    applyFilters()
  }, [validations, searchQuery, filterStatus])

  async function loadValidations() {
    try {
      setLoading(true)

      // Calculate date cutoff
      let cutoffDate = null
      if (dateRange !== 'all') {
        const hours = dateRange === '24h' ? 24 : dateRange === '7d' ? 24 * 7 : 24 * 30
        cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      }

      // Load validation records from threat_intelligence_samples
      let query = supabase
        .from('threat_intelligence_samples')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      if (cutoffDate) {
        query = query.gte('created_at', cutoffDate)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      setValidations(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error: any) {
      console.error('Error loading validations:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = validations

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.prompt_text?.toLowerCase().includes(query) ||
        v.block_reason?.toLowerCase().includes(query) ||
        v.ai_reasoning?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      const targetStatus = filterStatus === 'safe'
      filtered = filtered.filter(v => v.is_safe === targetStatus)
    }

    setFilteredValidations(filtered)
  }

  async function exportToCSV() {
    try {
      // Get all validations for export (not paginated)
      let cutoffDate = null
      if (dateRange !== 'all') {
        const hours = dateRange === '24h' ? 24 : dateRange === '7d' ? 24 * 7 : 24 * 30
        cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      }

      let query = supabase
        .from('threat_intelligence_samples')
        .select('*')
        .eq('user_id', userId)

      if (cutoffDate) {
        query = query.gte('created_at', cutoffDate)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Convert to CSV
      const headers = ['Timestamp', 'Status', 'Prompt', 'Reason', 'Patterns', 'Confidence', 'Response Time (ms)']
      const rows = (data || []).map(v => [
        new Date(v.created_at).toLocaleString(),
        v.is_safe ? 'SAFE' : 'UNSAFE',
        v.prompt_text?.replace(/"/g, '""') || 'N/A',
        v.block_reason?.replace(/"/g, '""') || 'N/A',
        v.pattern_detected?.join(', ') || 'N/A',
        v.confidence_score?.toFixed(2) || 'N/A',
        v.response_time_ms || 'N/A'
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `validation-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(`Failed to export: ${error.message}`)
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString()
  }

  function formatPrompt(prompt: string | null): string {
    if (!prompt) return 'N/A'
    return prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt
  }

  const stats = {
    total: validations.length,
    safe: validations.filter(v => v.is_safe).length,
    unsafe: validations.filter(v => !v.is_safe).length
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold">Validation History</h2>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 text-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Total Requests</span>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Safe</span>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.safe}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Blocked</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.unsafe}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search prompts, reasons, patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="all">All Status</option>
          <option value="safe">Safe Only</option>
          <option value="unsafe">Blocked Only</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prompt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredValidations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No validation records found
                  </td>
                </tr>
              ) : (
                filteredValidations.map((validation) => (
                  <tr key={validation.id} className="hover:bg-gray-900/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(validation.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {validation.is_safe ? (
                        <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs font-medium flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          SAFE
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-medium flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          BLOCKED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-md">
                        {validation.prompt_text ? (
                          <span className="text-gray-300">{formatPrompt(validation.prompt_text)}</span>
                        ) : (
                          <span className="text-gray-600 italic">Anonymized (>24h old)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs">
                        {validation.block_reason ? (
                          <span className="text-gray-400">{validation.block_reason}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {validation.confidence_score ? (
                        <span className={`font-mono ${validation.confidence_score > 0.8 ? 'text-green-400' : validation.confidence_score > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {(validation.confidence_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">
                      {validation.response_time_ms}ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 text-sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-sm">
        <p className="text-gray-300">
          <strong>Privacy:</strong> Prompt text is automatically anonymized after 24 hours.
          Older records show statistics only, with no identifiable content.
        </p>
      </div>
    </div>
  )
}
