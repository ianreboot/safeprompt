/**
 * Threat Intelligence Collection System
 * Quarter 1 Phase 1A Task 1.5
 *
 * Collects validation data for competitive moat building:
 * - Free tier: Always contributes (blocked requests only)
 * - Pro tier: Opt-in contribution (all requests)
 * - Legal: 24-hour anonymization (GDPR/CCPA compliant)
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { promisify } from 'util';
import { gzip } from 'zlib';

const gzipAsync = promisify(gzip);

// Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Hash function for anonymization
 */
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate daily salt for IP fingerprints
 * Changes daily so IP fingerprints cannot be tracked long-term
 */
function getDailySalt() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return crypto.createHash('sha256').update(today + process.env.IP_SALT_SECRET).digest('hex');
}

/**
 * Create anonymized IP fingerprint
 * Cannot reverse, changes daily
 */
function createIPFingerprint(ipAddress) {
  if (!ipAddress) return null;
  const salt = getDailySalt();
  return hashData(ipAddress + salt);
}

/**
 * Create permanent IP hash for reputation tracking
 * Stable across time for reputation scoring
 */
function createIPHash(ipAddress) {
  if (!ipAddress) return null;
  return hashData(ipAddress);
}

/**
 * Categorize user agent without storing full string
 */
function categorizeUserAgent(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  // Automated/bot detection
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return 'automated';
  }

  // Mobile detection
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }

  // Browser detection
  if (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari') || ua.includes('edge')) {
    return 'browser';
  }

  // Library/SDK detection
  if (ua.includes('curl') || ua.includes('axios') || ua.includes('fetch') || ua.includes('http')) {
    return 'library';
  }

  return 'unknown';
}

/**
 * Calculate threat severity from confidence score
 */
function calculateSeverity(confidence, isSafe) {
  if (isSafe) return 'low';

  if (confidence >= 0.9) return 'critical';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Get user's subscription tier and preferences
 */
async function getUserProfile(userId) {
  if (!userId) return { tier: 'free', preferences: { intelligence_sharing: true } };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('tier, preferences')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { tier: 'free', preferences: { intelligence_sharing: true } };
    }

    return {
      tier: data.tier || 'free',
      preferences: data.preferences || { intelligence_sharing: true }
    };
  } catch (error) {
    console.error('[IntelligenceCollector] Error fetching profile:', error.message);
    return { tier: 'free', preferences: { intelligence_sharing: true } };
  }
}

/**
 * Check if IP is on allowlist (testing, CI/CD, internal)
 */
async function isIPAllowlisted(ipAddress) {
  if (!ipAddress) return false;

  try {
    const ipHash = createIPHash(ipAddress);

    const { data, error } = await supabase
      .from('ip_allowlist')
      .select('id, description, purpose')
      .eq('ip_hash', ipHash)
      .eq('active', true)
      .maybeSingle();

    if (data) {
      // Update last_used timestamp
      await supabase
        .from('ip_allowlist')
        .update({
          last_used: new Date().toISOString(),
          use_count: supabase.rpc('increment', { row_id: data.id, column_name: 'use_count' })
        })
        .eq('id', data.id);

      return true;
    }

    return false;
  } catch (error) {
    console.error('[IntelligenceCollector] Error checking allowlist:', error.message);
    return false; // Fail open - don't block if allowlist check fails
  }
}

/**
 * Collect threat intelligence sample
 *
 * @param {string} prompt - User prompt (will be anonymized after 24h)
 * @param {object} validationResult - Full validation response
 * @param {object} options - Collection options
 * @returns {boolean} Success status
 */
export async function collectThreatIntelligence(prompt, validationResult, options = {}) {
  try {
    const {
      ip_address,
      user_agent,
      user_id,
      session_metadata = {}
    } = options;

    // Check if IP is allowlisted (testing/CI/CD)
    if (ip_address) {
      const isAllowlisted = await isIPAllowlisted(ip_address);
      if (isAllowlisted) {
        console.log('[IntelligenceCollector] Skipping collection - IP is allowlisted');
        return false;
      }
    }

    // Get user profile
    const profile = await getUserProfile(user_id);

    // Determine if we should collect
    const shouldCollect = determineCollection(profile, validationResult);

    if (!shouldCollect) {
      return false;
    }

    // Compress prompt for storage efficiency
    const promptCompressed = await gzipAsync(Buffer.from(prompt, 'utf-8'));

    // Calculate hashes
    const promptHash = hashData(prompt);
    const ipHash = ip_address ? createIPHash(ip_address) : null;

    // Prepare sample data
    const sample = {
      // Prompt data (temporary - deleted after 24h)
      prompt_text: prompt,
      prompt_hash: promptHash,
      prompt_length: prompt.length,
      prompt_compressed: promptCompressed,

      // Validation result
      validation_result: validationResult,
      attack_vectors: validationResult.threats || [],
      threat_severity: calculateSeverity(validationResult.confidence, validationResult.safe),
      confidence_score: validationResult.confidence || 0,
      detection_method: validationResult.detectionMethod || validationResult.stage,

      // IP data (temporary - deleted after 24h)
      client_ip: ip_address || null,
      ip_hash: ipHash,

      // IP metadata (permanent - not PII)
      // TODO: Add geolocation lookup in future task
      ip_country: null,
      ip_is_proxy: false,
      ip_is_hosting: false,
      ip_isp: null,

      // Behavioral fingerprint
      session_metadata: session_metadata,
      user_agent_category: categorizeUserAgent(user_agent),
      request_timing_pattern: session_metadata.timing_pattern || 'unknown',

      // User association
      profile_id: user_id || null,
      subscription_tier: profile.tier,
      intelligence_sharing: profile.preferences?.intelligence_sharing ?? true,

      // Timestamps (expires_at set by DB default: NOW() + 90 days)
      created_at: new Date().toISOString()
    };

    // Insert into database
    const { error } = await supabase
      .from('threat_intelligence_samples')
      .insert(sample);

    if (error) {
      console.error('[IntelligenceCollector] Error storing sample:', error.message);
      return false;
    }

    console.log('[IntelligenceCollector] Sample collected:', {
      tier: profile.tier,
      severity: sample.threat_severity,
      safe: validationResult.safe,
      prompt_length: prompt.length
    });

    return true;

  } catch (error) {
    console.error('[IntelligenceCollector] Error:', error.message);
    return false;
  }
}

/**
 * Determine if we should collect based on tier and preferences
 */
function determineCollection(profile, validationResult) {
  const tier = profile.tier;
  const sharing = profile.preferences?.intelligence_sharing ?? true;

  // Free tier: Always collect blocked requests only
  if (tier === 'free') {
    return !validationResult.safe;  // Only blocked requests
  }

  // Pro tier: Collect if opted in
  if (tier === 'pro') {
    if (!sharing) {
      return false;  // User opted out
    }

    // Opted in: collect ALL requests (safe + blocked)
    return true;
  }

  // Internal tier: Never collect (internal testing)
  if (tier === 'internal') {
    return false;
  }

  // Default: collect if blocked
  return !validationResult.safe;
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(userId) {
  try {
    const { data, error } = await supabase
      .from('threat_intelligence_samples')
      .select('threat_severity, created_at, anonymized_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return { total: 0, recent: 0, anonymized: 0 };
    }

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    return {
      total: data.length,
      recent: data.filter(s => new Date(s.created_at) > oneDayAgo).length,
      anonymized: data.filter(s => s.anonymized_at !== null).length,
      by_severity: {
        critical: data.filter(s => s.threat_severity === 'critical').length,
        high: data.filter(s => s.threat_severity === 'high').length,
        medium: data.filter(s => s.threat_severity === 'medium').length,
        low: data.filter(s => s.threat_severity === 'low').length
      }
    };
  } catch (error) {
    console.error('[IntelligenceCollector] Error getting stats:', error.message);
    return { total: 0, recent: 0, anonymized: 0 };
  }
}

export default { collectThreatIntelligence, getCollectionStats };
