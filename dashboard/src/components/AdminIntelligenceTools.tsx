'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Zap, AlertCircle, Check, TrendingUp, Target, Shield, Activity } from 'lucide-react'

export default function AdminIntelligenceTools() {
  const [anonymizing, setAnonymizing] = useState(false)
  const [anonymizeResult, setAnonymizeResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function triggerAnonymization() {
    if (!confirm('Are you sure you want to trigger manual anonymization? This will delete all prompt text and IPs older than 24 hours.')) {
      return
    }

    setAnonymizing(true)
    setError('')
    setAnonymizeResult(null)

    try {
      // Call the anonymization function
      const { data, error: rpcError } = await supabase.rpc('anonymize_old_intelligence_samples')

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      setAnonymizeResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to trigger anonymization')
    } finally {
      setAnonymizing(false)
    }
  }

  async function refreshStats() {
    // Trigger IP reputation scoring manually
    try {
      const { error: rpcError } = await supabase.rpc('update_ip_reputation_scores')

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      alert('IP reputation scores refreshed successfully!')
    } catch (err: any) {
      alert(`Failed to refresh: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Manual Anonymization */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Manual Anonymization Trigger
        </h2>

        <div className="space-y-4">
          <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
            <p className="text-sm text-gray-400 mb-4">
              Manually trigger the anonymization process to delete all prompt text and IP addresses
              older than 24 hours. This process runs automatically every hour, but you can trigger
              it manually for immediate cleanup.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400">
                  <strong className="text-yellow-400">Warning:</strong> This will permanently delete
                  all personally identifiable information older than 24 hours. Only cryptographic hashes
                  will remain. This action cannot be undone.
                </div>
              </div>
            </div>

            <button
              onClick={triggerAnonymization}
              disabled={anonymizing}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {anonymizing ? 'Anonymizing...' : 'Trigger Anonymization Now'}
            </button>
          </div>

          {/* Results */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-900/50 text-red-400 border border-red-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {anonymizeResult && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-green-900/50 text-green-400 border border-green-800">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Anonymization completed successfully!</p>
                <ul className="text-xs space-y-1 text-green-300">
                  <li>• Samples anonymized: {anonymizeResult.samples_anonymized || 0}</li>
                  <li>• Prompt texts deleted: {anonymizeResult.samples_anonymized || 0}</li>
                  <li>• IP addresses deleted: {anonymizeResult.samples_anonymized || 0}</li>
                  <li>• Hashes preserved for network defense</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Intelligence Analysis Dashboard */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Intelligence Analysis Dashboard
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Pattern Discovery */}
          <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Pattern Discovery</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Automatic pattern detection identifies new attack vectors by analyzing blocked
              prompt hashes across the network.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Unique Attack Patterns:</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">New Patterns (24h):</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Pattern Similarity:</span>
                <span className="font-semibold">SHA-256 matching</span>
              </div>
            </div>
          </div>

          {/* Network Defense Stats */}
          <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Network Defense</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Real-time statistics on network-wide threat intelligence collection and
              defense effectiveness.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Active Samples:</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Hashes:</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Anonymization Rate:</span>
                <span className="font-semibold">Automatic (24h)</span>
              </div>
            </div>
          </div>

          {/* IP Reputation Stats */}
          <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">IP Reputation System</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Track malicious IP addresses and automatic blocking effectiveness across
              the SafePrompt network.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Tracked IPs:</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Auto-block Enabled:</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Block Rate &gt;70%:</span>
                <span className="font-semibold">Query database</span>
              </div>
            </div>
            <button
              onClick={refreshStats}
              className="mt-3 w-full px-3 py-1.5 bg-black border border-gray-800 rounded text-xs hover:border-primary transition-colors"
            >
              Refresh IP Scores
            </button>
          </div>

          {/* Collection Metrics */}
          <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Collection Metrics</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Intelligence collection statistics showing contribution rates and
              anonymization effectiveness.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Samples/Day:</span>
                <span className="font-semibold">Query database</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Anonymized/Day:</span>
                <span className="font-semibold">Automatic process</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Opt-out Rate:</span>
                <span className="font-semibold">Paid tiers only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            <strong className="text-blue-400">Note:</strong> Live metrics require database queries.
            The stats above show query placeholders. Implement actual queries in production to display
            real-time intelligence analysis data.
          </p>
        </div>
      </div>
    </div>
  )
}
