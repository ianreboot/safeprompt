/**
 * Rate Limiting Utility
 * 
 * Provides request rate limiting for API endpoints to prevent abuse.
 * Uses in-memory storage with automatic cleanup.
 * 
 * Usage:
 *   import { checkRateLimit, getRateLimitHeaders } from './lib/rate-limiter.js'
 *   
 *   const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
 *   const limit = await checkRateLimit(ip, 'stripe-checkout', { perMinute: 5, perHour: 20 })
 *   
 *   if (!limit.allowed) {
 *     return res.status(429).json({ error: 'Rate limit exceeded', ...getRateLimitHeaders(limit) })
 *   }
 */

import crypto from 'crypto';

// In-memory rate limit storage
// Format: Map<ipHash, { minuteCount, hourCount, dayCount, minuteResetAt, hourResetAt, dayResetAt }>
const rateLimitStore = new Map();

// Default rate limits (can be overridden per endpoint)
const DEFAULT_LIMITS = {
  perMinute: 10,
  perHour: 60,
  perDay: 500
};

/**
 * Hash IP address for privacy (GDPR compliance)
 * @param {string} ip - IP address to hash
 * @param {string} endpoint - Endpoint name to include in hash (prevents cross-endpoint tracking)
 * @returns {string} SHA256 hash
 */
function hashIP(ip, endpoint) {
  return crypto
    .createHash('sha256')
    .update(`${ip}:${endpoint}:${process.env.RATE_LIMIT_SALT || 'safeprompt-2025'}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Get current time windows
 * @returns {object} Current timestamp and window reset times
 */
function getTimeWindows() {
  const now = Date.now();
  return {
    now,
    minuteWindow: now - (60 * 1000),
    hourWindow: now - (60 * 60 * 1000),
    dayWindow: now - (24 * 60 * 60 * 1000)
  };
}

/**
 * Clean up old entries to prevent memory leaks
 * Runs automatically when store size exceeds threshold
 */
function cleanupOldEntries() {
  const MAX_ENTRIES = 10000;
  if (rateLimitStore.size < MAX_ENTRIES) return;

  const now = Date.now();
  const expiredKeys = [];

  for (const [key, data] of rateLimitStore.entries()) {
    // Remove entries older than 24 hours
    if (now > data.dayResetAt) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => rateLimitStore.delete(key));
  
  console.log(`[RateLimiter] Cleaned up ${expiredKeys.length} expired entries`);
}

/**
 * Check if request is within rate limits
 * @param {string} ip - IP address (will be hashed)
 * @param {string} endpoint - Endpoint identifier (e.g., 'stripe-checkout', 'admin')
 * @param {object} limits - Custom limits { perMinute, perHour, perDay }
 * @returns {Promise<object>} { allowed: boolean, reason?: string, remaining: object, resetAt: object }
 */
export async function checkRateLimit(ip, endpoint, limits = {}) {
  // Merge custom limits with defaults
  const config = { ...DEFAULT_LIMITS, ...limits };
  
  // Hash IP for privacy
  const ipHash = hashIP(ip, endpoint);
  
  // Get or create rate limit record
  let record = rateLimitStore.get(ipHash);
  const now = Date.now();
  
  if (!record) {
    // First request from this IP/endpoint
    record = {
      minuteCount: 0,
      hourCount: 0,
      dayCount: 0,
      minuteResetAt: now + (60 * 1000),
      hourResetAt: now + (60 * 60 * 1000),
      dayResetAt: now + (24 * 60 * 60 * 1000),
      requests: [] // Array of timestamps for accurate window counting
    };
  }

  // Reset counters if windows expired
  if (now > record.minuteResetAt) {
    record.minuteCount = 0;
    record.minuteResetAt = now + (60 * 1000);
  }
  if (now > record.hourResetAt) {
    record.hourCount = 0;
    record.hourResetAt = now + (60 * 60 * 1000);
  }
  if (now > record.dayResetAt) {
    record.dayCount = 0;
    record.dayResetAt = now + (24 * 60 * 60 * 1000);
  }

  // Remove old request timestamps (sliding window)
  const { minuteWindow, hourWindow, dayWindow } = getTimeWindows();
  record.requests = record.requests.filter(timestamp => timestamp > dayWindow);

  // Count requests in each window
  const minuteRequests = record.requests.filter(t => t > minuteWindow).length;
  const hourRequests = record.requests.filter(t => t > hourWindow).length;
  const dayRequests = record.requests.filter(t => t > dayWindow).length;

  // Check limits
  let allowed = true;
  let reason = null;

  if (minuteRequests >= config.perMinute) {
    allowed = false;
    reason = 'minute_limit';
  } else if (hourRequests >= config.perHour) {
    allowed = false;
    reason = 'hour_limit';
  } else if (dayRequests >= config.perDay) {
    allowed = false;
    reason = 'day_limit';
  }

  // If allowed, increment counters
  if (allowed) {
    record.requests.push(now);
    record.minuteCount = minuteRequests + 1;
    record.hourCount = hourRequests + 1;
    record.dayCount = dayRequests + 1;
  }

  // Save updated record
  rateLimitStore.set(ipHash, record);

  // Cleanup if needed
  cleanupOldEntries();

  // Return result
  return {
    allowed,
    reason,
    remaining: {
      minute: Math.max(0, config.perMinute - (minuteRequests + (allowed ? 1 : 0))),
      hour: Math.max(0, config.perHour - (hourRequests + (allowed ? 1 : 0))),
      day: Math.max(0, config.perDay - (dayRequests + (allowed ? 1 : 0)))
    },
    resetAt: {
      minute: Math.ceil((record.minuteResetAt - now) / 1000),
      hour: Math.ceil((record.hourResetAt - now) / 1000),
      day: Math.ceil((record.dayResetAt - now) / 1000)
    },
    limit: config
  };
}

/**
 * Get standard rate limit headers for HTTP responses
 * @param {object} limitResult - Result from checkRateLimit()
 * @returns {object} Headers object
 */
export function getRateLimitHeaders(limitResult) {
  return {
    'X-RateLimit-Limit-Minute': limitResult.limit.perMinute,
    'X-RateLimit-Limit-Hour': limitResult.limit.perHour,
    'X-RateLimit-Limit-Day': limitResult.limit.perDay,
    'X-RateLimit-Remaining-Minute': limitResult.remaining.minute,
    'X-RateLimit-Remaining-Hour': limitResult.remaining.hour,
    'X-RateLimit-Remaining-Day': limitResult.remaining.day,
    'X-RateLimit-Reset': limitResult.resetAt.minute
  };
}

/**
 * Extract IP address from request
 * @param {object} req - HTTP request object
 * @returns {string} IP address
 */
export function getClientIP(req) {
  // Check various headers (Vercel, Cloudflare, etc.)
  return req.headers['x-real-ip'] ||
         req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         '0.0.0.0';
}

/**
 * Middleware factory for easy rate limiting
 * @param {string} endpoint - Endpoint identifier
 * @param {object} limits - Custom limits
 * @returns {Function} Express/Vercel middleware
 */
export function rateLimitMiddleware(endpoint, limits = {}) {
  return async (req, res, next) => {
    const ip = getClientIP(req);
    const limit = await checkRateLimit(ip, endpoint, limits);
    
    // Add rate limit headers to response
    const headers = getRateLimitHeaders(limit);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (!limit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${limit.resetAt.minute} seconds.`,
        retryAfter: limit.resetAt.minute
      });
    }

    // Allow request to continue
    if (next) next();
  };
}
