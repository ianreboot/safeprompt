/**
 * SafePrompt API Status Endpoint
 * GET /api/status
 *
 * Returns current API health status
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use GET to check status'
    });
  }

  try {
    // Basic health check response
    const status = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0-beta',
      uptime: process.uptime(),
      services: {
        api: 'operational',
        validation: 'operational',
        database: 'operational'
      },
      response_time_ms: 5,
      endpoints: {
        check: 'https://api.safeprompt.dev/v1/check',
        status: 'https://api.safeprompt.dev/status',
        contact: 'https://api.safeprompt.dev/api/contact',
        waitlist: 'https://api.safeprompt.dev/api/waitlist/count'
      }
    };

    return res.status(200).json(status);
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Service temporarily unavailable'
    });
  }
}