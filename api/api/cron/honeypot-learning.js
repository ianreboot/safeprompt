// Vercel Cron Job: Honeypot Learning (Phase 6)
// Runs daily at 4:00 AM UTC to auto-deploy patterns from honeypot data
import { learnFromHoneypot } from '../../lib/honeypot-learner.js';
import { logJobMetrics } from '../../lib/alert-notifier.js';

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized execution
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();

  try {
    console.log('[Cron] Honeypot Learning: Starting...');

    const result = await learnFromHoneypot();

    const duration = Date.now() - startTime;

    // Log metrics
    await logJobMetrics({
      jobName: 'honeypot_learning',
      jobStatus: result.success ? 'success' : 'error',
      duration,
      recordsProcessed: result.patternsAutoDeployed || 0,
      metadata: {
        patterns_auto_deployed: result.patternsAutoDeployed,
        requests_analyzed: result.requestsAnalyzed,
        sql_patterns: result.sqlPatterns,
        xss_patterns: result.xssPatterns,
        command_patterns: result.commandPatterns
      }
    });

    console.log(`[Cron] Honeypot Learning: Completed in ${duration}ms`);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      timestamp: new Date().toISOString(),
      duration,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Cron] Honeypot Learning: Error', error);

    // Log failed job
    await logJobMetrics({
      jobName: 'honeypot_learning',
      jobStatus: 'error',
      duration,
      recordsProcessed: 0,
      errorMessage: error.message,
      metadata: { error_code: error.code }
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration
    });
  }
}

// Export config for Vercel Cron
export const config = {
  maxDuration: 180 // 3 minutes for pattern extraction and deployment
};
