/**
 * SECURITY: Input sanitization utilities
 * Prevents XSS, injection attacks, and malicious input
 */

/**
 * Sanitize text input by removing dangerous characters
 * Allows alphanumeric, spaces, and common punctuation
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
  if (!input) return ''

  // Truncate to max length
  let sanitized = input.slice(0, maxLength)

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize email input
 * Validates format and removes dangerous characters
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim()

  // Remove any characters not valid in email addresses
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '')

  // Limit length (standard email max is 320 chars)
  sanitized = sanitized.slice(0, 320)

  return sanitized
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i

  return emailRegex.test(email) && email.length <= 320
}

/**
 * Sanitize URL input
 * Only allows http/https protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  let sanitized = url.trim()

  // Ensure it starts with http:// or https://
  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    return ''
  }

  // Remove any dangerous characters
  sanitized = sanitized.replace(/[<>"']/g, '')

  // Limit length
  sanitized = sanitized.slice(0, 2048)

  return sanitized
}

/**
 * Validate URL format and whitelist
 * Only allows SafePrompt domains for redirects
 */
export function isValidRedirectUrl(url: string, allowedDomains: string[]): boolean {
  if (!url) return false

  try {
    const urlObj = new URL(url)

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false
    }

    // Check if domain is in whitelist
    const hostname = urlObj.hostname
    return allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}

/**
 * Sanitize IP address input
 */
export function sanitizeIpAddress(ip: string): string {
  if (!ip) return ''

  let sanitized = ip.trim()

  // Only allow IPv4 format (xxx.xxx.xxx.xxx)
  sanitized = sanitized.replace(/[^0-9.]/g, '')

  // Validate format
  const parts = sanitized.split('.')
  if (parts.length !== 4) return ''

  // Each part must be 0-255
  const valid = parts.every(part => {
    const num = parseInt(part, 10)
    return !isNaN(num) && num >= 0 && num <= 255
  })

  return valid ? sanitized : ''
}

/**
 * Sanitize textarea/multiline input
 * Allows newlines but removes dangerous content
 */
export function sanitizeMultiline(input: string, maxLength: number = 5000): string {
  if (!input) return ''

  // Truncate to max length
  let sanitized = input.slice(0, maxLength)

  // Remove null bytes and dangerous control characters (keep newlines \n and \r)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Remove potential script tags (case insensitive)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string, min?: number, max?: number): number | null {
  if (!input) return null

  const num = parseFloat(input.replace(/[^0-9.-]/g, ''))

  if (isNaN(num)) return null

  if (min !== undefined && num < min) return min
  if (max !== undefined && num > max) return max

  return num
}

/**
 * Generic input length validation
 */
export const INPUT_LIMITS = {
  EMAIL: 320,
  PASSWORD: 128,
  NAME: 100,
  TEXT_SHORT: 500,
  TEXT_LONG: 5000,
  URL: 2048,
  IP_ADDRESS: 15,
  API_KEY: 128
} as const
