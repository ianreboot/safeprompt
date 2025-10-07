/**
 * GET /api/admin/audit-log
 *
 * Admin endpoint: Retrieve IP management audit trail
 *
 * Query Parameters:
 * - limit: Number of records to return (default: 100, max: 500)
 * - offset: Pagination offset (default: 0)
 * - action_type: Filter by action type (block, unblock, whitelist_add, whitelist_remove, blacklist_add, blacklist_remove, reputation_update)
 * - ip: Filter by specific IP address
 * - admin_user_id: Filter by admin user ID
 *
 * Authorization: Admin only
 */

import { supabase } from '../../lib/supabase.js';
import { getAuditLog, isUserAdmin } from '../../lib/ip-management.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify API key and get user
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

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
      limit = '100',
      offset = '0',
      action_type = null,
      ip = null,
      admin_user_id = null
    } = req.query;

    // Validate and sanitize inputs
    const limitNum = Math.min(parseInt(limit, 10) || 100, 500);
    const offsetNum = parseInt(offset, 10) || 0;

    // Get audit log
    const result = await getAuditLog({
      limit: limitNum,
      offset: offsetNum,
      action_type,
      ip,
      admin_user_id
    });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      data: result.data,
      total: result.total,
      limit: limitNum,
      offset: offsetNum,
      filters: {
        action_type,
        ip,
        admin_user_id
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in audit-log endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
