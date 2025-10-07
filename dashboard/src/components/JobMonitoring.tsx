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

        newSummaries.push({
          name: jobType,
          lastRun: lastRun?.created_at || null,
          lastStatus: lastRun?.job_status || 'unknown',
          successRate,
          totalRuns: last24h.length,
          avgDuration,
          lastError
        })
      }

      setSummaries(newSummaries)
    } catch (error) {
      console.error('Error in fetchJobMetrics:', error)
    } finally {
      setLoading(false)
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
              summary.lastStatus === 'error' ? 'border-red-500/50' :
              summary.successRate < 100 ? 'border-yellow-500/50' :
              'border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{getJobDisplayName(summary.name)}</h3>
                <p className="text-xs text-gray-500 mt-1">{getJobDescription(summary.name)}</p>
              </div>
              {summary.lastStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : summary.lastStatus === 'error' ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Last Run:</span>
                <span className={summary.lastStatus === 'error' ? 'text-red-400' : ''}>
                  {summary.lastRun ? getTimeSince(summary.lastRun) : 'Never'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">24h Success Rate:</span>
                <span className={
                  summary.successRate === 100 ? 'text-green-400' :
                  summary.successRate >= 90 ? 'text-yellow-400' :
                  'text-red-400'
                }>
                  {summary.successRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Runs (24h):</span>
                <span>{summary.totalRuns}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Avg Duration:</span>
                <span>{formatDuration(summary.avgDuration)}</span>
              </div>

              {summary.lastError && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-red-400 break-words">
                    Last Error: {summary.lastError.substring(0, 100)}
                    {summary.lastError.length > 100 && '...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Critical Alert */}
      {summaries.some(s => s.name === 'anonymization' && s.successRate < 100) && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400 mb-1">
                ⚠️ CRITICAL: Anonymization Job Failures Detected
              </h3>
              <p className="text-sm text-red-300">
                The anonymization job has failed in the last 24 hours. This is a legal compliance issue.
                PII may not be properly deleted after 24 hours. Check error logs immediately.
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
