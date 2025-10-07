/**
 * Honeypot Endpoint: /api/internal/check
 *
 * Phase 6.5.1: Honeypot API Endpoints
 *
 * Purpose: Fake internal endpoint that logs internal path enumeration
 *
 * Behavior:
 * - Logs all requests to honeypot_requests table
 * - Returns plausible "not found" response
 * - Tracks internal endpoint discovery attempts
 * - NOT advertised in documentation
 */

import { logHoneypotRequest } from '../../lib/honeypot-logger.js';

export default async function handler(req, res) {
  // Log this honeypot request
  const logResult = await logHoneypotRequest(req, '/api/internal/check');

  // Return plausible "not found" response (looks like accidentally exposed internal endpoint)
  const fakeResponse = {
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: 'This endpoint is for internal use only',
      details: 'If you need API access, please refer to the documentation at https://safeprompt.dev/docs'
    },
    timestamp: new Date().toISOString()
  };

  // If reconnaissance detected, add warning to logs
  if (logResult.isReconnaissance) {
    console.warn(`[Honeypot] Internal path enumeration detected: ${logResult.detectedPatterns.map(p => p.name).join(', ')}`);
  }

  // Return 404 (makes it look like an internal endpoint that shouldn't be accessed)
  res.status(404).json(fakeResponse);
}
