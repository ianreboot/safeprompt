/**
 * Honeypot Request Logger
 *
 * Phase 6.5.2: Honeypot Request Logging
 *
 * Purpose: Log all requests to honeypot endpoints for attack learning
 *
 * Safety Model:
 * - All honeypot data is safe for analysis (fake endpoints)
 * - 90-day retention (no anonymization needed)
 * - Supports automated pattern learning
 * - Tracks reconnaissance attempts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for honeypot logging');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Reconnaissance patterns to detect
 *
 * Phase 6.5.3: Reconnaissance Pattern Detection
 */
const RECONNAISSANCE_PATTERNS = [
  {
    name: 'directory_traversal',
    pattern: /\.\.[\/\\]/,
    description: 'Directory traversal attempt'
  },
  {
    name: 'debug_parameter',
    pattern: /[?&](debug|test|dev|admin|verbose)=/i,
    description: 'Debug parameter probing'
  },
  {
    name: 'internal_path',
    pattern: /\/(internal|admin|test|debug|dev|api\/admin)/i,
    description: 'Internal path enumeration'
  },
  {
    name: 'sql_injection',
    pattern: /('|"|;|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b)/i,
    description: 'SQL injection attempt'
  },
  {
    name: 'command_injection',
    pattern: /[;&|`$(){}[\]<>]/,
    description: 'Command injection characters'
  },
  {
    name: 'xss_probe',
    pattern: /<script|javascript:|onerror=|onload=/i,
    description: 'XSS probe attempt'
  },
  {
    name: 'file_inclusion',
    pattern: /\/(etc\/passwd|\.env|config\.|secret|key)/i,
    description: 'File inclusion attempt'
  }
];

/**
 * Log honeypot request
 *
 * @param {Object} req - Request object
 * @param {string} endpoint - Honeypot endpoint that was hit
 * @returns {Object} Log result with detected patterns
 */
export async function logHoneypotRequest(req, endpoint) {
  try {
    // Extract request details
    const fullRequest = {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      body: req.body || {},
      query: req.query || {},
      timestamp: new Date().toISOString()
    };

    // Hash IP for privacy
    const ipHash = await hashIP(getClientIP(req));

    // Detect reconnaissance patterns
    const detectedPatterns = detectReconnaissancePatterns(req);

    // Store in database
    const { data, error } = await supabase
      .from('honeypot_requests')
      .insert({
        endpoint,
        full_request: fullRequest,
        ip_hash: ipHash,
        user_agent: req.headers['user-agent'] || 'Unknown',
        detected_patterns: detectedPatterns.map(p => p.name),
        auto_deployed: false,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Honeypot Logger] Failed to log request:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`[Honeypot Logger] Logged request to ${endpoint}, IP: ${ipHash}, Patterns: ${detectedPatterns.map(p => p.name).join(', ')}`);

    return {
      success: true,
      id: data.id,
      detectedPatterns,
      isReconnaissance: detectedPatterns.length > 0
    };

  } catch (error) {
    console.error('[Honeypot Logger] Error logging request:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detect reconnaissance patterns in request
 *
 * Phase 6.5.3: Reconnaissance Pattern Detection
 */
function detectReconnaissancePatterns(req) {
  const detected = [];
  const fullURL = req.url || '';
  const bodyString = JSON.stringify(req.body || {});
  const queryString = JSON.stringify(req.query || {});

  for (const reconPattern of RECONNAISSANCE_PATTERNS) {
    // Check URL
    if (reconPattern.pattern.test(fullURL)) {
      detected.push({
        name: reconPattern.name,
        description: reconPattern.description,
        location: 'url',
        match: fullURL.match(reconPattern.pattern)?.[0]
      });
    }

    // Check body
    if (reconPattern.pattern.test(bodyString)) {
      detected.push({
        name: reconPattern.name,
        description: reconPattern.description,
        location: 'body',
        match: bodyString.match(reconPattern.pattern)?.[0]
      });
    }

    // Check query params
    if (reconPattern.pattern.test(queryString)) {
      detected.push({
        name: reconPattern.name,
        description: reconPattern.description,
        location: 'query',
        match: queryString.match(reconPattern.pattern)?.[0]
      });
    }
  }

  return detected;
}

/**
 * Sanitize headers to remove sensitive data
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };

  // Remove sensitive headers
  delete sanitized['authorization'];
  delete sanitized['cookie'];
  delete sanitized['x-api-key'];

  return sanitized;
}

/**
 * Get client IP from request
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Hash IP address for privacy
 */
async function hashIP(ip) {
  if (ip === 'unknown') return 'unknown';

  // Simple hash for now - could use crypto if needed
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(16)}`;
}

/**
 * Get honeypot analytics
 *
 * Used by dashboard to show honeypot statistics
 */
export async function getHoneypotAnalytics(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: requests, error } = await supabase
    .from('honeypot_requests')
    .select('*')
    .gte('created_at', cutoffDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Honeypot Analytics] Failed to fetch requests:', error);
    return null;
  }

  // Calculate statistics
  const stats = {
    totalRequests: requests.length,
    uniqueIPs: new Set(requests.map(r => r.ip_hash)).size,
    endpointBreakdown: {},
    patternBreakdown: {},
    topIPs: {},
    requestsPerDay: {},
    reconnaissanceAttempts: 0,
    autoDeployedPatterns: requests.filter(r => r.auto_deployed).length
  };

  for (const request of requests) {
    // Endpoint breakdown
    stats.endpointBreakdown[request.endpoint] = (stats.endpointBreakdown[request.endpoint] || 0) + 1;

    // Pattern breakdown
    if (request.detected_patterns && request.detected_patterns.length > 0) {
      stats.reconnaissanceAttempts++;
      for (const pattern of request.detected_patterns) {
        stats.patternBreakdown[pattern] = (stats.patternBreakdown[pattern] || 0) + 1;
      }
    }

    // Top IPs
    stats.topIPs[request.ip_hash] = (stats.topIPs[request.ip_hash] || 0) + 1;

    // Requests per day
    const date = new Date(request.created_at).toISOString().split('T')[0];
    stats.requestsPerDay[date] = (stats.requestsPerDay[date] || 0) + 1;
  }

  // Convert to sorted arrays
  stats.topIPsList = Object.entries(stats.topIPs)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  stats.topPatterns = Object.entries(stats.patternBreakdown)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);

  return stats;
}

export default {
  logHoneypotRequest,
  getHoneypotAnalytics
};
