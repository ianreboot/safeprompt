'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, XCircle, AlertTriangle, Activity, RefreshCw } from 'lucide-react'

interface JobMetric {
  id: string
  job_name: string
  job_status: string
  duration_ms: number
  records_processed: number
  error_message: string | null
  metadata: any
  created_at: string
}

interface JobSummary {
  name: string
  lastRun: string | null
  lastStatus: string
  successRate: number
  totalRuns: number
  avgDuration: number
  lastError: string | null
  isOverdue: boolean
  overdueBy: number // minutes
  expectedFrequency: string
  healthStatus: 'healthy' | 'warning' | 'critical'
  healthMessage: string
}

export default function JobMonitoring() {
  const [jobs, setJobs] = useState<JobMetric[]>([])
  const [summaries, setSummaries] = useState<JobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchJobMetrics()

    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchJobMetrics, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  async function fetchJobMetrics() {
    try {
      // Fetch last 50 job runs
      const { data: metricsData, error: metricsError } = await supabase
        .from('job_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (metricsError) {
        console.error('Error fetching job metrics:', metricsError)
        return
      }

      setJobs(metricsData || [])

      // Calculate summaries for each job type
      const jobTypes = ['anonymization', 'ip_reputation_update', 'session_cleanup']
      const newSummaries: JobSummary[] = []

      for (const jobType of jobTypes) {
        const jobRuns = metricsData?.filter(j => j.job_name === jobType) || []
        const last24h = jobRuns.filter(j => {
          const created = new Date(j.created_at)
          const now = new Date()
          return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000
        })

        const successCount = last24h.filter(j => j.job_status === 'success').length
        const successRate = last24h.length > 0 ? (successCount / last24h.length) * 100 : 100

        const avgDuration = last24h.length > 0
          ? last24h.reduce((sum, j) => sum + (j.duration_ms || 0), 0) / last24h.length
          : 0

        const lastRun = jobRuns[0]
        const lastError = jobRuns.find(j => j.job_status === 'error')?.error_message || null

        // Calculate health status
        const health = calculateHealthStatus(
          jobType,
          lastRun?.created_at || null,
          lastRun?.job_status || 'unknown',
          successRate,
          last24h.length
        )

        newSummaries.push({
          name: jobType,
          lastRun: lastRun?.created_at || null,
          lastStatus: lastRun?.job_status || 'unknown',
          successRate,
          totalRuns: last24h.length,
          avgDuration,
          lastError,
          isOverdue: health.isOverdue,
          overdueBy: health.overdueBy,
          expectedFrequency: getJobSchedule(jobType).displayName,
          healthStatus: health.healthStatus,
          healthMessage: health.healthMessage
        })
      }

      setSummaries(newSummaries)
    } catch (error) {
      console.error('Error in fetchJobMetrics:', error)
    } finally {
      setLoading(false)
    }
  }

  function getJobSchedule(jobName: string): { intervalMinutes: number, displayName: string, gracePeriodMinutes: number } {
    const schedules: Record<string, { intervalMinutes: number, displayName: string, gracePeriodMinutes: number }> = {
      'anonymization': { intervalMinutes: 60, displayName: 'Every hour', gracePeriodMinutes: 15 },
      'ip_reputation_update': { intervalMinutes: 60, displayName: 'Every hour', gracePeriodMinutes: 15 },
      'session_cleanup': { intervalMinutes: 60, displayName: 'Every hour', gracePeriodMinutes: 15 }
    }
    return schedules[jobName] || { intervalMinutes: 60, displayName: 'Every hour', gracePeriodMinutes: 15 }
  }

  function calculateHealthStatus(
    jobName: string,
    lastRun: string | null,
    lastStatus: string,
    successRate: number,
    totalRuns: number
  ): { healthStatus: 'healthy' | 'warning' | 'critical', healthMessage: string, isOverdue: boolean, overdueBy: number } {
    const schedule = getJobSchedule(jobName)

    if (!lastRun) {
      return {
        healthStatus: 'critical',
        healthMessage: 'Job has never run - verify cron configuration',
        isOverdue: true,
        overdueBy: 999999
      }
    }

    const now = new Date()
    const lastRunTime = new Date(lastRun)
    const minutesSinceLastRun = (now.getTime() - lastRunTime.getTime()) / 60000
    const overdueBy = Math.max(0, minutesSinceLastRun - schedule.intervalMinutes - schedule.gracePeriodMinutes)
    const isOverdue = overdueBy > 0

    // CRITICAL: Job overdue AND has failures
    if (isOverdue && successRate < 100) {
      return {
        healthStatus: 'critical',
        healthMessage: `Overdue by ${Math.floor(overdueBy)}m AND has failures - immediate action required`,
        isOverdue,
        overdueBy
      }
    }

    // CRITICAL: Job significantly overdue (>2x expected interval)
    if (minutesSinceLastRun > schedule.intervalMinutes * 2) {
      return {
        healthStatus: 'critical',
        healthMessage: `Last run ${Math.floor(minutesSinceLastRun / 60)}h ago (expected: ${schedule.displayName.toLowerCase()}) - cron may be broken`,
        isOverdue: true,
        overdueBy
      }
    }

    // CRITICAL: Anonymization job with ANY failures
    if (jobName === 'anonymization' && successRate < 100) {
      return {
        healthStatus: 'critical',
        healthMessage: `Anonymization failures detected (${successRate.toFixed(1)}% success) - legal compliance risk`,
        isOverdue: false,
        overdueBy: 0
      }
    }

    // WARNING: Job slightly overdue
    if (isOverdue) {
      return {
        healthStatus: 'warning',
        healthMessage: `Slightly overdue - last run ${Math.floor(minutesSinceLastRun)}m ago (expected: ${schedule.displayName.toLowerCase()})`,
        isOverdue,
        overdueBy
      }
    }

    // WARNING: Non-critical job with failures
    if (successRate < 100) {
      return {
        healthStatus: 'warning',
        healthMessage: `Some failures in last 24h (${successRate.toFixed(1)}% success) - monitor closely`,
        isOverdue: false,
        overdueBy: 0
      }
    }

    // WARNING: Job hasn't run enough times (less than expected)
    const expectedRuns = Math.floor(24 * 60 / schedule.intervalMinutes) // Expected runs in 24h
    if (totalRuns < expectedRuns * 0.8) { // Less than 80% of expected runs
      return {
        healthStatus: 'warning',
        healthMessage: `Only ${totalRuns}/${expectedRuns} expected runs in 24h - may be intermittent`,
        isOverdue: false,
        overdueBy: 0
      }
    }

    // HEALTHY: All good
    const timeAgo = minutesSinceLastRun < 60
      ? `${Math.floor(minutesSinceLastRun)}m ago`
      : `${Math.floor(minutesSinceLastRun / 60)}h ago`

    return {
      healthStatus: 'healthy',
      healthMessage: `✓ Healthy - last run ${timeAgo} (schedule: ${schedule.displayName.toLowerCase()})`,
      isOverdue: false,
      overdueBy: 0
    }
  }

  function getJobDisplayName(jobName: string): string {
    const names: Record<string, string> = {
      'anonymization': 'Sample Anonymization',
      'ip_reputation_update': 'IP Reputation Update',
      'session_cleanup': 'Session Cleanup'
    }
    return names[jobName] || jobName
  }

  function getJobDescription(jobName: string): string {
    const descriptions: Record<string, string> = {
      'anonymization': 'Removes PII from samples >24h old (CRITICAL for legal compliance)',
      'ip_reputation_update': 'Recalculates IP reputation scores and auto-block flags',
      'session_cleanup': 'Deletes validation sessions >2h old'
    }
    return descriptions[jobName] || ''
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  function getTimeSince(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Background Job Monitoring</h2>
        </div>
        <p className="text-gray-400">Loading job metrics...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Background Job Monitoring</h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              autoRefresh ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </button>
          <button
            onClick={fetchJobMetrics}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Job Summaries */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {summaries.map(summary => (
          <div
            key={summary.name}
            className={`bg-black/50 rounded-lg border p-4 ${
              summary.healthStatus === 'critical' ? 'border-red-500 bg-red-500/5' :
              summary.healthStatus === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
              'border-green-500/30 bg-green-500/5'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{getJobDisplayName(summary.name)}</h3>
                <p className="text-xs text-gray-500 mt-1">{getJobDescription(summary.name)}</p>
              </div>
              {summary.healthStatus === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : summary.healthStatus === 'critical' ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
            </div>

            {/* ACTIONABLE HEALTH STATUS */}
            <div className={`mb-3 p-2 rounded text-xs font-medium ${
              summary.healthStatus === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
              summary.healthStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' :
              'bg-green-500/20 text-green-300 border border-green-500/50'
            }`}>
              {summary.healthMessage}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Expected Schedule:</span>
                <span className="font-medium">{summary.expectedFrequency}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Last Run:</span>
                <span className={summary.isOverdue ? 'text-red-400 font-medium' : 'text-gray-300'}>
                  {summary.lastRun ? getTimeSince(summary.lastRun) : 'Never'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">24h Success Rate:</span>
                <span className={
                  summary.successRate === 100 ? 'text-green-400' :
                  summary.successRate >= 90 ? 'text-yellow-400' :
                  'text-red-400 font-medium'
                }>
                  {summary.successRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Runs (24h):</span>
                <span>{summary.totalRuns} <span className="text-xs text-gray-500">/ ~24 expected</span></span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Avg Duration:</span>
                <span>{formatDuration(summary.avgDuration)}</span>
              </div>

              {summary.lastError && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-red-400 break-words">
                    <strong>Last Error:</strong> {summary.lastError.substring(0, 100)}
                    {summary.lastError.length > 100 && '...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Critical Alerts */}
      {summaries.some(s => s.healthStatus === 'critical') && (
        <div className="mb-6 space-y-3">
          {summaries
            .filter(s => s.healthStatus === 'critical')
            .map(summary => (
              <div key={summary.name} className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-400 mb-1">
                      🚨 CRITICAL: {getJobDisplayName(summary.name)} Issue
                    </h3>
                    <p className="text-sm text-red-300 mb-2">
                      {summary.healthMessage}
                    </p>
                    <div className="text-xs text-red-200 space-y-1">
                      <div>• <strong>Job:</strong> {getJobDisplayName(summary.name)}</div>
                      <div>• <strong>Schedule:</strong> {summary.expectedFrequency}</div>
                      <div>• <strong>Last Run:</strong> {summary.lastRun ? getTimeSince(summary.lastRun) : 'Never'}</div>
                      <div>• <strong>Success Rate:</strong> {summary.successRate.toFixed(1)}%</div>
                      {summary.lastError && (
                        <div>• <strong>Last Error:</strong> {summary.lastError.substring(0, 150)}</div>
                      )}
                    </div>
                    {summary.name === 'anonymization' && (
                      <p className="text-xs text-red-200 mt-2 pt-2 border-t border-red-500/30">
                        ⚠️ <strong>Legal Compliance Risk:</strong> PII may not be properly deleted after 24 hours. Immediate investigation required.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Warning Alerts */}
      {summaries.some(s => s.healthStatus === 'warning') && !summaries.some(s => s.healthStatus === 'critical') && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-400 mb-1">
                ⚠️ Warnings Detected
              </h3>
              <ul className="text-sm text-yellow-300 space-y-1">
                {summaries
                  .filter(s => s.healthStatus === 'warning')
                  .map(s => (
                    <li key={s.name}>
                      <strong>{getJobDisplayName(s.name)}:</strong> {s.healthMessage}
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* All Healthy Status */}
      {summaries.every(s => s.healthStatus === 'healthy') && summaries.length > 0 && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-400 mb-1">
                ✓ All Background Jobs Healthy
              </h3>
              <p className="text-sm text-green-300">
                All background jobs are running on schedule with 100% success rate. No action required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Job Runs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Job Executions (Last 50)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-left">
                <th className="pb-3 pr-4">Job</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Duration</th>
                <th className="pb-3 pr-4">Records</th>
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-800/50">
                  <td className="py-3 pr-4">
                    <span className="font-medium">{getJobDisplayName(job.job_name)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {job.job_status === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-400">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-400">Error</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {job.duration_ms ? formatDuration(job.duration_ms) : '-'}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {job.records_processed || 0}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {getTimeSince(job.created_at)}
                  </td>
                  <td className="py-3">
                    {job.error_message ? (
                      <span className="text-xs text-red-400 break-words">
                        {job.error_message.substring(0, 50)}
                        {job.error_message.length > 50 && '...'}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No job metrics found. Jobs will appear here once they start running.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
