/**
 * GET /api/admin/ip-reputation
 *
 * Admin endpoint: List IP reputation records with filtering
 *
 * Query Parameters:
 * - limit: Number of records to return (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 * - score_min: Minimum reputation score filter (0.0-1.0)
 * - auto_block_only: Only show auto-blocked IPs (true/false)
 * - manually_blocked_only: Only show manually blocked IPs (true/false)
 * - order_by: Sort field (default: reputation_score)
 * - order_dir: Sort direction (asc/desc, default: desc)
 *
 * Authorization: Admin only
 */

import { supabase } from '../../lib/supabase.js';
import { getIpReputationList, isUserAdmin } from '../../lib/ip-management.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from API key (existing auth system)
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

    // Verify API key and get user
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, revoked')
      .eq('key', apiKey)
      .single();

    if (keyError || !keyData || keyData.revoked) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    // Check if user is admin
    const adminCheck = await isUserAdmin(keyData.user_id);
    if (!adminCheck) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Parse query parameters
    const {
      limit = '50',
      offset = '0',
      score_min = null,
      auto_block_only = 'false',
      manually_blocked_only = 'false',
      order_by = 'reputation_score',
      order_dir = 'desc'
    } = req.query;

    // Validate and sanitize inputs
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const offsetNum = parseInt(offset, 10) || 0;
    const scoreMin = score_min ? parseFloat(score_min) : null;
    const autoBlockOnly = auto_block_only === 'true';
    const manuallyBlockedOnly = manually_blocked_only === 'true';

    // Get IP reputation list
    const result = await getIpReputationList({
      limit: limitNum,
      offset: offsetNum,
      score_min: scoreMin,
      auto_block_only: autoBlockOnly,
      manually_blocked_only: manuallyBlockedOnly,
      order_by,
      order_dir
    });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      data: result.data,
      total: result.total,
      limit: limitNum,
      offset: offsetNum,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in ip-reputation endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
