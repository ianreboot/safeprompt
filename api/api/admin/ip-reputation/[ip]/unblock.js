/**
 * POST /api/admin/ip-reputation/[ip]/unblock
 *
 * Admin endpoint: Unblock a manually blocked IP address
 *
 * Body Parameters:
 * - reason: Required - Reason for unblocking
 *
 * Authorization: Admin only
 */

import { supabase } from '../../../../lib/supabase.js';
import { unblockIp, isUserAdmin } from '../../../../lib/ip-management.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get IP from URL parameter
    const { ip } = req.query;
    if (!ip) {
      return res.status(400).json({ error: 'IP parameter required' });
    }

    // Get reason from body
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason required (non-empty string)' });
    }

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

    // Unblock the IP
    const result = await unblockIp(ip, reason.trim(), keyData.user_id);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to unblock IP' });
    }

    return res.status(200).json({
      success: true,
      message: `IP ${ip} has been unblocked`,
      reason: reason.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in unblock endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
