// Vercel Cron Job: Intelligence System Cleanup (Phase 1A)
// Runs hourly to maintain privacy compliance and system health
import { createClient } from '@supabase/supabase-js';
import { logJobMetrics, checkAnonymizationSuccessRate } from '../../lib/alert-notifier.js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized execution
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      jobs: []
    };

    // ====================================================================
    // JOB 1: Clean up old sessions (>2 hours)
    // ====================================================================
    try {
      const { data: sessionCleanup, error: sessionError } = await supabase
        .rpc('cleanup_old_sessions');

      if (sessionError) throw sessionError;

      results.jobs.push({
        name: 'session_cleanup',
        status: 'success',
        sessions_deleted: sessionCleanup?.[0]?.sessions_deleted || 0
      });
    } catch (error) {
      results.jobs.push({
        name: 'session_cleanup',
        status: 'error',
        error: error.message
      });
    }

    // ====================================================================
    // JOB 2: Anonymize old intelligence samples (>24h)
    // ====================================================================
    const anonStart = Date.now();
    try {
      const { data: anonymization, error: anonymizeError } = await supabase
        .rpc('anonymize_old_intelligence_samples');

      if (anonymizeError) throw anonymizeError;

      const samplesAnonymized = anonymization?.[0]?.samples_anonymized || 0;

      results.jobs.push({
        name: 'sample_anonymization',
        status: 'success',
        samples_anonymized: samplesAnonymized
      });

      // Log job metrics (Task 1A.62)
      await logJobMetrics({
        jobName: 'anonymization',
        jobStatus: 'success',
        duration: Date.now() - anonStart,
        recordsProcessed: samplesAnonymized,
        metadata: { samples_anonymized: samplesAnonymized }
      });

      // CRITICAL: Alert if anonymization failed (legal compliance issue)
      if (anonymizeError) {
        await logCriticalError('ANONYMIZATION_FAILED', anonymizeError.message);
      }
    } catch (error) {
      results.jobs.push({
        name: 'sample_anonymization',
        status: 'error',
        error: error.message
      });

      // Log failed job metrics (Task 1A.62)
      await logJobMetrics({
        jobName: 'anonymization',
        jobStatus: 'error',
        duration: Date.now() - anonStart,
        recordsProcessed: 0,
        errorMessage: error.message,
        metadata: { error_code: error.code }
      });

      // Critical alert
      await logCriticalError('ANONYMIZATION_FAILED', error.message);
    }

    // Check anonymization success rate every hour (Task 1A.62)
    await checkAnonymizationSuccessRate();

    // ====================================================================
    // JOB 3: Update IP reputation scores
    // ====================================================================
    try {
      const { data: ipUpdate, error: ipError } = await supabase
        .rpc('update_ip_reputation_scores');

      if (ipError) throw ipError;

      results.jobs.push({
        name: 'ip_reputation_update',
        status: 'success',
        ips_updated: ipUpdate?.[0]?.ips_updated || 0
      });
    } catch (error) {
      results.jobs.push({
        name: 'ip_reputation_update',
        status: 'error',
        error: error.message
      });
    }

    // ====================================================================
    // JOB 4: Capture metrics snapshot (every 6 hours)
    // ====================================================================
    const currentHour = new Date().getHours();
    if (currentHour % 6 === 0) { // Run at 0, 6, 12, 18
      try {
        const { data: metrics, error: metricsError } = await supabase
          .rpc('capture_intelligence_metrics');

        if (metricsError) throw metricsError;

        results.jobs.push({
          name: 'metrics_capture',
          status: 'success',
          metrics: metrics?.[0] || {}
        });
      } catch (error) {
        results.jobs.push({
          name: 'metrics_capture',
          status: 'error',
          error: error.message
        });
      }
    }

    // ====================================================================
    // Return summary
    // ====================================================================
    const hasErrors = results.jobs.some(job => job.status === 'error');
    const statusCode = hasErrors ? 500 : 200;

    return res.status(statusCode).json({
      success: !hasErrors,
      ...results
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to log critical errors
async function logCriticalError(errorType, message) {
  // In production, this would send alerts via:
  // - Email to admin
  // - Slack webhook
  // - PagerDuty
  // - Sentry
  console.error(`[CRITICAL] ${errorType}:`, message);

  // For now, just log to console
  // TODO: Integrate with alerting system
}

// Export config for Vercel Cron
export const config = {
  // This endpoint is meant to be called by Vercel Cron, not directly
  // Add to vercel.json:
  // {
  //   "crons": [{
  //     "path": "/api/cron/intelligence-cleanup",
  //     "schedule": "0 * * * *"
  //   }]
  // }
};
