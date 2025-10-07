/**
 * /api/admin/blacklist
 *
 * Admin endpoint: Blacklist management
 *
 * GET: List all blacklisted IPs
 * POST: Add IP to blacklist
 *
 * Authorization: Admin only
 */

import { supabase } from '../../lib/supabase.js';
import { addToBlacklist, isUserAdmin } from '../../lib/ip-management.js';

export default async function handler(req, res) {
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

    // Handle GET - List blacklist
    if (req.method === 'GET') {
      const {
        limit = '100',
        offset = '0',
        active_only = 'true',
        severity = null
      } = req.query;

      const limitNum = Math.min(parseInt(limit, 10) || 100, 500);
      const offsetNum = parseInt(offset, 10) || 0;
      const activeOnly = active_only !== 'false';

      let query = supabase
        .from('ip_blacklist')
        .select('*', { count: 'exact' });

      if (activeOnly) {
        query = query.or('expires_at.is.null,expires_at.gt.now()');
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      query = query.order('added_at', { ascending: false });
      query = query.range(offsetNum, offsetNum + limitNum - 1);

      const { data, error, count } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        data: data || [],
        total: count || 0,
        limit: limitNum,
        offset: offsetNum,
        timestamp: new Date().toISOString()
      });
    }

    // Handle POST - Add to blacklist
    if (req.method === 'POST') {
      const { ip, reason, severity, source = null, expires_at = null } = req.body;

      if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ error: 'IP address required (string)' });
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Reason required (non-empty string)' });
      }

      if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
        return res.status(400).json({ error: 'Severity required (low, medium, high, critical)' });
      }

      // Parse expiration date if provided
      let expiresAt = null;
      if (expires_at) {
        expiresAt = new Date(expires_at);
        if (isNaN(expiresAt.getTime())) {
          return res.status(400).json({ error: 'Invalid expires_at date format' });
        }
      }

      // Add to blacklist
      const result = await addToBlacklist(
        ip.trim(),
        reason.trim(),
        severity,
        keyData.user_id,
        source,
        expiresAt
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Failed to add to blacklist' });
      }

      return res.status(201).json({
        success: true,
        message: `IP ${ip} added to blacklist with severity ${severity}`,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in blacklist endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
