// Vercel Cron Job: Pattern Discovery (Phase 6)
// Runs daily at 3:00 AM UTC to discover new attack patterns
import { runPatternDiscovery } from '../../lib/pattern-discovery.js';
import { logJobMetrics } from '../../lib/alert-notifier.js';

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized execution
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();

  try {
    console.log('[Cron] Pattern Discovery: Starting...');

    const result = await runPatternDiscovery();

    const duration = Date.now() - startTime;

    // Log metrics
    await logJobMetrics({
      jobName: 'pattern_discovery',
      jobStatus: result.success ? 'success' : 'error',
      duration,
      recordsProcessed: result.patternsDiscovered || 0,
      metadata: {
        patterns_discovered: result.patternsDiscovered,
        samples_analyzed: result.samplesAnalyzed,
        ai_calls: result.aiCalls
      }
    });

    console.log(`[Cron] Pattern Discovery: Completed in ${duration}ms`);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      timestamp: new Date().toISOString(),
      duration,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Cron] Pattern Discovery: Error', error);

    // Log failed job
    await logJobMetrics({
      jobName: 'pattern_discovery',
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
  maxDuration: 300 // 5 minutes for AI analysis
};
