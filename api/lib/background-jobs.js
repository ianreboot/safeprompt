/**
 * Background Jobs for Threat Intelligence System
 * Quarter 1 Phase 1A Tasks 1A.8-1A.9
 *
 * Critical jobs:
 * - 24-hour PII anonymization (GDPR/CCPA compliance)
 * - IP reputation scoring (hourly updates)
 * - Session cleanup (2-hour retention)
 * - Expired sample cleanup (90-day retention)
 */

import { createClient } from '@supabase/supabase-js';
import { updateIPReputationScores } from './ip-reputation.js';
import { runPatternDiscovery } from './pattern-discovery.js';

// Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Task 1A.8: Anonymize threat samples older than 24 hours
 *
 * CRITICAL: This job MUST run successfully for legal compliance
 * Deletes PII: prompt_text, prompt_compressed, client_ip
 *
 * @returns {object} Job result with count and status
 */
export async function anonymizeThreatSamples() {
  const startTime = Date.now();

  try {
    console.log('[BackgroundJobs] Starting threat sample anonymization...');

    // Call Supabase function
    const { data, error } = await supabase.rpc('anonymize_threat_samples');

    if (error) {
      console.error('[BackgroundJobs] CRITICAL - Anonymization failed:', error.message);

      // Alert on failure (critical compliance issue)
      await sendAnonymizationAlert({
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error,
        rowsAnonymized: 0,
        executionTime: Date.now() - startTime
      };
    }

    const rowsAnonymized = data || 0;

    console.log('[BackgroundJobs] Anonymization complete:', {
      rowsAnonymized,
      duration: Date.now() - startTime
    });

    // Alert if unexpectedly high volume (potential issue)
    if (rowsAnonymized > 10000) {
      console.warn('[BackgroundJobs] High volume anonymization:', {
        rowsAnonymized,
        threshold: 10000
      });

      await sendAnonymizationAlert({
        status: 'HIGH_VOLUME',
        rowsAnonymized,
        threshold: 10000,
        timestamp: new Date().toISOString()
      });
    }

    return {
      success: true,
      rowsAnonymized,
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('[BackgroundJobs] CRITICAL - Anonymization error:', error.message);

    await sendAnonymizationAlert({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error,
      rowsAnonymized: 0,
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Task 1A.9: Update IP reputation scores
 *
 * Runs hourly to recalculate reputation scores from recent samples
 * Excludes allowlisted IPs from scoring
 *
 * @returns {object} Job result with count and status
 */
export async function updateReputationScores() {
  const startTime = Date.now();

  try {
    console.log('[BackgroundJobs] Starting IP reputation score update...');

    const updatedCount = await updateIPReputationScores();

    console.log('[BackgroundJobs] Reputation update complete:', {
      scoresUpdated: updatedCount,
      duration: Date.now() - startTime
    });

    return {
      success: true,
      scoresUpdated: updatedCount
    };

  } catch (error) {
    console.error('[BackgroundJobs] Reputation update error:', error.message);

    return {
      success: false,
      error,
      scoresUpdated: 0
    };
  }
}

/**
 * Clean up expired validation sessions
 *
 * Deletes sessions older than 2 hours (hard limit)
 *
 * @returns {object} Job result with count and status
 */
export async function cleanupExpiredSessions() {
  const startTime = Date.now();

  try {
    console.log('[BackgroundJobs] Starting session cleanup...');

    // Delete sessions older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('validation_sessions')
      .delete()
      .lt('created_at', twoHoursAgo)
      .select('session_token');

    if (error) {
      console.error('[BackgroundJobs] Session cleanup error:', error.message);
      return {
        success: false,
        error,
        sessionsDeleted: 0
      };
    }

    const sessionsDeleted = data?.length || 0;

    console.log('[BackgroundJobs] Cleaned up sessions:', sessionsDeleted);

    return {
      success: true,
      sessionsDeleted
    };

  } catch (error) {
    console.error('[BackgroundJobs] Session cleanup error:', error.message);
    return {
      success: false,
      error,
      sessionsDeleted: 0
    };
  }
}

/**
 * Clean up expired threat samples (90-day retention)
 *
 * @returns {object} Job result with count and status
 */
export async function cleanupExpiredSamples() {
  const startTime = Date.now();

  try {
    console.log('[BackgroundJobs] Starting expired sample cleanup...');

    // Delete samples older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('threat_intelligence_samples')
      .delete()
      .lt('expires_at', ninetyDaysAgo)
      .select('id');

    if (error) {
      console.error('[BackgroundJobs] Sample cleanup error:', error.message);
      return {
        success: false,
        error,
        samplesDeleted: 0
      };
    }

    const samplesDeleted = data?.length || 0;

    console.log('[BackgroundJobs] Cleaned up samples:', samplesDeleted);

    return {
      success: true,
      samplesDeleted
    };

  } catch (error) {
    console.error('[BackgroundJobs] Sample cleanup error:', error.message);
    return {
      success: false,
      error,
      samplesDeleted: 0
    };
  }
}

/**
 * Send alert for anonymization failures
 *
 * CRITICAL: Anonymization failures are legal compliance issues
 * Should trigger immediate notification to admin
 */
async function sendAnonymizationAlert(alertData) {
  try {
    // Store alert in database for admin dashboard
    await supabase
      .from('system_alerts')
      .insert({
        alert_type: 'anonymization',
        severity: alertData.status === 'FAILED' ? 'critical' : 'warning',
        data: alertData,
        created_at: new Date().toISOString()
      });

    // TODO: Add email/Slack notification for critical alerts
    if (alertData.status === 'FAILED' || alertData.status === 'ERROR') {
      console.error('🚨 CRITICAL ALERT: Anonymization failure - manual intervention required');
      // Future: Send email to admin
      // Future: Send Slack notification
    }

  } catch (error) {
    console.error('[BackgroundJobs] Failed to send alert:', error.message);
  }
}

/**
 * Run all hourly jobs
 *
 * Should be called by cron or scheduler every hour
 */
export async function runHourlyJobs() {
  console.log('[BackgroundJobs] Running hourly jobs...');

  const results = {
    timestamp: new Date().toISOString(),
    jobs: {}
  };

  // Job 1: Anonymize samples (CRITICAL - runs first)
  results.jobs.anonymization = await anonymizeThreatSamples();

  // Job 2: Update IP reputation scores
  results.jobs.reputationScores = await updateReputationScores();

  // Job 3: Clean up expired sessions
  results.jobs.sessionCleanup = await cleanupExpiredSessions();

  console.log('[BackgroundJobs] Hourly jobs complete:', results);

  return results;
}

/**
 * Run daily jobs
 *
 * Should be called by cron or scheduler once per day
 */
export async function runDailyJobs() {
  console.log('[BackgroundJobs] Running daily jobs...');

  const results = {
    timestamp: new Date().toISOString(),
    jobs: {}
  };

  // Job 1: Clean up expired samples (90-day retention)
  results.jobs.sampleCleanup = await cleanupExpiredSamples();

  // Job 2: Pattern discovery analysis (Phase 6.2)
  try {
    console.log('[BackgroundJobs] Running pattern discovery...');
    results.jobs.patternDiscovery = await runPatternDiscovery();
  } catch (error) {
    console.error('[BackgroundJobs] Pattern discovery failed:', error);
    results.jobs.patternDiscovery = {
      success: false,
      error: error.message
    };
  }

  console.log('[BackgroundJobs] Daily jobs complete:', results);

  return results;
}

/**
 * Get job status and metrics
 *
 * For monitoring dashboard
 */
export async function getJobMetrics() {
  try {
    // Get counts
    const [samplesResult, sessionsResult, reputationResult] = await Promise.all([
      // Samples awaiting anonymization
      supabase
        .from('threat_intelligence_samples')
        .select('id', { count: 'exact', head: true })
        .is('anonymized_at', null)
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // Active sessions
      supabase
        .from('validation_sessions')
        .select('id', { count: 'exact', head: true }),

      // IP reputation entries
      supabase
        .from('ip_reputation')
        .select('id', { count: 'exact', head: true })
    ]);

    return {
      samplesAwaitingAnonymization: samplesResult.count || 0,
      activeSessions: sessionsResult.count || 0,
      ipReputationEntries: reputationResult.count || 0,
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error('[BackgroundJobs] Error getting metrics:', error.message);
    return null;
  }
}

export default {
  anonymizeThreatSamples,
  updateReputationScores,
  cleanupExpiredSessions,
  cleanupExpiredSamples,
  runHourlyJobs,
  runDailyJobs,
  getJobMetrics
};
