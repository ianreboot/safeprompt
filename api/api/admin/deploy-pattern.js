/**
 * Pattern Deployment API Endpoint
 *
 * POST /api/admin/deploy-pattern
 *
 * Deploy approved pattern to production validator
 *
 * Phase 6.2.6: Pattern deployment workflow
 */

import { deployPatternToProduction, rollbackPattern } from '../../lib/pattern-deployment.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  // Verify admin role (check if user email is ian.ho@rebootmedia.net)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.email !== 'ian.ho@rebootmedia.net') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Get pattern ID and action from request
  const { proposalId, action } = req.body;

  if (!proposalId) {
    return res.status(400).json({ error: 'proposalId required' });
  }

  if (!action || !['deploy', 'rollback'].includes(action)) {
    return res.status(400).json({ error: 'action must be "deploy" or "rollback"' });
  }

  try {
    if (action === 'deploy') {
      const result = await deployPatternToProduction(proposalId);

      if (!result.success) {
        return res.status(400).json({
          error: 'Deployment failed',
          reason: result.reason,
          testResults: result.testResults
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pattern deployed to production',
        testResults: result.testResults,
        pattern: result.patternEntry
      });

    } else if (action === 'rollback') {
      const result = await rollbackPattern(proposalId);

      if (!result.success) {
        return res.status(400).json({
          error: 'Rollback failed',
          reason: result.reason
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pattern rolled back from production'
      });
    }

  } catch (error) {
    console.error('[Deploy Pattern API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
