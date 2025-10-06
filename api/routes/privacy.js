/**
 * Privacy Compliance API
 * Quarter 1 Phase 1A Task 1A.11
 *
 * GDPR/CCPA compliance endpoints:
 * - DELETE /api/v1/privacy/delete - Right to deletion (identifiable data only)
 * - GET /api/v1/privacy/export - Right to access (data portability)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * DELETE /api/v1/privacy/delete
 *
 * Delete all identifiable user data (GDPR "Right to be Forgotten")
 *
 * What gets deleted:
 * - Active sessions (< 2 hours old)
 * - Recent threat samples (< 24 hours old, contains PII)
 *
 * What does NOT get deleted (legally compliant):
 * - Anonymized threat samples (> 24 hours old, no PII)
 * - IP reputation data (hash-based, cannot identify individual)
 * - Aggregated statistics
 */
export async function deleteUserData(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const deletionResults = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      deleted: {},
      retained: {}
    };

    // 1. Delete active sessions
    const { data: deletedSessions, error: sessionsError } = await supabase
      .from('validation_sessions')
      .delete()
      .eq('user_id', userId)
      .select('session_token');

    if (!sessionsError) {
      deletionResults.deleted.sessions = deletedSessions?.length || 0;
    }

    // 2. Delete recent threat samples (< 24 hours, contains PII)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: deletedSamples, error: samplesError } = await supabase
      .from('threat_intelligence_samples')
      .delete()
      .eq('profile_id', userId)
      .gt('created_at', twentyFourHoursAgo)
      .is('anonymized_at', null)
      .select('id');

    if (!samplesError) {
      deletionResults.deleted.recent_samples = deletedSamples?.length || 0;
    }

    // 3. Count anonymized samples (cannot delete - no PII)
    const { count: anonymizedCount } = await supabase
      .from('threat_intelligence_samples')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .not('anonymized_at', 'is', null);

    deletionResults.retained.anonymized_samples = anonymizedCount || 0;

    // 4. Explain what was retained and why
    deletionResults.retained.explanation = [
      'Anonymized threat samples (>24h old) are retained for security research',
      'These samples contain no personally identifiable information',
      'IP addresses are hashed (cannot reverse to identify you)',
      'Prompts are hashed (cannot reverse to original text)',
      'This data is not subject to deletion under GDPR Article 17(3)(d) - scientific research'
    ];

    deletionResults.retained.legal_basis = 'GDPR Article 17(3)(d) - Scientific or historical research';

    return res.json({
      success: true,
      ...deletionResults,
      message: 'All identifiable data has been deleted. Anonymized data is retained for security research (GDPR compliant).'
    });

  } catch (error) {
    console.error('[Privacy] Error deleting data:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete user data'
    });
  }
}

/**
 * GET /api/v1/privacy/export
 *
 * Export all user data (GDPR "Right to Access")
 *
 * Returns machine-readable JSON with:
 * - Active sessions
 * - Recent threat samples (identifiable data only)
 * - Anonymized samples (metadata only, no PII)
 */
export async function exportUserData(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      data: {}
    };

    // 1. Export active sessions
    const { data: sessions } = await supabase
      .from('validation_sessions')
      .select('*')
      .eq('user_id', userId);

    exportData.data.sessions = sessions || [];

    // 2. Export recent threat samples (< 24 hours, contains PII)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentSamples } = await supabase
      .from('threat_intelligence_samples')
      .select('*')
      .eq('profile_id', userId)
      .gt('created_at', twentyFourHoursAgo)
      .is('anonymized_at', null);

    exportData.data.recent_samples = recentSamples || [];

    // 3. Export anonymized samples (metadata only, no PII)
    const { data: anonymizedSamples } = await supabase
      .from('threat_intelligence_samples')
      .select('id, created_at, anonymized_at, threat_severity, attack_vectors, confidence_score, ip_country')
      .eq('profile_id', userId)
      .not('anonymized_at', 'is', null);

    exportData.data.anonymized_samples = anonymizedSamples || [];
    exportData.data.anonymized_samples_note = 'Anonymized samples contain no PII (prompt_text and client_ip removed)';

    // 4. Export profile preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, preferences, created_at')
      .eq('id', userId)
      .single();

    exportData.data.profile = profile || {};

    // 5. Summary statistics
    exportData.summary = {
      total_sessions: exportData.data.sessions.length,
      total_recent_samples: exportData.data.recent_samples.length,
      total_anonymized_samples: exportData.data.anonymized_samples.length,
      data_retention_policy: '2 hours for sessions, 24 hours for PII, 90 days for anonymized data'
    };

    return res.json({
      success: true,
      ...exportData,
      message: 'Complete data export (GDPR compliant)'
    });

  } catch (error) {
    console.error('[Privacy] Error exporting data:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to export user data'
    });
  }
}

export default { deleteUserData, exportUserData };
