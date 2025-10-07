/**
 * DELETE /api/admin/whitelist/[ip]
 *
 * Admin endpoint: Remove IP from whitelist
 *
 * Body Parameters:
 * - reason: Required - Reason for removal
 *
 * Authorization: Admin only
 */

import { supabase } from '../../../lib/supabase.js';
import { removeFromWhitelist, isUserAdmin } from '../../../lib/ip-management.js';

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
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

    // Remove from whitelist
    const result = await removeFromWhitelist(ip, reason.trim(), keyData.user_id);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to remove from whitelist' });
    }

    return res.status(200).json({
      success: true,
      message: `IP ${ip} removed from whitelist`,
      reason: reason.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in whitelist/[ip] endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
