'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Shield, Clock, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react'

interface UsageData {
  date: string
  total_validations: number
  safe_count: number
  unsafe_count: number
  avg_response_time: number
}

interface TopPattern {
  pattern: string
  count: number
  percentage: number
}

export default function UsageAnalytics({ userId, userTier }: { userId: string, userTier: string }) {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [dailyData, setDailyData] = useState<UsageData[]>([])
  const [topPatterns, setTopPatterns] = useState<TopPattern[]>([])
  const [stats, setStats] = useState({
    totalValidations: 0,
    safeCount: 0,
    unsafeCount: 0,
    avgResponseTime: 0,
    blockRate: 0,
    estimatedCost: 0
  })

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  async function loadAnalytics() {
    try {
      setLoading(true)

      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      // Load validation data
      const { data: validations, error } = await supabase
        .from('threat_intelligence_samples')
        .select('created_at, is_safe, response_time_ms, pattern_detected')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Process daily aggregations
      const dailyMap = new Map<string, UsageData>()
      const patternCounts = new Map<string, number>()

      let totalResponseTime = 0
      let totalCount = 0
      let safeCount = 0
      let unsafeCount = 0

      validations?.forEach(v => {
        const date = v.created_at.split('T')[0]
        const existing = dailyMap.get(date) || {
          date,
          total_validations: 0,
          safe_count: 0,
          unsafe_count: 0,
          avg_response_time: 0
        }

        existing.total_validations++
        if (v.is_safe) {
          existing.safe_count++
          safeCount++
        } else {
          existing.unsafe_count++
          unsafeCount++
        }

        if (v.response_time_ms) {
          existing.avg_response_time = (existing.avg_response_time * (existing.total_validations - 1) + v.response_time_ms) / existing.total_validations
          totalResponseTime += v.response_time_ms
        }

        dailyMap.set(date, existing)

        // Count patterns
        if (v.pattern_detected && Array.isArray(v.pattern_detected)) {
          v.pattern_detected.forEach(pattern => {
            patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
          })
        }

        totalCount++
      })

      // Convert to array and fill gaps
      const dailyArray: UsageData[] = []
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        dailyArray.unshift(dailyMap.get(date) || {
          date,
          total_validations: 0,
          safe_count: 0,
          unsafe_count: 0,
          avg_response_time: 0
        })
      }

      setDailyData(dailyArray)

      // Top patterns
      const topPatternsList = Array.from(patternCounts.entries())
        .map(([pattern, count]) => ({
          pattern,
          count,
          percentage: (count / unsafeCount) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopPatterns(topPatternsList)

      // Calculate stats
      const blockRate = totalCount > 0 ? (unsafeCount / totalCount) * 100 : 0
      const avgResponseTime = totalCount > 0 ? totalResponseTime / totalCount : 0

      // Estimate cost (rough estimate based on current pricing)
      const estimatedCost = totalCount * 0.0001 // $0.0001 per validation

      setStats({
        totalValidations: totalCount,
        safeCount,
        unsafeCount,
        avgResponseTime,
        blockRate,
        estimatedCost
      })
    } catch (error: any) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number): string {
    return `$${amount.toFixed(4)}`
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-800 rounded mb-6"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  const maxValidations = Math.max(...dailyData.map(d => d.total_validations), 1)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold">Usage Analytics</h2>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Total Validations</span>
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{stats.totalValidations.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.safeCount} safe, {stats.unsafeCount} blocked
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Block Rate</span>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">{stats.blockRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.unsafeCount} threats blocked
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Avg Response</span>
            <Clock className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.avgResponseTime.toFixed(0)}ms</div>
          <div className="text-xs text-gray-500 mt-1">
            Average validation time
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Estimated Cost</span>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{formatCurrency(stats.estimatedCost)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Based on usage
          </div>
        </div>
      </div>

      {/* Daily Validations Chart */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Daily Validations</h3>
        <div className="h-64 flex items-end gap-1">
          {dailyData.map((day, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end items-center gap-1"
              title={`${day.date}: ${day.total_validations} validations`}
            >
              <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                {/* Unsafe (red) */}
                {day.unsafe_count > 0 && (
                  <div
                    className="w-full bg-red-500 rounded-t"
                    style={{ height: `${(day.unsafe_count / maxValidations) * 100}%` }}
                  ></div>
                )}
                {/* Safe (green) */}
                {day.safe_count > 0 && (
                  <div
                    className="w-full bg-green-500"
                    style={{ height: `${(day.safe_count / maxValidations) * 100}%` }}
                  ></div>
                )}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap" style={{ transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
                {formatDate(day.date)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-400">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-400">Blocked</span>
          </div>
        </div>
      </div>

      {/* Top Blocked Patterns */}
      {topPatterns.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Blocked Patterns</h3>
          <div className="space-y-3">
            {topPatterns.map((pattern, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">{pattern.pattern}</span>
                    <span className="text-sm text-gray-400">{pattern.count} times</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${pattern.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {pattern.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {stats.totalValidations === 0 && (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No validation data yet</p>
          <p className="text-sm text-gray-500">
            Start using the API to see your usage analytics here
          </p>
        </div>
      )}
    </div>
  )
}
