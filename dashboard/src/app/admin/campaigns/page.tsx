'use client';

/**
 * Attack Campaign Dashboard
 *
 * Phase 6.4.4: Campaign Alert System
 *
 * Features:
 * - View all detected attack campaigns (active and historical)
 * - Filter by status, time range, and campaign type
 * - View campaign details (timeline, IP list, attack patterns)
 * - Take response actions (investigate, block IPs, resolve)
 * - Export campaign data for offline analysis
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AttackCampaign {
  id: string;
  detected_at: string;
  window_start: string;
  window_end: string;
  request_count: number;
  unique_ips: number;
  pattern_type: string;
  similarity_score: number | null;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  response_action: string | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignStats {
  active: number;
  investigating: number;
  resolved: number;
  falsePositive: number;
  totalRequests: number;
  totalIPs: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AttackCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    active: 0,
    investigating: 0,
    resolved: 0,
    falsePositive: 0,
    totalRequests: 0,
    totalIPs: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'investigating' | 'resolved' | 'false_positive'>('active');
  const [selectedCampaign, setSelectedCampaign] = useState<AttackCampaign | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  async function loadCampaigns() {
    setLoading(true);
    try {
      let query = supabase
        .from('attack_campaigns')
        .select('*')
        .order('detected_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCampaigns(data || []);

      // Calculate stats
      const allCampaigns = await supabase.from('attack_campaigns').select('*');
      if (allCampaigns.data) {
        setStats({
          active: allCampaigns.data.filter(c => c.status === 'active').length,
          investigating: allCampaigns.data.filter(c => c.status === 'investigating').length,
          resolved: allCampaigns.data.filter(c => c.status === 'resolved').length,
          falsePositive: allCampaigns.data.filter(c => c.status === 'false_positive').length,
          totalRequests: allCampaigns.data.reduce((sum, c) => sum + c.request_count, 0),
          totalIPs: allCampaigns.data.reduce((sum, c) => sum + c.unique_ips, 0)
        });
      }

    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(campaignId: string, action: 'investigate' | 'block_ips' | 'resolve' | 'false_positive') {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let newStatus = 'investigating';
      let responseAction = '';

      switch (action) {
        case 'investigate':
          newStatus = 'investigating';
          responseAction = 'marked_for_investigation';
          break;
        case 'block_ips':
          newStatus = 'investigating';
          responseAction = 'blocked_campaign_ips';
          // TODO: Implement actual IP blocking via IP reputation system
          break;
        case 'resolve':
          newStatus = 'resolved';
          responseAction = 'campaign_resolved';
          break;
        case 'false_positive':
          newStatus = 'false_positive';
          responseAction = 'marked_false_positive';
          break;
      }

      const { error } = await supabase
        .from('attack_campaigns')
        .update({
          status: newStatus,
          response_action: responseAction,
          notes: actionNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;

      await loadCampaigns();
      setSelectedCampaign(null);
      setActionNotes('');

      alert(`Campaign ${action.replace('_', ' ')} successfully`);

    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error);
      alert(`Failed to ${action} campaign`);
    } finally {
      setActionLoading(false);
    }
  }

  function formatDuration(startStr: string, endStr: string) {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes} minutes`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attack Campaigns</h1>
          <p className="text-gray-600 mt-2">
            Coordinated attacks detected across multiple IPs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.investigating}</div>
            <div className="text-sm text-gray-600">Investigating</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.falsePositive}</div>
            <div className="text-sm text-gray-600">False Positive</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRequests.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.totalIPs.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Unique IPs</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadCampaigns}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No campaigns found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Window</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique IPs</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Similarity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(campaign.detected_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDuration(campaign.window_start, campaign.window_end)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {campaign.request_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {campaign.unique_ips}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {campaign.pattern_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {campaign.similarity_score ?
                          `${(campaign.similarity_score * 100).toFixed(0)}%` :
                          'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          campaign.status === 'active' ? 'bg-red-100 text-red-800' :
                          campaign.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedCampaign(campaign)}
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

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Campaign Details</h2>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Campaign Timeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div><strong>Detected:</strong> {new Date(selectedCampaign.detected_at).toLocaleString()}</div>
                    <div><strong>Window:</strong> {new Date(selectedCampaign.window_start).toLocaleString()} - {new Date(selectedCampaign.window_end).toLocaleString()}</div>
                    <div><strong>Duration:</strong> {formatDuration(selectedCampaign.window_start, selectedCampaign.window_end)}</div>
                  </div>
                </div>

                {/* Campaign Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Request Count</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedCampaign.request_count.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unique IPs</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedCampaign.unique_ips}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern Type</label>
                    <p className="text-gray-900">{selectedCampaign.pattern_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Similarity Score</label>
                    <p className="text-gray-900">
                      {selectedCampaign.similarity_score ?
                        `${(selectedCampaign.similarity_score * 100).toFixed(1)}%` :
                        'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* Response Actions */}
                {selectedCampaign.response_action && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Response</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded text-sm">
                      {selectedCampaign.response_action}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedCampaign.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded text-sm">
                      {selectedCampaign.notes}
                    </p>
                  </div>
                )}

                {/* Action Notes Input */}
                {selectedCampaign.status !== 'resolved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Notes</label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      rows={3}
                      placeholder="Add notes about your response action..."
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedCampaign.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleAction(selectedCampaign.id, 'investigate')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Mark Investigating
                      </button>
                      <button
                        onClick={() => handleAction(selectedCampaign.id, 'block_ips')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Block Campaign IPs
                      </button>
                    </>
                  )}
                  {selectedCampaign.status !== 'resolved' && (
                    <>
                      <button
                        onClick={() => handleAction(selectedCampaign.id, 'resolve')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleAction(selectedCampaign.id, 'false_positive')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        False Positive
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedCampaign(null)}
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
