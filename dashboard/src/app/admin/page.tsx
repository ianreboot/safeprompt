'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Users, Clock, CheckCircle, XCircle, Mail, Search, Activity, DollarSign, Eye } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import IntelligenceSamplesTable from '@/components/IntelligenceSamplesTable'
import IPReputationManager from '@/components/IPReputationManager'
import AdminIntelligenceTools from '@/components/AdminIntelligenceTools'
import JobMonitoring from '@/components/JobMonitoring'
import { logAdminAction, ADMIN_ACTIONS } from '@/lib/audit-log'

// Admin access controlled via middleware and role field

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, revenue: 0, totalApiCalls: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userLogs, setUserLogs] = useState<any[]>([])
  const [creditNotes, setCreditNotes] = useState('')

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
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(u =>
          u.email?.toLowerCase().includes(query) ||
          u.subscription_tier?.toLowerCase().includes(query) ||
          u.subscription_status?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, users])

  async function fetchData() {
    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message)
    }

    if (profilesData) {
      setUsers(profilesData)
      setFilteredUsers(profilesData)
    }

    // Fetch waitlist
    const { data: waitlistData } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (waitlistData) setWaitlist(waitlistData)

    // SECURITY: Fetch stats from server-side API to prevent manipulation
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const statsResponse = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'X-Requested-With': 'XMLHttpRequest' // CSRF protection
          }
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          console.error('Failed to fetch admin stats')
          // Fallback to empty stats
          setStats({
            totalUsers: 0,
            activeUsers: 0,
            revenue: 0,
            totalApiCalls: 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        revenue: 0,
        totalApiCalls: 0
      })
    }
  }

  async function viewUserDetails(userId: string) {
    const targetUser = users.find(u => u.id === userId)
    setSelectedUser(targetUser)

    // SECURITY: Audit log - admin viewing user details
    await logAdminAction({
      admin_id: user.id,
      admin_email: user.email,
      action: ADMIN_ACTIONS.VIEW_USER_DETAILS,
      target_user_id: userId,
      target_email: targetUser?.email,
      success: true
    })

    // Fetch user's API logs
    const { data: logs } = await supabase
      .from('api_logs')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (logs) setUserLogs(logs)
  }

  function closeUserModal() {
    setSelectedUser(null)
    setUserLogs([])
    setCreditNotes('')
  }

  async function saveCreditNotes() {
    if (!selectedUser || !creditNotes.trim()) return

    try {
      // In production, this would integrate with Stripe API to issue refunds/credits
      alert(`Credit/refund notes saved for ${selectedUser.email}:\n\n${creditNotes}\n\nIn production, this would trigger Stripe refund/credit.`)

      // TODO: Add actual Stripe integration
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      // await stripe.refunds.create({ charge: '...', amount: ... })

      // SECURITY: Audit log - credit/refund issued
      await logAdminAction({
        admin_id: user.id,
        admin_email: user.email,
        action: ADMIN_ACTIONS.CREDIT_APPLIED,
        target_user_id: selectedUser.id,
        target_email: selectedUser.email,
        details: { notes: creditNotes },
        success: true
      })

      setCreditNotes('')
      closeUserModal()
    } catch (error: any) {
      // SECURITY: Audit log - failed credit/refund
      await logAdminAction({
        admin_id: user.id,
        admin_email: user.email,
        action: ADMIN_ACTIONS.CREDIT_APPLIED,
        target_user_id: selectedUser.id,
        target_email: selectedUser.email,
        details: { notes: creditNotes },
        success: false,
        error_message: error.message
      })
      console.error('Failed to process credit/refund:', error)
      alert('Failed to process credit/refund. Please try again.')
    }
  }

  async function approveWaitlist(email: string) {
    try {
      // In production, this would send an approval email with signup link
      alert(`Approved ${email} - In production, this would send an email`)

      // Mark as approved in database
      await supabase
        .from('waitlist')
        .update({ approved_at: new Date().toISOString() })
        .eq('email', email)

      // SECURITY: Audit log - successful waitlist approval
      await logAdminAction({
        admin_id: user.id,
        admin_email: user.email,
        action: ADMIN_ACTIONS.APPROVE_WAITLIST,
        target_email: email,
        success: true
      })

      await fetchData()
    } catch (error: any) {
      // SECURITY: Audit log - failed waitlist approval
      await logAdminAction({
        admin_id: user.id,
        admin_email: user.email,
        action: ADMIN_ACTIONS.APPROVE_WAITLIST,
        target_email: email,
        success: false,
        error_message: error.message
      })
      console.error('Failed to approve waitlist:', error)
      alert('Failed to approve waitlist entry. Please try again.')
    }
  }

  async function suspendUser(userId: string) {
    if (!confirm('Are you sure you want to suspend this user? This will immediately log them out from all devices.')) return

    const targetUser = users.find(u => u.id === userId)

    try {
      // SECURITY: Call server-side API to suspend user and invalidate sessions
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/admin/suspend-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Suspension failed')
      }

      // SECURITY: Audit log - successful suspension
      await logAdminAction({
        admin_id: user.id,
        admin_email: user.email,
        action: ADMIN_ACTIONS.SUSPEND_USER,
        target_user_id: userId,
        target_email: targetUser?.email,
        success: true
      })

      await fetchData()
      alert('User suspended successfully. All active sessions have been invalidated.')
    } catch (error: any) {
      // SECURITY: Audit log - failed suspension
      await logAdminAction({
        admin_id: user.id,
        admin_email: user.email,
        action: ADMIN_ACTIONS.SUSPEND_USER,
        target_user_id: userId,
        target_email: targetUser?.email,
        success: false,
        error_message: error.message
      })
      console.error('Failed to suspend user:', error)
      alert('Failed to suspend user: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header user={user} usage={usage} />

      {/* Main Content - Add padding-top to account for fixed header */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 flex-1">
        {/* Admin Panel Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <a href="/" className="text-gray-400 hover:text-white text-sm">
            Back to User Dashboard
          </a>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Active Subscribers</p>
            <p className="text-3xl font-bold mt-2">{stats.activeUsers}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
            <p className="text-3xl font-bold mt-2">${stats.revenue}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Total API Calls</p>
            <p className="text-3xl font-bold mt-2">{stats.totalApiCalls.toLocaleString()}</p>
          </div>
        </div>

        {/* Waitlist */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Waitlist ({waitlist.length})
          </h2>

          {waitlist.length === 0 ? (
            <p className="text-gray-400">No pending waitlist entries</p>
          ) : (
            <div className="space-y-2">
              {waitlist.map((entry) => (
                <div key={entry.email} className="flex items-center justify-between p-3 bg-black rounded border border-gray-800">
                  <div>
                    <p className="font-medium">{entry.email}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => approveWaitlist(entry.email)}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded text-sm hover:bg-blue-500 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Users ({filteredUsers.length})
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-black border border-gray-800 rounded text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-800">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Tier</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">API Calls</th>
                  <th className="pb-2">Joined</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800">
                    <td className="py-3">{user.email}</td>
                    <td className="py-3 capitalize">{user.subscription_tier || 'free'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.subscription_status === 'active'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {user.subscription_status || 'inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {user.api_requests_used || 0}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewUserDetails(user.id)}
                          className="flex items-center gap-1 text-primary hover:text-blue-400 text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => suspendUser(user.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase 1A Intelligence Management */}
        <div className="mt-8 space-y-8">
          {/* Background Job Monitoring - CRITICAL */}
          <JobMonitoring />

          <IntelligenceSamplesTable />
          <IPReputationManager />
          <AdminIntelligenceTools />
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold">User Details</h3>
                <button
                  onClick={closeUserModal}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">User ID</p>
                    <p className="font-mono text-xs">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Subscription Status</p>
                    <p className="capitalize">{selectedUser.subscription_status || 'inactive'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tier</p>
                    <p className="capitalize">{selectedUser.subscription_tier || 'free'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">API Requests Used</p>
                    <p>{selectedUser.api_requests_used || 0} / {selectedUser.api_requests_limit || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Stripe Customer ID</p>
                    <p className="font-mono text-xs">{selectedUser.stripe_customer_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Created At</p>
                    <p>{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active</p>
                    <p>{selectedUser.is_active ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {/* API Key - SECURITY: Masked, never show full key */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">API Key</p>
                  <div className="bg-black border border-gray-800 rounded p-3 flex items-center justify-between gap-4">
                    <code className="text-xs font-mono break-all">
                      {selectedUser.api_key
                        ? `${selectedUser.api_key.substring(0, 8)}${'•'.repeat(24)}${selectedUser.api_key.slice(-4)}`
                        : 'N/A'}
                    </code>
                    {selectedUser.api_key && (
                      <button
                        onClick={() => alert('Key regeneration for users coming soon. Users can regenerate their own keys in their dashboard.')}
                        className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors whitespace-nowrap"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    🔒 Security: Full API keys are never displayed to admins. Users can view and manage their own keys in the dashboard.
                  </p>
                </div>

                {/* Credit/Refund Section */}
                <div className="border-t border-gray-800 pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Credit / Refund
                  </h4>
                  <textarea
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="Enter credit/refund notes and amount (e.g., 'Refund $29 for billing issue')"
                    className="w-full bg-black border border-gray-800 rounded p-3 text-sm min-h-[100px] focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={saveCreditNotes}
                    disabled={!creditNotes.trim()}
                    className="mt-2 px-4 py-2 bg-primary text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Process Credit/Refund
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Note: In production, this will integrate with Stripe API to issue actual refunds/credits
                  </p>
                </div>

                {/* Activity Log */}
                <div className="border-t border-gray-800 pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Activity ({userLogs.length} calls)
                  </h4>

                  {userLogs.length === 0 ? (
                    <p className="text-gray-400 text-sm">No API activity yet</p>
                  ) : (
                    <div className="bg-black border border-gray-800 rounded max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-black border-b border-gray-800">
                          <tr className="text-left text-gray-400">
                            <th className="p-2">Time</th>
                            <th className="p-2">Endpoint</th>
                            <th className="p-2">Prompt Length</th>
                            <th className="p-2">Response Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userLogs.map((log, idx) => (
                            <tr key={idx} className="border-b border-gray-800">
                              <td className="p-2 text-gray-400 text-xs">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="p-2 font-mono text-xs">{log.endpoint}</td>
                              <td className="p-2">{log.prompt_length || 'N/A'}</td>
                              <td className="p-2">{log.response_time_ms || 'N/A'}ms</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}