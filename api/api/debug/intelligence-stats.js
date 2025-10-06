/**
 * Debug endpoint to check intelligence collection stats
 * GET /api/debug/intelligence-stats
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('threat_intelligence_samples')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Get recent samples (last 10)
    const { data: samples, error: samplesError } = await supabase
      .from('threat_intelligence_samples')
      .select('id, created_at, subscription_tier, threat_severity, attack_vectors, confidence_score, anonymized_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (samplesError) {
      throw samplesError;
    }

    // Get stats by tier
    const { data: tierStats, error: tierError } = await supabase
      .from('threat_intelligence_samples')
      .select('subscription_tier')
      .order('subscription_tier');

    if (tierError) {
      throw tierError;
    }

    const tierCounts = tierStats.reduce((acc, s) => {
      acc[s.subscription_tier] = (acc[s.subscription_tier] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      total: count,
      recent_samples: samples,
      by_tier: tierCounts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Intelligence stats error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
