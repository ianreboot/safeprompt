/**
 * Admin API: Pattern Discovery
 *
 * Endpoint to manually trigger pattern discovery analysis
 * or retrieve discovery statistics.
 *
 * POST /api/admin/pattern-discovery - Run pattern discovery
 * GET /api/admin/pattern-discovery - Get stats
 */

import { runPatternDiscovery, getPatternDiscoveryStats } from '../../lib/pattern-discovery.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin emails (in production, use proper role-based access)
const ADMIN_EMAILS = ['ian.ho@rebootmedia.net'];

export default async function handler(req, res) {
  // Verify admin access
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user || !ADMIN_EMAILS.includes(user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    if (req.method === 'POST') {
      // Run pattern discovery
      console.log('[Admin API] Running pattern discovery...');

      const result = await runPatternDiscovery();

      return res.status(200).json({
        success: result.success,
        message: 'Pattern discovery completed',
        data: result
      });

    } else if (req.method === 'GET') {
      // Get statistics
      const stats = await getPatternDiscoveryStats();

      return res.status(200).json({
        success: true,
        stats
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[Admin API] Pattern discovery error:', error);
    return res.status(500).json({
      error: 'Pattern discovery failed',
      message: error.message
    });
  }
}
