'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, Download, Trash2, Check, AlertCircle, Info } from 'lucide-react'

export default function PrivacyControls() {
  const [deletingData, setDeletingData] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleDataDeletion() {
    setDeletingData(true)
    setError('')
    setDeleteSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call API endpoint to delete user's <24h data
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev'

      // Get API key for authenticated request
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('id', user.id)
        .single()

      if (!profile?.api_key) {
        throw new Error('API key not found. Please refresh the page and try again.')
      }

      const response = await fetch(`${apiUrl}/api/v1/privacy/delete`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': profile.api_key,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete data')
      }

      const result = await response.json()

      setDeleteSuccess(true)
      setShowDeleteConfirm(false)
      setTimeout(() => setDeleteSuccess(false), 5000)

      // Show what was deleted
      if (result.deleted) {
        console.log('Deleted:', result.deleted)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete data')
    } finally {
      setDeletingData(false)
    }
  }

  async function handleDataExport() {
    setExportingData(true)
    setError('')
    setExportSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call API endpoint to export user's identifiable data
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev'

      // Get API key for authenticated request
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('id', user.id)
        .single()

      if (!profile?.api_key) {
        throw new Error('API key not found. Please refresh the page and try again.')
      }

      const response = await fetch(`${apiUrl}/api/v1/privacy/export`, {
        method: 'GET',
        headers: {
          'X-API-Key': profile.api_key,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to export data')
      }

      const data = await response.json()

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `safeprompt-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message || 'Failed to export data')
    } finally {
      setExportingData(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        Privacy Controls
      </h2>

      <div className="space-y-6">
        {/* Data Export */}
        <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
          <div className="flex items-start gap-4">
            <Download className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Export Your Data</h3>
              <p className="text-sm text-gray-400 mb-3">
                Download all personally identifiable information SafePrompt has stored about you. This includes:
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-4 ml-4">
                <li>• Account information (email, tier)</li>
                <li>• Blocked prompts from the last 24 hours (with full text)</li>
                <li>• Session data (last 2 hours)</li>
                <li>• API usage statistics</li>
              </ul>
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-900 rounded p-3 mb-4">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-400">GDPR/CCPA Compliant:</strong> This export includes all data
                  covered by your right to access. Anonymized data (hashes only) is not included as it contains
                  no personally identifiable information.
                </div>
              </div>
              <button
                onClick={handleDataExport}
                disabled={exportingData}
                className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {exportingData ? 'Exporting...' : 'Export Data (JSON)'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Deletion */}
        <div className="bg-black/50 rounded-lg border border-red-900/50 p-4">
          <div className="flex items-start gap-4">
            <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Delete Your Data</h3>
              <p className="text-sm text-gray-400 mb-3">
                Permanently delete all personally identifiable information stored within the last 24 hours:
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-4 ml-4">
                <li>• Blocked prompt text (last 24 hours)</li>
                <li>• Client IP addresses (last 24 hours)</li>
                <li>• Session data (last 2 hours)</li>
              </ul>
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-900 rounded p-3 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                <div>
                  <strong className="text-yellow-400">Important:</strong> This only deletes identifiable data.
                  Anonymized hashes (which cannot identify you) remain for network security. Account data and
                  API keys are not affected - to delete your account completely, contact support.
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Data
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-400 font-semibold mb-2">
                      ⚠️ Are you sure?
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      This will permanently delete all personally identifiable data from the last 24 hours.
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDataDeletion}
                        disabled={deletingData}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {deletingData ? 'Deleting...' : 'Yes, Delete My Data'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingData}
                        className="px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-900/50 text-red-400 border border-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {deleteSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-900/50 text-green-400 border border-green-800">
            <Check className="w-4 h-4 flex-shrink-0" />
            Data deleted successfully! All personally identifiable information has been removed.
          </div>
        )}

        {exportSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-900/50 text-green-400 border border-green-800">
            <Check className="w-4 h-4 flex-shrink-0" />
            Data exported successfully! Check your downloads folder.
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-400 mb-2">Automatic Data Protection</h4>
          <p className="text-sm text-gray-400">
            Even without manual deletion, SafePrompt automatically anonymizes all data after 24 hours.
            Prompt text and IP addresses are permanently deleted, leaving only cryptographic hashes
            for network security.
          </p>
        </div>
      </div>
    </div>
  )
}
