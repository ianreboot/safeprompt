'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Plus, Trash2, Search, Edit2, Save, X, Shield } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Admin access controlled via middleware and role field

interface BlacklistEntry {
  ip: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string | null
  added_by: string
  added_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
  added_by_email?: string
}

const SEVERITY_COLORS = {
  low: 'text-yellow-400 bg-yellow-900/50',
  medium: 'text-orange-400 bg-orange-900/50',
  high: 'text-red-400 bg-red-900/50',
  critical: 'text-purple-400 bg-purple-900/50'
}

const SEVERITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
}

export default function BlacklistManagement() {
  const [user, setUser] = useState<any>(null)
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)

  // Add form state
  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newSource, setNewSource] = useState('')
  const [newExpires, setNewExpires] = useState('')
  const [addError, setAddError] = useState('')

  // Edit form state
  const [editReason, setEditReason] = useState('')
  const [editSeverity, setEditSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [editSource, setEditSource] = useState('')
  const [editExpires, setEditExpires] = useState('')

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
      loadBlacklist()
    }
  }, [user])

  useEffect(() => {
    // Filter entries based on search and severity
    let filtered = entries

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.ip.toLowerCase().includes(query) ||
        e.reason.toLowerCase().includes(query) ||
        e.source?.toLowerCase().includes(query) ||
        e.added_by_email?.toLowerCase().includes(query)
      )
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(e => e.severity === filterSeverity)
    }

    setFilteredEntries(filtered)
  }, [searchQuery, filterSeverity, entries])

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Check role (middleware already protected this route, but double-check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()


      if (!session?.user || profile?.role !== 'admin') {
        window.location.href = '/login'
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadBlacklist() {
    try {
      setLoading(true)

      // Load blacklist entries with user info
      const { data, error } = await supabase
        .from('ip_blacklist')
        .select(`
          *,
          added_by_profile:profiles!ip_blacklist_added_by_fkey(email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map the joined data
      const entriesWithEmail = data.map((entry: any) => ({
        ...entry,
        added_by_email: entry.added_by_profile?.email || 'Unknown'
      }))

      setEntries(entriesWithEmail)
      setFilteredEntries(entriesWithEmail)
    } catch (error: any) {
      console.error('Error loading blacklist:', error)
      alert(`Failed to load blacklist: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addToBlacklist() {
    try {
      setAddError('')

      // Validate IP format (basic check)
      if (!newIp || !newIp.match(/^[\d.:a-f]+$/i)) {
        setAddError('Invalid IP address format')
        return
      }

      if (!newReason.trim()) {
        setAddError('Reason is required')
        return
      }

      const { error } = await supabase
        .from('ip_blacklist')
        .insert({
          ip: newIp,
          reason: newReason,
          severity: newSeverity,
          source: newSource || null,
          added_by: user.id,
          expires_at: newExpires || null
        })

      if (error) throw error

      // Log admin action
      await supabase.from('ip_admin_actions').insert({
        action_type: 'blacklist_add',
        ip: newIp,
        admin_user_id: user.id,
        reason: newReason,
        after_state: { ip: newIp, reason: newReason, severity: newSeverity, source: newSource, expires_at: newExpires || null }
      })

      setShowAddModal(false)
      setNewIp('')
      setNewReason('')
      setNewSeverity('medium')
      setNewSource('')
      setNewExpires('')
      await loadBlacklist()
    } catch (error: any) {
      setAddError(error.message)
    }
  }

  async function removeFromBlacklist(ip: string, reason: string) {
    if (!confirm(`Remove ${ip} from blacklist? This action will be logged.`)) {
      return
    }

    try {
      // Get current state for audit
      const { data: current } = await supabase
        .from('ip_blacklist')
        .select('*')
        .eq('ip', ip)
        .single()

      const { error } = await supabase
        .from('ip_blacklist')
        .delete()
        .eq('ip', ip)

      if (error) throw error

      // Log admin action
      await supabase.from('ip_admin_actions').insert({
        action_type: 'blacklist_remove',
        ip: ip,
        admin_user_id: user.id,
        reason: `Removed from blacklist: ${reason}`,
        before_state: current
      })

      await loadBlacklist()
    } catch (error: any) {
      alert(`Failed to remove from blacklist: ${error.message}`)
    }
  }

  function startEditing(entry: BlacklistEntry) {
    setEditingEntry(entry.ip)
    setEditReason(entry.reason)
    setEditSeverity(entry.severity)
    setEditSource(entry.source || '')
    setEditExpires(entry.expires_at ? entry.expires_at.split('T')[0] : '')
  }

  function cancelEditing() {
    setEditingEntry(null)
    setEditReason('')
    setEditSeverity('medium')
    setEditSource('')
    setEditExpires('')
  }

  async function saveEdits(ip: string) {
    try {
      // Get current state for audit
      const { data: before } = await supabase
        .from('ip_blacklist')
        .select('*')
        .eq('ip', ip)
        .single()

      const { error } = await supabase
        .from('ip_blacklist')
        .update({
          reason: editReason,
          severity: editSeverity,
          source: editSource || null,
          expires_at: editExpires || null,
          updated_at: new Date().toISOString()
        })
        .eq('ip', ip)

      if (error) throw error

      // Log admin action
      await supabase.from('ip_admin_actions').insert({
        action_type: 'blacklist_add', // Using add for updates too
        ip: ip,
        admin_user_id: user.id,
        reason: `Updated blacklist entry`,
        before_state: before,
        after_state: { reason: editReason, severity: editSeverity, source: editSource, expires_at: editExpires || null }
      })

      setEditingEntry(null)
      await loadBlacklist()
    } catch (error: any) {
      alert(`Failed to update: ${error.message}`)
    }
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400"></div>
      </div>
    )
  }

  const activeEntries = filteredEntries.filter(e => !isExpired(e.expires_at))
  const expiredEntries = filteredEntries.filter(e => isExpired(e.expires_at))
  const criticalCount = activeEntries.filter(e => e.severity === 'critical').length
  const highCount = activeEntries.filter(e => e.severity === 'high').length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header user={user} usage={usage} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <h1 className="text-3xl font-bold">IP Blacklist Management</h1>
          </div>
          <p className="text-gray-400">
            Manage system-wide IP blacklist. Blacklisted IPs are always blocked, regardless of user tier settings.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Active Blacklist</span>
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{activeEntries.length}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Critical Threats</span>
              <AlertTriangle className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{criticalCount}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">High Severity</span>
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{highCount}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Expired</span>
              <X className="h-5 w-5 text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-gray-500">{expiredEntries.length}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by IP, reason, source, or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:border-red-500 focus:outline-none"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add to Blacklist
          </button>
        </div>

        {/* Blacklist Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No blacklist entries found
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.ip}
                      className={isExpired(entry.expires_at) ? 'opacity-50 bg-gray-800/50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {entry.ip}
                        {isExpired(entry.expires_at) && (
                          <span className="ml-2 px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                            EXPIRED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingEntry === entry.ip ? (
                          <select
                            value={editSeverity}
                            onChange={(e) => setEditSeverity(e.target.value as any)}
                            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_COLORS[entry.severity]}`}>
                            {SEVERITY_LABELS[entry.severity]}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingEntry === entry.ip ? (
                          <input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm">{entry.reason}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingEntry === entry.ip ? (
                          <input
                            type="text"
                            value={editSource}
                            onChange={(e) => setEditSource(e.target.value)}
                            placeholder="Optional"
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-400">{entry.source || '—'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {entry.added_by_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingEntry === entry.ip ? (
                          <input
                            type="date"
                            value={editExpires}
                            onChange={(e) => setEditExpires(e.target.value)}
                            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                          />
                        ) : entry.expires_at ? (
                          <span className={isExpired(entry.expires_at) ? 'text-gray-500' : 'text-yellow-400'}>
                            {formatDate(entry.expires_at)}
                          </span>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingEntry === entry.ip ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdits(entry.ip)}
                              className="p-1 text-green-400 hover:text-green-300"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-gray-400 hover:text-gray-300"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(entry)}
                              className="p-1 text-blue-400 hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeFromBlacklist(entry.ip, entry.reason)}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Add IP to Blacklist</h2>

            {addError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-400 text-sm">
                {addError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">IP Address *</label>
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="192.168.1.1 or 2001:db8::1"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-red-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">IPv4 or IPv6 format</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Severity *</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-red-500 focus:outline-none"
                >
                  <option value="low">Low - Minor nuisance</option>
                  <option value="medium">Medium - Repeated attempts</option>
                  <option value="high">High - Active attacker</option>
                  <option value="critical">Critical - Known threat actor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g., Repeated injection attempts, Known botnet, Threat feed match"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-red-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Required for audit trail</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Source (Optional)</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g., AbuseIPDB, Incident #123, Manual analysis"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-red-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Threat feed name, incident reference, etc.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expires On (Optional)</label>
                <input
                  type="date"
                  value={newExpires}
                  onChange={(e) => setNewExpires(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-red-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for permanent blacklist</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addToBlacklist}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
              >
                Add to Blacklist
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewIp('')
                  setNewReason('')
                  setNewSeverity('medium')
                  setNewSource('')
                  setNewExpires('')
                  setAddError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
