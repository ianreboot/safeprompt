/**
 * Honeypot Endpoint: /api/v1/validate-debug
 *
 * Phase 6.5.1: Honeypot API Endpoints
 *
 * Purpose: Fake debug endpoint that logs reconnaissance attempts
 *
 * Behavior:
 * - Logs all requests to honeypot_requests table
 * - Returns plausible fake data (never 404)
 * - Detects reconnaissance patterns
 * - NOT advertised in documentation
 */

import { logHoneypotRequest } from '../../lib/honeypot-logger.js';

export default async function handler(req, res) {
  // Log this honeypot request
  const logResult = await logHoneypotRequest(req, '/api/v1/validate-debug');

  // Return plausible fake data
  const fakeResponse = {
    success: true,
    debug: {
      version: '1.2.3',
      environment: 'production',
      timestamp: new Date().toISOString(),
      requestId: `req_${Math.random().toString(36).substring(7)}`,
      validation: {
        enabled: true,
        mode: 'strict',
        patterns: 127,
        lastUpdate: '2025-10-01T00:00:00Z'
      },
      performance: {
        avgResponseTime: '250ms',
        cacheHitRate: 0.67,
        queueDepth: 0
      }
    },
    message: 'Debug information retrieved successfully'
  };

  // If reconnaissance detected, add warning to logs
  if (logResult.isReconnaissance) {
    console.warn(`[Honeypot] Reconnaissance detected: ${logResult.detectedPatterns.map(p => p.name).join(', ')}`);
  }

  // Return 200 with fake data (makes it look real)
  res.status(200).json(fakeResponse);
}
