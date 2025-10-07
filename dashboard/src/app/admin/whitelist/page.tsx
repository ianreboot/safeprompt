'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Plus, Trash2, Search, Calendar, User, CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Simple admin auth - in production, use proper role-based access
const ADMIN_EMAILS = ['ian.ho@rebootmedia.net']

interface WhitelistEntry {
  ip: string
  reason: string
  added_by: string
  added_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
  added_by_email?: string
}

export default function WhitelistManagement() {
  const [user, setUser] = useState<any>(null)
  const [entries, setEntries] = useState<WhitelistEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<WhitelistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)

  // Add form state
  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newExpires, setNewExpires] = useState('')
  const [addError, setAddError] = useState('')

  // Edit form state
  const [editReason, setEditReason] = useState('')
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
      loadWhitelist()
    }
  }, [user])

  useEffect(() => {
    // Filter entries based on search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredEntries(
        entries.filter(e =>
          e.ip.toLowerCase().includes(query) ||
          e.reason.toLowerCase().includes(query) ||
          e.added_by_email?.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredEntries(entries)
    }
  }, [searchQuery, entries])

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user || !ADMIN_EMAILS.includes(session.user.email!)) {
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

  async function loadWhitelist() {
    try {
      setLoading(true)

      // Load whitelist entries with user info
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select(`
          *,
          added_by_profile:profiles!ip_whitelist_added_by_fkey(email)
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
      console.error('Error loading whitelist:', error)
      alert(`Failed to load whitelist: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addToWhitelist() {
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
        .from('ip_whitelist')
        .insert({
          ip: newIp,
          reason: newReason,
          added_by: user.id,
          expires_at: newExpires || null
        })

      if (error) throw error

      // Log admin action
      await supabase.from('ip_admin_actions').insert({
        action_type: 'whitelist_add',
        ip: newIp,
        admin_user_id: user.id,
        reason: newReason,
        after_state: { ip: newIp, reason: newReason, expires_at: newExpires || null }
      })

      setShowAddModal(false)
      setNewIp('')
      setNewReason('')
      setNewExpires('')
      await loadWhitelist()
    } catch (error: any) {
      setAddError(error.message)
    }
  }

  async function removeFromWhitelist(ip: string, reason: string) {
    if (!confirm(`Remove ${ip} from whitelist? This action will be logged.`)) {
      return
    }

    try {
      // Get current state for audit
      const { data: current } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('ip', ip)
        .single()

      const { error } = await supabase
        .from('ip_whitelist')
        .delete()
        .eq('ip', ip)

      if (error) throw error

      // Log admin action
      await supabase.from('ip_admin_actions').insert({
        action_type: 'whitelist_remove',
        ip: ip,
        admin_user_id: user.id,
        reason: `Removed from whitelist: ${reason}`,
        before_state: current
      })

      await loadWhitelist()
    } catch (error: any) {
      alert(`Failed to remove from whitelist: ${error.message}`)
    }
  }

  function startEditing(entry: WhitelistEntry) {
    setEditingEntry(entry.ip)
    setEditReason(entry.reason)
    setEditExpires(entry.expires_at ? entry.expires_at.split('T')[0] : '')
  }

  function cancelEditing() {
    setEditingEntry(null)
    setEditReason('')
    setEditExpires('')
  }

  async function saveEdits(ip: string) {
    try {
      // Get current state for audit
      const { data: before } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('ip', ip)
        .single()

      const { error } = await supabase
        .from('ip_whitelist')
        .update({
          reason: editReason,
          expires_at: editExpires || null,
          updated_at: new Date().toISOString()
        })
        .eq('ip', ip)

      if (error) throw error

      // Log admin action
      await supabase.from('ip_admin_actions').insert({
        action_type: 'whitelist_add', // Using add for updates too
        ip: ip,
        admin_user_id: user.id,
        reason: `Updated whitelist entry`,
        before_state: before,
        after_state: { reason: editReason, expires_at: editExpires || null }
      })

      setEditingEntry(null)
      await loadWhitelist()
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
      </div>
    )
  }

  const activeEntries = filteredEntries.filter(e => !isExpired(e.expires_at))
  const expiredEntries = filteredEntries.filter(e => isExpired(e.expires_at))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header user={user} usage={usage} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl font-bold">IP Whitelist Management</h1>
          </div>
          <p className="text-gray-400">
            Manage system-wide IP whitelist. Whitelisted IPs are never blocked, regardless of reputation score.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Active Whitelist</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{activeEntries.length}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Expired Entries</span>
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{expiredEntries.length}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Entries</span>
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400">{entries.length}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by IP, reason, or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:border-green-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add to Whitelist
          </button>
        </div>

        {/* Whitelist Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Added At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No whitelist entries found
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.ip}
                      className={isExpired(entry.expires_at) ? 'opacity-50 bg-red-900/10' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {entry.ip}
                        {isExpired(entry.expires_at) && (
                          <span className="ml-2 px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded">
                            EXPIRED
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {entry.added_by_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(entry.added_at)}
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
                          <span className={isExpired(entry.expires_at) ? 'text-red-400' : 'text-yellow-400'}>
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
                              onClick={() => removeFromWhitelist(entry.ip, entry.reason)}
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
            <h2 className="text-xl font-bold mb-4">Add IP to Whitelist</h2>

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
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-green-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">IPv4 or IPv6 format</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g., Internal testing server, CI/CD pipeline, trusted partner"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-green-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Required for audit trail</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expires On (Optional)</label>
                <input
                  type="date"
                  value={newExpires}
                  onChange={(e) => setNewExpires(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-green-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for permanent whitelist</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addToWhitelist}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
              >
                Add to Whitelist
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewIp('')
                  setNewReason('')
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
