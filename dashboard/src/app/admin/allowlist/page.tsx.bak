'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const ADMIN_EMAILS = ['ian.ho@rebootmedia.net']

interface AllowlistEntry {
  id: string
  ip_address: string
  ip_hash: string
  description: string
  purpose: string
  active: boolean
  expires_at: string | null
  created_at: string
}

export default function IPAllowlistManagement() {
  const [user, setUser] = useState<any>(null)
  const [entries, setEntries] = useState<AllowlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEntry, setNewEntry] = useState({
    ip_address: '',
    description: '',
    purpose: 'testing',
    expires_at: ''
  })
  const [error, setError] = useState('')

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
      loadAllowlist()
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

  async function loadAllowlist() {
    try {
      const { data, error } = await supabase
        .from('ip_allowlist')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Failed to load allowlist:', error)
    }
  }

  async function addEntry() {
    try {
      setError('')

      // Validate IP address format
      if (!newEntry.ip_address.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        setError('Invalid IP address format')
        return
      }

      // Hash the IP
      const encoder = new TextEncoder()
      const data = encoder.encode(newEntry.ip_address)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const ip_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const { error: insertError } = await supabase
        .from('ip_allowlist')
        .insert({
          ip_address: newEntry.ip_address,
          ip_hash,
          description: newEntry.description,
          purpose: newEntry.purpose,
          expires_at: newEntry.expires_at || null,
          created_by: user.id,
          active: true
        })

      if (insertError) throw insertError

      setShowAddModal(false)
      setNewEntry({ ip_address: '', description: '', purpose: 'testing', expires_at: '' })
      loadAllowlist()
    } catch (error: any) {
      console.error('Error adding entry:', error)
      setError(error.message || 'Failed to add entry')
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Are you sure you want to remove this IP from the allowlist?')) return

    try {
      const { error } = await supabase
        .from('ip_allowlist')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadAllowlist()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry')
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('ip_allowlist')
        .update({ active: !currentState })
        .eq('id', id)

      if (error) throw error
      setEntries(entries.map(e => e.id === id ? { ...e, active: !currentState } : e))
    } catch (error) {
      console.error('Error toggling active state:', error)
      alert('Failed to update entry')
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
                  <Shield className="w-8 h-8 text-green-400" />
                  <h1 className="text-3xl font-bold text-white">IP Allowlist Management</h1>
                </div>
                <p className="text-gray-300">Manage IPs that should never be blocked (CI/CD, testing, internal systems)</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadAllowlist}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add IP
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">Total Allowlisted</p>
              <p className="text-3xl font-bold text-white mt-1">{entries.length}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{entries.filter(e => e.active).length}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400">Expired/Inactive</p>
              <p className="text-3xl font-bold text-gray-400 mt-1">{entries.filter(e => !e.active).length}</p>
            </div>
          </div>

          {/* Allowlist Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No allowlist entries. Add IPs that should never be blocked.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                          {entry.ip_address}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                            {entry.purpose}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {entry.active ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                              INACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-xs">
                          {entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleActive(entry.id, entry.active)}
                              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs"
                            >
                              {entry.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
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

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Add IP to Allowlist</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">IP Address *</label>
                <input
                  type="text"
                  value={newEntry.ip_address}
                  onChange={(e) => setNewEntry({ ...newEntry, ip_address: e.target.value })}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                <input
                  type="text"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="GitHub Actions CI/CD"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Purpose *</label>
                <select
                  value={newEntry.purpose}
                  onChange={(e) => setNewEntry({ ...newEntry, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="testing">Testing</option>
                  <option value="ci_cd">CI/CD</option>
                  <option value="internal">Internal</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Expires At (optional)</label>
                <input
                  type="date"
                  value={newEntry.expires_at}
                  onChange={(e) => setNewEntry({ ...newEntry, expires_at: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                Add to Allowlist
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
