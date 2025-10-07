/**
 * Honeypot Endpoint: /api/v1/admin-test
 *
 * Phase 6.5.1: Honeypot API Endpoints
 *
 * Purpose: Fake admin endpoint that logs unauthorized access attempts
 *
 * Behavior:
 * - Logs all requests to honeypot_requests table
 * - Returns plausible "unauthorized" response
 * - Tracks admin endpoint enumeration
 * - NOT advertised in documentation
 */

import { logHoneypotRequest } from '../../lib/honeypot-logger.js';

export default async function handler(req, res) {
  // Log this honeypot request
  const logResult = await logHoneypotRequest(req, '/api/v1/admin-test');

  // Return plausible "unauthorized" response (looks like real endpoint)
  const fakeResponse = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Admin access requires authentication',
      details: 'Please provide valid admin credentials in the Authorization header'
    },
    timestamp: new Date().toISOString()
  };

  // If reconnaissance detected, add warning to logs
  if (logResult.isReconnaissance) {
    console.warn(`[Honeypot] Admin endpoint probing detected: ${logResult.detectedPatterns.map(p => p.name).join(', ')}`);
  }

  // Return 401 (makes it look like a real protected endpoint)
  res.status(401).json(fakeResponse);
}
