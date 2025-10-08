'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Plus, Trash2, AlertCircle, CheckCircle, ListFilter, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface CustomListsData {
  tier: string
  limits: {
    whitelist: number
    blacklist: number
  }
  defaults: {
    whitelist: string[]
    blacklist: string[]
  }
  custom: {
    whitelist: string[]
    blacklist: string[]
  }
  removed: {
    whitelist: string[]
    blacklist: string[]
  }
  uses_defaults: {
    whitelist: boolean
    blacklist: boolean
  }
  effective: {
    whitelist: string[]
    blacklist: string[]
  }
}

type ListType = 'whitelist' | 'blacklist'

export default function CustomListsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ListType>('whitelist')
  const [listsData, setListsData] = useState<CustomListsData | null>(null)
  const [newPhrase, setNewPhrase] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

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
      loadCustomLists()
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

  async function loadCustomLists() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, custom_whitelist, custom_blacklist, removed_defaults, uses_default_whitelist, uses_default_blacklist')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Determine tier limits
      const tierLimits = {
        free: { whitelist: 0, blacklist: 0 },
        early_bird: { whitelist: 25, blacklist: 25 },
        starter: { whitelist: 25, blacklist: 25 },
        business: { whitelist: 100, blacklist: 100 },
        internal: { whitelist: 200, blacklist: 200 }
      }

      const limits = tierLimits[data.subscription_tier as keyof typeof tierLimits] || tierLimits.free

      // Mock defaults for now (would come from API in real implementation)
      const defaults = {
        whitelist: ['shipping address', 'update order', 'track package'],
        blacklist: ['ignore previous instructions', 'system prompt']
      }

      const customWhitelist = data.custom_whitelist || []
      const customBlacklist = data.custom_blacklist || []
      const removedDefaults = data.removed_defaults || { whitelist: [], blacklist: [] }

      // Calculate effective lists
      const effectiveWhitelist = [
        ...(data.uses_default_whitelist ? defaults.whitelist.filter(p => !removedDefaults.whitelist.includes(p)) : []),
        ...customWhitelist
      ]
      const effectiveBlacklist = [
        ...(data.uses_default_blacklist ? defaults.blacklist.filter(p => !removedDefaults.blacklist.includes(p)) : []),
        ...customBlacklist
      ]

      setListsData({
        tier: data.subscription_tier,
        limits,
        defaults,
        custom: {
          whitelist: customWhitelist,
          blacklist: customBlacklist
        },
        removed: removedDefaults,
        uses_defaults: {
          whitelist: data.uses_default_whitelist,
          blacklist: data.uses_default_blacklist
        },
        effective: {
          whitelist: effectiveWhitelist,
          blacklist: effectiveBlacklist
        }
      })
    } catch (error: any) {
      console.error('Error loading custom lists:', error)
      setAddError(`Failed to load lists: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addPhrase() {
    try {
      setAddError('')
      setAddSuccess('')

      if (!newPhrase.trim()) {
        setAddError('Phrase cannot be empty')
        return
      }

      // Validate tier allows custom lists
      if (listsData?.tier === 'free') {
        setAddError('Custom lists require a paid plan (Early Bird or higher)')
        return
      }

      // Check limit
      const currentCount = listsData?.custom[activeTab].length || 0
      const limit = listsData?.limits[activeTab] || 0

      if (currentCount >= limit) {
        setAddError(`You've reached your ${activeTab} limit (${limit} phrases)`)
        return
      }

      // Check if already exists
      const lowerPhrase = newPhrase.trim().toLowerCase()
      const existingCustom = listsData?.custom[activeTab].map(p => p.toLowerCase()) || []
      const existingDefaults = listsData?.defaults[activeTab].map(p => p.toLowerCase()) || []

      if (existingCustom.includes(lowerPhrase)) {
        setAddError('This phrase is already in your custom list')
        return
      }

      if (existingDefaults.includes(lowerPhrase)) {
        setAddError('This phrase is already in the default list')
        return
      }

      // Add to database
      const updatedCustom = [...(listsData?.custom[activeTab] || []), newPhrase.trim()]
      const columnName = activeTab === 'whitelist' ? 'custom_whitelist' : 'custom_blacklist'

      const { error } = await supabase
        .from('profiles')
        .update({ [columnName]: updatedCustom })
        .eq('id', user.id)

      if (error) throw error

      setAddSuccess(`Added "${newPhrase.trim()}" to ${activeTab}`)
      setNewPhrase('')
      await loadCustomLists()
    } catch (error: any) {
      setAddError(error.message)
    }
  }

  async function removePhrase(phrase: string, isDefault: boolean) {
    try {
      setAddError('')
      setAddSuccess('')

      if (isDefault) {
        // Add to removed_defaults
        const updatedRemoved = {
          ...listsData?.removed,
          [activeTab]: [...(listsData?.removed[activeTab] || []), phrase]
        }

        const { error } = await supabase
          .from('profiles')
          .update({ removed_defaults: updatedRemoved })
          .eq('id', user.id)

        if (error) throw error

        setAddSuccess(`Removed "${phrase}" from defaults`)
      } else {
        // Remove from custom list
        const updatedCustom = (listsData?.custom[activeTab] || []).filter(p => p.toLowerCase() !== phrase.toLowerCase())
        const columnName = activeTab === 'whitelist' ? 'custom_whitelist' : 'custom_blacklist'

        const { error } = await supabase
          .from('profiles')
          .update({ [columnName]: updatedCustom })
          .eq('id', user.id)

        if (error) throw error

        setAddSuccess(`Removed "${phrase}" from custom ${activeTab}`)
      }

      await loadCustomLists()
    } catch (error: any) {
      setAddError(error.message)
    }
  }

  async function resetLists() {
    if (!confirm('Reset all custom lists to defaults? This will remove all your custom phrases and restore all default phrases.')) {
      return
    }

    try {
      setAddError('')
      setAddSuccess('')

      const { error } = await supabase
        .from('profiles')
        .update({
          custom_whitelist: [],
          custom_blacklist: [],
          removed_defaults: { whitelist: [], blacklist: [] },
          uses_default_whitelist: true,
          uses_default_blacklist: true
        })
        .eq('id', user.id)

      if (error) throw error

      setAddSuccess('All lists reset to defaults')
      await loadCustomLists()
    } catch (error: any) {
      setAddError(error.message)
    }
  }

  async function toggleDefaults() {
    try {
      setAddError('')
      setAddSuccess('')

      const columnName = activeTab === 'whitelist' ? 'uses_default_whitelist' : 'uses_default_blacklist'
      const currentValue = listsData?.uses_defaults[activeTab]
      const newValue = !currentValue

      const { error } = await supabase
        .from('profiles')
        .update({ [columnName]: newValue })
        .eq('id', user.id)

      if (error) throw error

      setAddSuccess(`${newValue ? 'Enabled' : 'Disabled'} default ${activeTab}`)
      await loadCustomLists()
    } catch (error: any) {
      setAddError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
      </div>
    )
  }

  const isPaid = listsData?.tier !== 'free'
  const currentCustomCount = listsData?.custom[activeTab].length || 0
  const currentLimit = listsData?.limits[activeTab] || 0
  const defaultPhrases = listsData?.uses_defaults[activeTab]
    ? listsData?.defaults[activeTab].filter(p => !listsData?.removed[activeTab].includes(p))
    : []
  const customPhrases = listsData?.custom[activeTab] || []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header user={user} usage={usage} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl font-bold">Custom Lists</h1>
          </div>
          <p className="text-gray-400">
            Customize whitelist and blacklist phrases for your AI validation pipeline.
          </p>
        </div>

        {/* Tier Info Banner */}
        {!isPaid && (
          <div className="mb-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-400">Upgrade Required</div>
              <div className="text-sm text-gray-300 mt-1">
                Custom lists are available on Early Bird plans and above. You can view default lists but cannot add custom phrases.
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Current Tier</span>
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400 capitalize">
              {listsData?.tier.replace('_', ' ')}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Whitelist Limit</span>
              <ListFilter className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">
              {listsData?.custom.whitelist.length || 0} / {listsData?.limits.whitelist || 0}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Blacklist Limit</span>
              <ListFilter className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">
              {listsData?.custom.blacklist.length || 0} / {listsData?.limits.blacklist || 0}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('whitelist')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'whitelist'
                ? 'border-green-400 text-green-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Whitelist ({listsData?.effective.whitelist.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'blacklist'
                ? 'border-red-400 text-red-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Blacklist ({listsData?.effective.blacklist.length || 0})
          </button>
        </div>

        {/* Messages */}
        {addError && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <span>{addError}</span>
          </div>
        )}

        {addSuccess && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-400 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 mt-0.5" />
            <span>{addSuccess}</span>
          </div>
        )}

        {/* Add Phrase Form */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Add Custom {activeTab === 'whitelist' ? 'Whitelist' : 'Blacklist'} Phrase
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && isPaid && addPhrase()}
              placeholder={`Enter phrase to ${activeTab}...`}
              disabled={!isPaid}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={addPhrase}
              disabled={!isPaid || !newPhrase.trim()}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Phrase
            </button>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            {isPaid ? (
              <>Using {currentCustomCount} of {currentLimit} custom phrases</>
            ) : (
              <>Upgrade to Early Bird or higher to add custom phrases</>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={toggleDefaults}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ListFilter className="h-4 w-4" />
            {listsData?.uses_defaults[activeTab] ? 'Disable' : 'Enable'} Default {activeTab}
          </button>
          <button
            onClick={resetLists}
            disabled={!isPaid}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reset All Lists
          </button>
        </div>

        {/* Lists Display */}
        <div className="space-y-6">
          {/* Default Phrases */}
          {listsData?.uses_defaults[activeTab] && defaultPhrases.length > 0 && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                <h3 className="font-semibold">Default Phrases ({defaultPhrases.length})</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {defaultPhrases.map((phrase) => (
                  <div key={phrase} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-300">{phrase}</span>
                      <span className="px-2 py-1 bg-gray-800 text-gray-500 text-xs rounded">Default</span>
                    </div>
                    {isPaid && (
                      <button
                        onClick={() => removePhrase(phrase, true)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove from defaults"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Phrases */}
          {customPhrases.length > 0 && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                <h3 className="font-semibold">Custom Phrases ({customPhrases.length})</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {customPhrases.map((phrase) => (
                  <div key={phrase} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className={`h-4 w-4 ${activeTab === 'whitelist' ? 'text-green-400' : 'text-red-400'}`} />
                      <span className="text-white font-medium">{phrase}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        activeTab === 'whitelist'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        Custom
                      </span>
                    </div>
                    <button
                      onClick={() => removePhrase(phrase, false)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove custom phrase"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {customPhrases.length === 0 && defaultPhrases.length === 0 && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
              <ListFilter className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <div className="text-gray-400">
                No {activeTab} phrases configured.
                {isPaid ? ' Add your first phrase above.' : ' Upgrade to add custom phrases.'}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
