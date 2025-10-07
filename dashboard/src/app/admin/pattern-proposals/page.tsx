'use client';

/**
 * Pattern Proposal Review Dashboard
 *
 * Phase 6.2.5: Admin interface for reviewing AI-discovered attack patterns
 *
 * Features:
 * - View all proposed patterns (pending, approved, rejected, deployed)
 * - Filter by status, pattern type, AI-generated vs rule-based
 * - Approve/Reject/Defer with admin notes
 * - View AI reasoning, confidence scores, and example matches
 * - Track deployment status to production
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PatternProposal {
  id: string;
  proposed_pattern: string;
  pattern_type: 'substring' | 'encoding' | 'regex' | 'ai_proposed';
  reasoning: string;
  frequency_count: number;
  example_matches: any;
  status: 'pending' | 'approved' | 'rejected' | 'deployed';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  deployed_to_production: boolean;
  deployed_at?: string;
  confidence_score?: number;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface ProposalStats {
  pending: number;
  approved: number;
  rejected: number;
  deployed: number;
  aiGenerated: number;
  ruleBased: number;
}

export default function PatternProposalsPage() {
  const [proposals, setProposals] = useState<PatternProposal[]>([]);
  const [stats, setStats] = useState<ProposalStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    deployed: 0,
    aiGenerated: 0,
    ruleBased: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deployed'>('pending');
  const [aiFilter, setAiFilter] = useState<'all' | 'ai' | 'rule'>('all');
  const [selectedProposal, setSelectedProposal] = useState<PatternProposal | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadProposals();
  }, [filter, aiFilter]);

  async function loadProposals() {
    setLoading(true);
    try {
      let query = supabase
        .from('pattern_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply AI filter
      if (aiFilter === 'ai') {
        query = query.eq('ai_generated', true);
      } else if (aiFilter === 'rule') {
        query = query.eq('ai_generated', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProposals(data || []);

      // Calculate stats
      const allProposals = await supabase.from('pattern_proposals').select('*');
      if (allProposals.data) {
        setStats({
          pending: allProposals.data.filter(p => p.status === 'pending').length,
          approved: allProposals.data.filter(p => p.status === 'approved').length,
          rejected: allProposals.data.filter(p => p.status === 'rejected').length,
          deployed: allProposals.data.filter(p => p.status === 'deployed').length,
          aiGenerated: allProposals.data.filter(p => p.ai_generated).length,
          ruleBased: allProposals.data.filter(p => !p.ai_generated).length
        });
      }

    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(proposalId: string, action: 'approve' | 'reject' | 'defer') {
    if (!actionNotes && action !== 'defer') {
      alert('Please provide review notes');
      return;
    }

    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';

      const { error } = await supabase
        .from('pattern_proposals')
        .update({
          status: newStatus,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: actionNotes || null
        })
        .eq('id', proposalId);

      if (error) throw error;

      // Reload proposals
      await loadProposals();
      setSelectedProposal(null);
      setActionNotes('');

      alert(`Pattern ${action}d successfully`);

    } catch (error) {
      console.error(`Failed to ${action} proposal:`, error);
      alert(`Failed to ${action} proposal`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeploy(proposalId: string) {
    if (!confirm('Deploy this pattern to production? This will immediately start blocking matching prompts.')) {
      return;
    }

    setActionLoading(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call deployment API
      const response = await fetch('/api/admin/deploy-pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          proposalId,
          action: 'deploy'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.reason === 'test_metrics_failed') {
          alert(`Deployment blocked: Pattern failed testing\n\nFalse Positive Rate: ${(result.testResults.falsePositiveRate * 100).toFixed(1)}%\nCatch Rate: ${(result.testResults.catchRate * 100).toFixed(1)}%`);
        } else if (result.reason === 'requires_manual_review') {
          alert(`Deployment requires additional review\n\nMetrics:\n- Catch Rate: ${(result.testResults.catchRate * 100).toFixed(1)}%\n- False Positive Rate: ${(result.testResults.falsePositiveRate * 100).toFixed(1)}%\n\nPlease review manually before deploying.`);
        } else {
          throw new Error(result.error || 'Deployment failed');
        }
        await loadProposals();
        setSelectedProposal(null);
        return;
      }

      await loadProposals();
      setSelectedProposal(null);

      alert(`Pattern deployed to production!\n\nTest Results:\n- Catch Rate: ${(result.testResults.catchRate * 100).toFixed(1)}%\n- False Positive Rate: ${(result.testResults.falsePositiveRate * 100).toFixed(1)}%\n- Confidence: ${(result.testResults.confidence * 100).toFixed(0)}%`);

    } catch (error) {
      console.error('Failed to deploy proposal:', error);
      alert(`Failed to deploy proposal: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pattern Proposals</h1>
          <p className="text-gray-600 mt-2">
            Review AI-discovered attack patterns and approve for deployment
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.deployed}</div>
            <div className="text-sm text-gray-600">Deployed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.aiGenerated}</div>
            <div className="text-sm text-gray-600">AI-Generated</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.ruleBased}</div>
            <div className="text-sm text-gray-600">Rule-Based</div>
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="deployed">Deployed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={aiFilter}
                onChange={(e) => setAiFilter(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All</option>
                <option value="ai">AI-Generated</option>
                <option value="rule">Rule-Based</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadProposals}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No proposals found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {proposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {proposal.proposed_pattern.substring(0, 50)}
                          {proposal.proposed_pattern.length > 50 ? '...' : ''}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {proposal.pattern_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {proposal.ai_generated ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">AI</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Rule</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {proposal.confidence_score ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            proposal.confidence_score >= 0.9 ? 'bg-green-100 text-green-800' :
                            proposal.confidence_score >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(proposal.confidence_score * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{proposal.frequency_count}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {proposal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedProposal(proposal)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Review
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

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Pattern Proposal</h2>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Pattern Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Pattern</label>
                  <code className="block bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {selectedProposal.proposed_pattern}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern Type</label>
                    <p className="text-gray-900">{selectedProposal.pattern_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <p className="text-gray-900">{selectedProposal.ai_generated ? 'AI-Generated' : 'Rule-Based'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Score</label>
                    <p className="text-gray-900">
                      {selectedProposal.confidence_score ?
                        `${(selectedProposal.confidence_score * 100).toFixed(1)}%` :
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency Count</label>
                    <p className="text-gray-900">{selectedProposal.frequency_count} occurrences</p>
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AI Reasoning</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded text-sm">
                    {selectedProposal.reasoning}
                  </p>
                </div>

                {/* Example Matches */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Example Matches</label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedProposal.example_matches, null, 2)}
                  </pre>
                </div>

                {/* Review Notes */}
                {selectedProposal.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      rows={3}
                      placeholder="Explain your decision..."
                    />
                  </div>
                )}

                {/* Existing Review Notes */}
                {selectedProposal.review_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Review Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded text-sm">
                      {selectedProposal.review_notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedProposal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(selectedProposal.id, 'approve')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(selectedProposal.id, 'reject')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(selectedProposal.id, 'defer')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        Defer
                      </button>
                    </>
                  )}
                  {selectedProposal.status === 'approved' && !selectedProposal.deployed_to_production && (
                    <button
                      onClick={() => handleDeploy(selectedProposal.id)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Deploy to Production
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedProposal(null)}
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
