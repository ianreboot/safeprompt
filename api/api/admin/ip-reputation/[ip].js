/**
 * GET /api/admin/ip-reputation/[ip]
 *
 * Admin endpoint: Get detailed information for a specific IP
 *
 * Returns:
 * - IP reputation data
 * - Whitelist/blacklist status
 * - Recent audit log entries for this IP
 *
 * Authorization: Admin only
 */

import { supabase } from '../../../lib/supabase.js';
import { checkIpWhitelist, checkIpBlacklist, checkIpReputation, isUserAdmin } from '../../../lib/ip-management.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get IP from URL parameter
    const { ip } = req.query;
    if (!ip) {
      return res.status(400).json({ error: 'IP parameter required' });
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

    // Get comprehensive IP information
    const [
      whitelistResult,
      blacklistResult,
      reputationResult
    ] = await Promise.all([
      checkIpWhitelist(ip),
      checkIpBlacklist(ip),
      checkIpReputation(ip)
    ]);

    // Get recent audit log entries for this IP
    const { data: auditEntries } = await supabase
      .from('ip_admin_actions')
      .select('*')
      .eq('ip', ip)
      .order('created_at', { ascending: false })
      .limit(20);

    return res.status(200).json({
      ip,
      whitelist: {
        isWhitelisted: whitelistResult.isWhitelisted,
        reason: whitelistResult.reason,
        data: whitelistResult.data
      },
      blacklist: {
        isBlacklisted: blacklistResult.isBlacklisted,
        reason: blacklistResult.reason,
        severity: blacklistResult.severity,
        data: blacklistResult.data
      },
      reputation: {
        shouldBlock: reputationResult.shouldBlock,
        reason: reputationResult.reason,
        score: reputationResult.score,
        data: reputationResult.data
      },
      auditLog: auditEntries || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in ip-reputation/[ip] endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
