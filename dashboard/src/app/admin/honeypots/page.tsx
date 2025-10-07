'use client';

/**
 * Honeypot Analytics Dashboard
 *
 * Phase 6.5.5: Honeypot Analytics Dashboard
 *
 * Features:
 * - View honeypot request volume over time
 * - See top attacking IPs
 * - Analyze reconnaissance patterns detected
 * - Track auto-deployed patterns from honeypot learning
 * - Export honeypot data for offline analysis
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface HoneypotRequest {
  id: string;
  endpoint: string;
  full_request: any;
  ip_hash: string;
  user_agent: string;
  detected_patterns: string[];
  auto_deployed: boolean;
  deployed_pattern_id: string | null;
  created_at: string;
}

interface HoneypotStats {
  totalRequests: number;
  uniqueIPs: number;
  reconnaissanceAttempts: number;
  autoDeployedPatterns: number;
  requestsPerDay: { [key: string]: number };
  endpointBreakdown: { [key: string]: number };
  patternBreakdown: { [key: string]: number };
  topIPsList: { ip: string; count: number }[];
}

export default function HoneypotsPage() {
  const [requests, setRequests] = useState<HoneypotRequest[]>([]);
  const [stats, setStats] = useState<HoneypotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const [selectedRequest, setSelectedRequest] = useState<HoneypotRequest | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadHoneypotData();
  }, [timeRange]);

  async function loadHoneypotData() {
    setLoading(true);
    try {
      const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('honeypot_requests')
        .select('*')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setRequests(data || []);
      calculateStats(data || []);

    } catch (error) {
      console.error('Failed to load honeypot data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(data: HoneypotRequest[]) {
    const stats: HoneypotStats = {
      totalRequests: data.length,
      uniqueIPs: new Set(data.map(r => r.ip_hash)).size,
      reconnaissanceAttempts: 0,
      autoDeployedPatterns: data.filter(r => r.auto_deployed).length,
      requestsPerDay: {},
      endpointBreakdown: {},
      patternBreakdown: {},
      topIPsList: []
    };

    const ipCounts: { [key: string]: number } = {};

    for (const request of data) {
      // Endpoint breakdown
      stats.endpointBreakdown[request.endpoint] = (stats.endpointBreakdown[request.endpoint] || 0) + 1;

      // Pattern breakdown
      if (request.detected_patterns && request.detected_patterns.length > 0) {
        stats.reconnaissanceAttempts++;
        for (const pattern of request.detected_patterns) {
          stats.patternBreakdown[pattern] = (stats.patternBreakdown[pattern] || 0) + 1;
        }
      }

      // Top IPs
      ipCounts[request.ip_hash] = (ipCounts[request.ip_hash] || 0) + 1;

      // Requests per day
      const date = new Date(request.created_at).toISOString().split('T')[0];
      stats.requestsPerDay[date] = (stats.requestsPerDay[date] || 0) + 1;
    }

    // Convert top IPs to sorted array
    stats.topIPsList = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setStats(stats);
  }

  function exportData() {
    const csv = generateCSV(requests);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honeypot-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function generateCSV(data: HoneypotRequest[]) {
    const headers = ['Date', 'Endpoint', 'IP Hash', 'User Agent', 'Patterns Detected', 'Auto Deployed'];
    const rows = data.map(r => [
      new Date(r.created_at).toISOString(),
      r.endpoint,
      r.ip_hash,
      r.user_agent,
      r.detected_patterns.join('; '),
      r.auto_deployed ? 'Yes' : 'No'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Honeypot Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track reconnaissance attempts and auto-learned attack patterns
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{stats.uniqueIPs.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Unique IPs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.reconnaissanceAttempts.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Recon Attempts</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.autoDeployedPatterns}</div>
              <div className="text-sm text-gray-600">Auto-Deployed</div>
            </div>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value) as 7 | 30 | 90)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadHoneypotData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Endpoint Breakdown */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(stats.endpointBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([endpoint, count]) => (
                    <div key={endpoint} className="flex justify-between items-center">
                      <code className="text-sm text-gray-700">{endpoint}</code>
                      <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Pattern Breakdown */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reconnaissance Patterns</h3>
              <div className="space-y-2">
                {Object.entries(stats.patternBreakdown).length > 0 ? (
                  Object.entries(stats.patternBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([pattern, count]) => (
                      <div key={pattern} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{pattern.replace('_', ' ')}</span>
                        <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">No reconnaissance patterns detected</p>
                )}
              </div>
            </div>

            {/* Top IPs */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Attacking IPs</h3>
              <div className="space-y-2">
                {stats.topIPsList.map((item, idx) => (
                  <div key={item.ip} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4">#{idx + 1}</span>
                      <code className="text-sm text-gray-700">{item.ip}</code>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requests Per Day */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h3>
              <div className="space-y-2">
                {Object.entries(stats.requestsPerDay)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .slice(0, 10)
                  .map(([date, count]) => (
                    <div key={date} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{date}</span>
                      <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Requests Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Honeypot Requests</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No honeypot requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Hash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patterns</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-Deployed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.slice(0, 50).map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{request.endpoint}</code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {request.ip_hash}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {request.detected_patterns.length > 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                            {request.detected_patterns.length} detected
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {request.auto_deployed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedRequest.endpoint}</code>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Hash</label>
                    <p className="text-sm text-gray-900">{selectedRequest.ip_hash}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                    <p className="text-sm text-gray-900 truncate">{selectedRequest.user_agent}</p>
                  </div>
                </div>

                {selectedRequest.detected_patterns.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detected Patterns</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.detected_patterns.map(pattern => (
                        <span key={pattern} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          {pattern.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Request</label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedRequest.full_request, null, 2)}
                  </pre>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
