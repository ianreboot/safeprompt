/**
 * Shared utility functions for SafePrompt API
 * Consolidates duplicate code across endpoints
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Hash an API key using SHA-256
 * @param {string} key - The API key to hash
 * @returns {string} Hex-encoded hash
 */
export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key with SafePrompt format
 * @returns {string} API key in format sp_live_<64_hex_chars>
 */
export function generateApiKey() {
  return `sp_live_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Create a Supabase client with environment variables
 * Uses SAFEPROMPT_ prefixed vars or falls back to standard names
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createSupabaseClient() {
  const url = process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

/**
 * Standardized error response format
 * @param {string} message - Error message
 * @param {string} code - Error code (e.g., 'INVALID_API_KEY')
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Error response object
 */
export function createErrorResponse(message, code, statusCode = 500) {
  return {
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    },
    statusCode
  };
}

/**
 * Standardized success response format
 * @param {Object} data - Response data
 * @param {Object} metadata - Optional metadata (timing, etc.)
 * @returns {Object} Success response object
 */
export function createSuccessResponse(data, metadata = {}) {
  return {
    success: true,
    data,
    ...metadata,
    timestamp: new Date().toISOString()
  };
}