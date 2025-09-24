'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Users, Clock, CheckCircle, XCircle, Mail } from 'lucide-react'

// Simple admin auth - in production, use proper role-based access
const ADMIN_EMAILS = ['ian@rebootmedia.net', 'admin@safeprompt.dev']

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !ADMIN_EMAILS.includes(user.email!)) {
        window.location.href = '/login'
        return
      }

      setUser(user)
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchData() {
    // Fetch users
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (usersData) setUsers(usersData)

    // Fetch waitlist
    const { data: waitlistData } = await supabase
      .from('waitlist')
      .select('*')
      .is('converted_to_user_id', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (waitlistData) setWaitlist(waitlistData)

    // Calculate stats
    const totalUsers = usersData?.length || 0
    const activeUsers = usersData?.filter(u => u.subscription_status === 'active').length || 0
    const revenue = activeUsers * 5 // $5 per user for beta

    setStats({ totalUsers, activeUsers, revenue })
  }

  async function approveWaitlist(email: string) {
    // In production, this would send an approval email with signup link
    alert(`Approved ${email} - In production, this would send an email`)

    // Mark as approved in database
    await supabase
      .from('waitlist')
      .update({ approved_at: new Date().toISOString() })
      .eq('email', email)

    await fetchData()
  }

  async function suspendUser(userId: string) {
    if (!confirm('Are you sure you want to suspend this user?')) return

    await supabase
      .from('users')
      .update({ subscription_status: 'suspended' })
      .eq('id', userId)

    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', userId)

    await fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-safeprompt-green">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-safeprompt-green" />
              <h1 className="text-2xl font-bold">SafePrompt Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">{user?.email}</span>
              <a href="/" className="text-gray-400 hover:text-white">
                User Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
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
        </div>

        {/* Waitlist */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-safeprompt-green" />
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
                    className="flex items-center gap-1 px-3 py-1 bg-safeprompt-green text-black rounded text-sm hover:bg-green-400 transition-colors"
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
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-safeprompt-green" />
            Recent Users
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-800">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Tier</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Joined</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800">
                    <td className="py-3">{user.email}</td>
                    <td className="py-3 capitalize">{user.tier || 'free'}</td>
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
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => suspendUser(user.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}