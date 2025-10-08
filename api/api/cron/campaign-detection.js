// Vercel Cron Job: Campaign Detection (Phase 6)
// Runs daily at 3:30 AM UTC to detect coordinated attack campaigns
import { detectCampaigns } from '../../lib/campaign-detector.js';
import { logJobMetrics } from '../../lib/alert-notifier.js';

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized execution
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();

  try {
    console.log('[Cron] Campaign Detection: Starting...');

    const result = await detectCampaigns();

    const duration = Date.now() - startTime;

    // Log metrics
    await logJobMetrics({
      jobName: 'campaign_detection',
      jobStatus: result.success ? 'success' : 'error',
      duration,
      recordsProcessed: result.campaignsDetected || 0,
      metadata: {
        campaigns_detected: result.campaignsDetected,
        samples_analyzed: result.samplesAnalyzed,
        temporal_campaigns: result.temporalCampaigns,
        similarity_campaigns: result.similarityCampaigns
      }
    });

    console.log(`[Cron] Campaign Detection: Completed in ${duration}ms`);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      timestamp: new Date().toISOString(),
      duration,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Cron] Campaign Detection: Error', error);

    // Log failed job
    await logJobMetrics({
      jobName: 'campaign_detection',
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
  maxDuration: 120 // 2 minutes for pattern analysis
};
