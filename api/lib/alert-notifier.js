// Alert Notification System
// Handles creating alerts in database and sending email notifications via Resend

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL || process.env.SAFEPROMPT_SUPABASE_URL || '',
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY || process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || ''
);

const resend = new Resend(process.env.RESEND_API_KEY || '');

const ADMIN_EMAIL = 'ian.ho@rebootmedia.net';

/**
 * Create an alert and optionally send email notification
 * @param {Object} alert - Alert data
 * @param {string} alert.type - Alert type: 'error_rate', 'openrouter_spend', 'stripe_webhook', 'system'
 * @param {string} alert.severity - Severity: 'info', 'warning', 'critical'
 * @param {string} alert.title - Alert title
 * @param {string} alert.message - Alert message
 * @param {Object} alert.metadata - Additional metadata
 * @param {boolean} alert.sendEmail - Whether to send email notification (default: true for warning/critical)
 * @returns {Promise<Object>} Created alert
 */
export async function createAlert({
  type,
  severity,
  title,
  message,
  metadata = {},
  sendEmail = null
}) {
  try {
    // Default: send email for warning and critical alerts
    const shouldSendEmail = sendEmail !== null ? sendEmail : (severity === 'warning' || severity === 'critical');

    // Insert alert into database
    const { data: alert, error: insertError } = await supabase
      .from('alerts')
      .insert({
        alert_type: type,
        severity,
        title,
        message,
        metadata,
        email_sent: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('[AlertNotifier] Failed to create alert:', insertError);
      throw insertError;
    }

    console.log(`[AlertNotifier] Alert created: ${alert.id} (${severity} - ${type})`);

    // Send email notification if needed
    if (shouldSendEmail) {
      await sendAlertEmail(alert);

      // Update alert to mark email sent
      await supabase
        .from('alerts')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', alert.id);
    }

    return alert;

  } catch (error) {
    console.error('[AlertNotifier] Error creating alert:', error);
    // Don't throw - monitoring failures shouldn't break the API
    return null;
  }
}

/**
 * Send alert email via Resend
 * @param {Object} alert - Alert object from database
 */
async function sendAlertEmail(alert) {
  try {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };

    const severityColor = {
      info: '#0070f3',
      warning: '#f5a623',
      critical: '#e00'
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severityColor[alert.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .alert-type { font-size: 12px; text-transform: uppercase; opacity: 0.9; }
    .title { font-size: 24px; margin: 10px 0; }
    .message { background: white; padding: 15px; border-left: 4px solid ${severityColor[alert.severity]}; margin: 15px 0; }
    .metadata { font-size: 12px; color: #666; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
    .button { display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-type">${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()} - ${alert.alert_type}</div>
      <div class="title">${alert.title}</div>
    </div>
    <div class="content">
      <div class="message">${alert.message}</div>

      ${Object.keys(alert.metadata || {}).length > 0 ? `
      <div class="metadata">
        <strong>Details:</strong><br/>
        <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
      </div>
      ` : ''}

      <a href="https://dashboard.safeprompt.dev/admin?tab=alerts" class="button">
        View in Admin Dashboard
      </a>
    </div>
    <div class="footer">
      SafePrompt Monitoring System<br/>
      ${new Date(alert.created_at).toLocaleString()}
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'SafePrompt Alerts <alerts@safeprompt.dev>',
      to: ADMIN_EMAIL,
      subject: `${severityEmoji[alert.severity]} [${alert.severity.toUpperCase()}] ${alert.title}`,
      html
    });

    if (error) {
      console.error('[AlertNotifier] Failed to send email:', error);
      throw error;
    }

    console.log(`[AlertNotifier] Email sent to ${ADMIN_EMAIL}:`, data.id);

  } catch (error) {
    console.error('[AlertNotifier] Email send error:', error);
    // Don't throw - email failures shouldn't break the alert system
  }
}

/**
 * Create error rate alert
 * @param {number} errorRate - Error rate percentage
 * @param {number} errorCount - Number of errors
 * @param {number} totalRequests - Total requests
 */
export async function alertErrorRate(errorRate, errorCount, totalRequests) {
  const threshold = 1; // 1% threshold

  if (errorRate > threshold) {
    return createAlert({
      type: 'error_rate',
      severity: errorRate > 5 ? 'critical' : 'warning',
      title: `High Error Rate Detected: ${errorRate.toFixed(2)}%`,
      message: `API error rate has exceeded ${threshold}% threshold. Current rate: ${errorRate.toFixed(2)}% (${errorCount} errors out of ${totalRequests} requests in the last hour).`,
      metadata: {
        error_rate: errorRate,
        error_count: errorCount,
        total_requests: totalRequests,
        threshold,
        time_window: '1 hour'
      }
    });
  }

  return null;
}

/**
 * Create OpenRouter spend alert
 * @param {number} dailySpend - Daily spend in USD
 */
export async function alertOpenRouterSpend(dailySpend) {
  const threshold = 50; // $50/day threshold

  if (dailySpend > threshold) {
    return createAlert({
      type: 'openrouter_spend',
      severity: dailySpend > 100 ? 'critical' : 'warning',
      title: `High OpenRouter Spend: $${dailySpend.toFixed(2)}`,
      message: `OpenRouter daily spend has exceeded $${threshold} threshold. Current spend today: $${dailySpend.toFixed(2)}.`,
      metadata: {
        daily_spend: dailySpend,
        threshold,
        date: new Date().toISOString().split('T')[0]
      }
    });
  }

  return null;
}

/**
 * Create Stripe webhook failure alert
 * @param {string} webhookId - Stripe webhook event ID
 * @param {string} errorMessage - Error message
 */
export async function alertStripeWebhookFailure(webhookId, errorMessage) {
  return createAlert({
    type: 'stripe_webhook',
    severity: 'warning',
    title: 'Stripe Webhook Failure',
    message: `Stripe webhook processing failed. This may affect payment processing and subscription updates.`,
    metadata: {
      webhook_id: webhookId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log an API error
 * @param {Object} error - Error data
 */
export async function logError({
  endpoint,
  errorMessage,
  errorStack,
  requestMethod,
  requestHeaders,
  userId = null,
  ipAddress = null,
  metadata = {}
}) {
  try {
    await supabase
      .from('error_logs')
      .insert({
        endpoint,
        error_message: errorMessage,
        error_stack: errorStack,
        request_method: requestMethod,
        request_headers: requestHeaders,
        user_id: userId,
        ip_address: ipAddress,
        metadata
      });

    console.log(`[AlertNotifier] Error logged: ${endpoint} - ${errorMessage}`);

  } catch (error) {
    console.error('[AlertNotifier] Failed to log error:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

/**
 * Log a cost
 * @param {Object} cost - Cost data
 */
export async function logCost({
  service,
  amountUsd,
  metadata = {},
  profileId = null
}) {
  try {
    await supabase
      .from('cost_logs')
      .insert({
        service,
        amount_usd: amountUsd,
        metadata,
        profile_id: profileId
      });

    console.log(`[AlertNotifier] Cost logged: ${service} - $${amountUsd}`);

  } catch (error) {
    console.error('[AlertNotifier] Failed to log cost:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

/**
 * Check error rate and create alert if needed
 * Should be called periodically (e.g., every 5 minutes via cron)
 */
export async function checkErrorRate() {
  try {
    const { data, error } = await supabase.rpc('get_error_rate');

    if (error) {
      console.error('[AlertNotifier] Failed to get error rate:', error);
      return;
    }

    const { error_rate, error_count, total_requests } = data[0];

    if (error_rate > 1) {
      await alertErrorRate(error_rate, error_count, total_requests);
    }

  } catch (error) {
    console.error('[AlertNotifier] Error checking error rate:', error);
  }
}

/**
 * Check daily spend and create alert if needed
 * Should be called periodically (e.g., every hour via cron)
 */
export async function checkDailySpend() {
  try {
    const { data, error } = await supabase.rpc('get_daily_spend', { service_name: 'openrouter' });

    if (error) {
      console.error('[AlertNotifier] Failed to get daily spend:', error);
      return;
    }

    const dailySpend = parseFloat(data);

    if (dailySpend > 50) {
      await alertOpenRouterSpend(dailySpend);
    }

  } catch (error) {
    console.error('[AlertNotifier] Error checking daily spend:', error);
  }
}

/**
 * Log intelligence collection events (Phase 1A)
 * @param {Object} event - Intelligence event data
 */
export async function logIntelligence({
  eventType,
  userId = null,
  subscriptionTier = 'unknown',
  promptLength = 0,
  threatSeverity = 'low',
  ipHash = null,
  collectionResult = 'success',
  skipReason = null,
  samplesAnonymized = null,
  metadata = {}
}) {
  try {
    await supabase
      .from('intelligence_logs')
      .insert({
        event_type: eventType, // 'sample_stored', 'sample_anonymized', 'collection_skipped', 'collection_error'
        user_id: userId,
        subscription_tier: subscriptionTier,
        prompt_length: promptLength,
        threat_severity: threatSeverity,
        ip_hash: ipHash,
        collection_result: collectionResult,
        skip_reason: skipReason,
        samples_anonymized: samplesAnonymized,
        metadata
      });

    console.log(`[Intelligence] ${eventType}: ${collectionResult}`, {
      tier: subscriptionTier,
      severity: threatSeverity,
      skip_reason: skipReason
    });

  } catch (error) {
    console.error('[Intelligence] Failed to log event:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

/**
 * Log background job metrics (Phase 1A Task 1A.62-1A.63)
 * @param {Object} metrics - Job metrics data
 */
export async function logJobMetrics({
  jobName,
  jobStatus, // 'success' or 'error'
  duration = null,
  recordsProcessed = 0,
  errorMessage = null,
  metadata = {}
}) {
  try {
    await supabase
      .from('job_metrics')
      .insert({
        job_name: jobName, // 'anonymization', 'ip_reputation_update', 'session_cleanup'
        job_status: jobStatus,
        duration_ms: duration,
        records_processed: recordsProcessed,
        error_message: errorMessage,
        metadata
      });

    console.log(`[JobMetrics] ${jobName}: ${jobStatus}`, {
      records: recordsProcessed,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[JobMetrics] Failed to log metrics:', error);
    // Don't throw - metrics failures shouldn't break jobs
  }
}

/**
 * Calculate and alert on anonymization job success rate (Phase 1A Task 1A.62)
 */
export async function checkAnonymizationSuccessRate() {
  try {
    // Get last 24 hours of anonymization job runs
    const { data, error } = await supabase
      .from('job_metrics')
      .select('job_status')
      .eq('job_name', 'anonymization')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[JobMetrics] Failed to get anonymization metrics:', error);
      return;
    }

    const totalRuns = data.length;
    const successfulRuns = data.filter(run => run.job_status === 'success').length;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

    // Alert if success rate is below 100% (critical for legal compliance)
    if (successRate < 100 && totalRuns > 0) {
      await createAlert({
        type: 'anonymization_job',
        severity: successRate < 90 ? 'critical' : 'warning',
        title: `Anonymization Job Success Rate: ${successRate.toFixed(1)}%`,
        message: `Anonymization job success rate has dropped below 100%. This is a legal compliance issue. Current rate: ${successRate.toFixed(1)}% (${successfulRuns}/${totalRuns} successful in last 24 hours).`,
        metadata: {
          success_rate: successRate,
          successful_runs: successfulRuns,
          total_runs: totalRuns,
          failed_runs: totalRuns - successfulRuns,
          time_window: '24 hours'
        }
      });
    }

    return { successRate, totalRuns, successfulRuns };

  } catch (error) {
    console.error('[JobMetrics] Error checking anonymization success rate:', error);
  }
}
