'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Lock, AlertCircle, CheckCircle, Download, Trash2, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface PrivacySettings {
  intelligence_sharing: boolean
  auto_block_enabled: boolean
  intelligence_opt_in_date: string | null
}

export default function PrivacySettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PrivacySettings>({
    intelligence_sharing: true,
    auto_block_enabled: true,
    intelligence_opt_in_date: null
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [exportingData, setExportingData] = useState(false)
  const [deletingData, setDeletingData] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tier, setTier] = useState('free')

  // Usage state for Header component
  const [usage] = useState({
    current: 0,
    limit: 0,
    percentage: 0,
    tier: 'free',
    daily_usage: [],
    avg_response_time: null,
    error_rate: null
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadPrivacySettings()
    }
  }, [user])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPrivacySettings() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, intelligence_sharing, auto_block_enabled, intelligence_opt_in_date')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading settings:', error)
        // If columns don't exist yet, use defaults
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('Privacy columns not yet deployed, using defaults')
          return
        }
        throw error
      }

      if (data) {
        setTier(data.subscription_tier || 'free')
        setSettings({
          intelligence_sharing: data.intelligence_sharing ?? true,
          auto_block_enabled: data.auto_block_enabled ?? true,
          intelligence_opt_in_date: data.intelligence_opt_in_date
        })
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSetting(key: keyof PrivacySettings, value: boolean) {
    try {
      setSaving(true)
      setSaveError('')
      setSaveSuccess(false)

      const updateData: any = { [key]: value }

      // If enabling intelligence_sharing for the first time, set opt_in_date
      if (key === 'intelligence_sharing' && value && !settings.intelligence_opt_in_date) {
        updateData.intelligence_opt_in_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        console.error('Update error:', error)
        // Handle case where columns don't exist yet
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          setSaveError('Privacy controls are not yet available. Database migration pending.')
          return
        }
        throw error
      }

      // Update local state
      setSettings(prev => ({
        ...prev,
        ...updateData
      }))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error updating setting:', error)
      setSaveError(error.message || 'Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  async function handleExportData() {
    try {
      setExportingData(true)

      // SECURITY: Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const data = await response.json()

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `safeprompt-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    } finally {
      setExportingData(false)
    }
  }

  async function handleDeleteData() {
    try {
      setDeletingData(true)

      // SECURITY: Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Deletion failed')
      }

      const data = await response.json()
      alert(`Successfully deleted ${data.deletedCount} threat intelligence samples. Your personal data has been removed while preserving anonymized threat statistics.`)
      setShowDeleteConfirm(false)
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('Deletion failed: ' + error.message)
    } finally {
      setDeletingData(false)
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
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Privacy & Data Controls</h1>
            </div>
            <p className="text-gray-300">
              Manage your threat intelligence sharing preferences and data privacy settings.
            </p>
          </div>

          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300">Settings saved successfully</span>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{saveError}</span>
            </div>
          )}

          {/* Intelligence Sharing Control */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Intelligence Sharing</h2>
                  {tier === 'free' && (
                    <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">FREE TIER</span>
                  )}
                  {tier !== 'free' && tier !== 'internal' && (
                    <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded">PRO TIER</span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  {tier === 'free' && (
                    <>Free tier users automatically contribute blocked requests to our threat intelligence network. This data helps protect all SafePrompt users.</>
                  )}
                  {tier !== 'free' && tier !== 'internal' && (
                    <>Paid tier users can choose to contribute all validation requests (not just blocked ones) to improve network defense. In return, you benefit from IP reputation auto-blocking.</>
                  )}
                  {tier === 'internal' && (
                    <>Internal tier accounts are exempt from intelligence collection.</>
                  )}
                </p>
              </div>
              {tier !== 'free' && tier !== 'internal' && (
                <button
                  onClick={() => updateSetting('intelligence_sharing', !settings.intelligence_sharing)}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    settings.intelligence_sharing
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {settings.intelligence_sharing ? 'ON' : 'OFF'}
                </button>
              )}
            </div>

            {settings.intelligence_opt_in_date && (
              <div className="text-xs text-gray-400">
                Opted in: {new Date(settings.intelligence_opt_in_date).toLocaleDateString()}
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Data collected:</strong> Prompt text, validation result, IP address, attack vectors detected
              </p>
              <p className="text-sm text-blue-200 mt-1">
                <strong>Retention:</strong> Personal data deleted after 24 hours (anonymized threat statistics retained)
              </p>
            </div>
          </div>

          {/* IP Auto-Blocking Control */}
          {tier !== 'free' && tier !== 'internal' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6 text-red-400" />
                    <h2 className="text-xl font-semibold text-white">IP Auto-Blocking</h2>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    Automatically block requests from IPs with a history of attacks (80%+ block rate, 5+ samples). Uses hash-based lookup with 10ms latency.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('auto_block_enabled', !settings.auto_block_enabled)}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    settings.auto_block_enabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {settings.auto_block_enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-200">
                  <strong>How it works:</strong> When an IP has been blocked by SafePrompt users 80% of the time (minimum 5 samples), it's automatically blocked for your API.
                </p>
              </div>
            </div>
          )}

          {/* GDPR Data Rights */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Your Data Rights (GDPR/CCPA)</h2>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              You have the right to access and delete your personal data. These actions comply with GDPR Article 15 (Right to Access) and Article 17 (Right to Deletion).
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Export Data */}
              <button
                onClick={handleExportData}
                disabled={exportingData}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <div className="text-white font-medium">Export My Data</div>
                  <div className="text-xs text-gray-400">Download all your threat intelligence samples</div>
                </div>
              </button>

              {/* Delete Data */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingData}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
                <div className="text-left">
                  <div className="text-white font-medium">Delete My Data</div>
                  <div className="text-xs text-gray-400">Remove personal data (anonymized stats retained)</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Confirm Data Deletion</h3>
            </div>
            <p className="text-gray-300 mb-6">
              This will permanently delete your personal data (prompt text, IP addresses) from our threat intelligence samples. Anonymized threat statistics will be retained for network defense.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={deletingData}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingData ? 'Deleting...' : 'Delete My Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
