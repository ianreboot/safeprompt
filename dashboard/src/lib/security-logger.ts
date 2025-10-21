/**
 * SECURITY: Client-side security event logging
 * Logs security-relevant events for monitoring and incident response
 */

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_CHANGED = 'password_changed',

  // Session events
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALID = 'session_invalid',

  // Authorization events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  FORBIDDEN_ACTION = 'forbidden_action',

  // Suspicious activity
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_INPUT_DETECTED = 'invalid_input_detected',
  XSS_ATTEMPT_BLOCKED = 'xss_attempt_blocked',

  // Data access
  SENSITIVE_DATA_VIEWED = 'sensitive_data_viewed',
  API_KEY_REGENERATED = 'api_key_regenerated',
}

interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  userEmail?: string
  details?: Record<string, any>
  timestamp: string
  userAgent: string
  url: string
}

/**
 * Log a security event
 * In production, this would send to a centralized logging service
 */
export function logSecurityEvent(
  type: SecurityEventType,
  details?: Record<string, any>
): void {
  const event: SecurityEvent = {
    type,
    details,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY EVENT]', event)
  }

  // In production, send to monitoring service
  // TODO: Integrate with logging service (Sentry, LogRocket, etc.)
  // Example: sendToSentry(event)

  // Store in localStorage for debugging (max 100 events)
  if (typeof window !== 'undefined') {
    try {
      const key = 'safeprompt_security_events'
      const stored = localStorage.getItem(key)
      const events = stored ? JSON.parse(stored) : []

      events.push(event)

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift()
      }

      localStorage.setItem(key, JSON.stringify(events))
    } catch (error) {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  }
}

/**
 * Get recent security events (for debugging)
 */
export function getSecurityEvents(): SecurityEvent[] {
  if (typeof window === 'undefined') return []

  try {
    const key = 'safeprompt_security_events'
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Clear security event log
 */
export function clearSecurityEvents(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('safeprompt_security_events')
  } catch {
    // Ignore errors
  }
}
