'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Brain, Shield, Check, AlertCircle, Info } from 'lucide-react'

interface Preferences {
  enable_intelligence_sharing?: boolean
  enable_ip_blocking?: boolean
}

export default function IntelligenceSettings() {
  const [tier, setTier] = useState<string>('free')
  const [preferences, setPreferences] = useState<Preferences>({
    enable_intelligence_sharing: true, // Default: enabled
    enable_ip_blocking: false // Default: disabled
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user profile with tier and preferences
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tier, preferences, subscription_tier')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setTier(profile.tier || profile.subscription_tier || 'free')
      setPreferences({
        enable_intelligence_sharing: profile.preferences?.enable_intelligence_sharing !== false, // Default true
        enable_ip_blocking: profile.preferences?.enable_ip_blocking === true // Default false
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(key: keyof Preferences, value: boolean) {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate tier-specific restrictions
      if (key === 'enable_intelligence_sharing' && tier === 'free') {
        throw new Error('Free tier users cannot opt-out of intelligence sharing. Upgrade to Pro to disable.')
      }

      if (key === 'enable_ip_blocking' && tier === 'free') {
        throw new Error('IP blocking is only available on Pro tier. Upgrade to enable automatic blocking.')
      }

      // Build updated preferences
      const updatedPreferences = {
        ...preferences,
        [key]: value
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setPreferences(updatedPreferences)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update preference')
      // Revert optimistic update on error
      await loadPreferences()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="text-center text-gray-500">Loading preferences...</div>
      </div>
    )
  }

  const isPro = tier !== 'free'

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        Network Intelligence Settings
      </h2>

      <div className="space-y-6">
        {/* Intelligence Sharing Toggle */}
        <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">Contribute to Network Intelligence</h3>
                {!isPro && (
                  <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded border border-yellow-800">
                    REQUIRED
                  </span>
                )}
                {isPro && (
                  <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-800">
                    OPTIONAL
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-3">
                When enabled, blocked prompts are stored for 24 hours then automatically anonymized. This helps
                protect all SafePrompt users from new attack patterns.
              </p>
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-900 rounded p-3">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-400">Privacy:</strong> Prompt text + IP deleted after 24 hours.
                  Only cryptographic hashes remain (no personally identifiable information).
                  {!isPro && ' Free tier users must contribute to receive network protection.'}
                  {isPro && ' Pro users can opt-out while still benefiting from network protection.'}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={() => updatePreference('enable_intelligence_sharing', !preferences.enable_intelligence_sharing)}
                disabled={!isPro || saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.enable_intelligence_sharing ? 'bg-primary' : 'bg-gray-700'
                } ${!isPro || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enable_intelligence_sharing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* IP Blocking Toggle */}
        <div className="bg-black/50 rounded-lg border border-gray-800 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Automatic IP Blocking</h3>
                <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-800">
                  PRO ONLY
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Automatically block requests from IP addresses with high attack rates across the SafePrompt network.
                Reduces attack surface and improves response times.
              </p>
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-900 rounded p-3">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-400">How it works:</strong> IPs with block rate &gt;70% and 10+ attempts
                  are marked for auto-blocking. Legitimate IPs with low block rates are never affected.
                  {!isPro && ' Upgrade to Pro to enable this feature.'}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={() => updatePreference('enable_ip_blocking', !preferences.enable_ip_blocking)}
                disabled={!isPro || saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.enable_ip_blocking ? 'bg-primary' : 'bg-gray-700'
                } ${!isPro || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enable_ip_blocking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-900/50 text-green-400 border border-green-800">
            <Check className="w-4 h-4 flex-shrink-0" />
            Preferences updated successfully!
          </div>
        )}

        {/* Upgrade CTA for Free Tier */}
        {!isPro && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Upgrade to Pro</h4>
            <p className="text-sm text-gray-400 mb-3">
              Get control over intelligence sharing and enable automatic IP blocking for enhanced security.
            </p>
            <a
              href="/upgrade"
              className="inline-block px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Upgrade to Pro - $5/mo
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
