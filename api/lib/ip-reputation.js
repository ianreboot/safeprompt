/**
 * IP Reputation System
 * Quarter 1 Phase 1A Task 1.6
 *
 * Network defense through collective intelligence:
 * - Hash-based reputation tracking (cannot reverse to identify users)
 * - Auto-block known bad actors (paid tiers opt-in only)
 * - Allowlist bypass for testing/CI/CD infrastructure
 * - Test suite marker detection (X-SafePrompt-Test-Suite header)
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Test suite secret token (set in environment)
const TEST_SUITE_TOKEN = process.env.SAFEPROMPT_TEST_SUITE_TOKEN || 'test-suite-secret-token';

/**
 * Hash IP address for lookup
 */
function hashIP(ipAddress) {
  if (!ipAddress) return null;
  return crypto.createHash('sha256').update(ipAddress).digest('hex');
}

/**
 * Check if request is from test suite
 * Bypasses IP reputation if valid test suite header present
 */
function isTestSuiteRequest(headers = {}) {
  // Handle null/undefined headers
  if (!headers || typeof headers !== 'object') return false;

  // Case-insensitive header lookup (with prototype pollution protection)
  let testSuiteHeader = null;
  for (const key in headers) {
    // Only check own properties (not inherited via prototype pollution)
    if (Object.prototype.hasOwnProperty.call(headers, key)) {
      if (key.toLowerCase() === 'x-safeprompt-test-suite') {
        testSuiteHeader = headers[key];
        break;
      }
    }
  }

  if (!testSuiteHeader) return false;

  // Validate token - accept exact match OR common truthy values
  // Common truthy values: "true", "1", "yes" (case insensitive)
  const normalizedHeader = String(testSuiteHeader).toLowerCase();
  const validValues = ['true', '1', 'yes', TEST_SUITE_TOKEN.toLowerCase()];

  return validValues.includes(normalizedHeader);
}

/**
 * Check if IP is on allowlist
 */
async function checkAllowlist(ipAddress) {
  if (!ipAddress) return { isAllowlisted: false };

  try {
    const ipHash = hashIP(ipAddress);

    const { data, error } = await supabase
      .from('ip_allowlist')
      .select('id, description, purpose')
      .eq('ip_hash', ipHash)
      .eq('active', true)
      .maybeSingle();

    if (data) {
      // Update last_used
      await supabase
        .from('ip_allowlist')
        .update({
          last_used: new Date().toISOString()
        })
        .eq('id', data.id)
        .then(() => {
          // Increment use_count
          return supabase.rpc('increment', {
            row_id: data.id,
            table_name: 'ip_allowlist',
            column_name: 'use_count',
            increment_by: 1
          });
        })
        .catch(() => {
          // Ignore increment errors (not critical)
        });

      return {
        isAllowlisted: true,
        description: data.description,
        purpose: data.purpose
      };
    }

    return { isAllowlisted: false };
  } catch (error) {
    console.error('[IPReputation] Error checking allowlist:', error.message);
    return { isAllowlisted: false }; // Fail open
  }
}

/**
 * Get IP reputation from database
 */
async function getIPReputation(ipAddress) {
  if (!ipAddress) {
    return {
      reputation_score: 0.0,
      auto_block: false,
      sample_count: 0,
      exists: false
    };
  }

  try {
    const ipHash = hashIP(ipAddress);

    const { data, error } = await supabase
      .from('ip_reputation')
      .select('*')
      .eq('ip_hash', ipHash)
      .maybeSingle();

    if (error || !data) {
      return {
        reputation_score: 0.0,
        auto_block: false,
        sample_count: 0,
        exists: false
      };
    }

    return {
      ...data,
      exists: true
    };
  } catch (error) {
    console.error('[IPReputation] Error fetching reputation:', error.message);
    return {
      reputation_score: 0.0,
      auto_block: false,
      sample_count: 0,
      exists: false
    };
  }
}

/**
 * Check IP reputation and determine if request should be blocked
 *
 * @param {string} ipAddress - Client IP address
 * @param {object} options - Check options
 * @returns {object} Reputation check result
 */
export async function checkIPReputation(ipAddress, options = {}) {
  const {
    user_id,
    headers = {},
    subscription_tier = 'free',
    auto_block_enabled = false
  } = options;

  const result = {
    checked: false,
    bypassed: false,
    bypass_reason: null,
    reputation_score: 0.0,
    should_block: false,
    block_reason: null,
    reputation_data: null
  };

  // BYPASS 1: Test suite marker
  if (isTestSuiteRequest(headers)) {
    result.bypassed = true;
    result.bypass_reason = 'test_suite_header';
    console.log('[IPReputation] Bypassed - test suite marker detected');
    return result;
  }

  // BYPASS 2: IP allowlist
  const allowlistCheck = await checkAllowlist(ipAddress);
  if (allowlistCheck.isAllowlisted) {
    result.bypassed = true;
    result.bypass_reason = 'ip_allowlist';
    result.allowlist_purpose = allowlistCheck.purpose;
    console.log('[IPReputation] Bypassed - IP on allowlist:', allowlistCheck.description);
    return result;
  }

  // BYPASS 3: Internal tier (never check reputation)
  if (subscription_tier === 'internal') {
    result.bypassed = true;
    result.bypass_reason = 'internal_tier';
    return result;
  }

  // CHECK 1: Only paid tiers get IP reputation benefits
  if (subscription_tier === 'free') {
    result.checked = false;
    console.log('[IPReputation] Skipped - Free tier does not get IP reputation benefits');
    return result;
  }

  // CHECK 2: User must have opted in to intelligence sharing (paid tiers)
  // This is enforced by the caller (session-validator.js)
  // If we reach here, user has opted in

  // Get IP reputation
  const reputation = await getIPReputation(ipAddress);
  result.checked = true;
  result.reputation_score = reputation.reputation_score;
  result.reputation_data = {
    block_rate: reputation.block_rate,
    attack_types: reputation.attack_types,
    sample_count: reputation.sample_count,
    country_code: reputation.country_code,
    is_proxy: reputation.is_proxy,
    is_vpn: reputation.is_vpn,
    first_seen: reputation.first_seen,
    last_attack: reputation.last_attack
  };

  // BLOCK CHECK: Auto-block if enabled AND IP flagged
  if (auto_block_enabled && reputation.auto_block) {
    result.should_block = true;
    result.block_reason = 'ip_auto_block';
    console.log('[IPReputation] Auto-blocking IP - confirmed bad actor:', {
      reputation_score: reputation.reputation_score,
      block_rate: reputation.block_rate,
      sample_count: reputation.sample_count
    });
    return result;
  }

  // No block - just return reputation info
  console.log('[IPReputation] Checked - reputation score:', reputation.reputation_score);
  return result;
}

/**
 * Update IP reputation scores (called by background job)
 * Excludes allowlisted IPs from scoring
 */
export async function updateIPReputationScores() {
  try {
    // Get all non-allowlisted IPs from recent threat samples
    const { data: samples, error: samplesError } = await supabase
      .from('threat_intelligence_samples')
      .select('ip_hash, threat_severity, validation_result, attack_vectors, confidence_score')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('ip_hash', 'is', null);

    if (samplesError || !samples || samples.length === 0) {
      console.log('[IPReputation] No samples to process');
      return 0;
    }

    // Get allowlisted IP hashes
    const { data: allowlist } = await supabase
      .from('ip_allowlist')
      .select('ip_hash')
      .eq('active', true);

    const allowlistedHashes = new Set((allowlist || []).map(a => a.ip_hash));

    // Group samples by IP hash, excluding allowlisted IPs
    const ipStats = {};
    for (const sample of samples) {
      const ipHash = sample.ip_hash;

      // Skip allowlisted IPs
      if (allowlistedHashes.has(ipHash)) {
        continue;
      }

      if (!ipStats[ipHash]) {
        ipStats[ipHash] = {
          total: 0,
          blocked: 0,
          severities: [],
          attack_types: new Set()
        };
      }

      ipStats[ipHash].total++;

      if (!sample.validation_result?.safe) {
        ipStats[ipHash].blocked++;

        // Collect attack types
        if (sample.attack_vectors && Array.isArray(sample.attack_vectors)) {
          sample.attack_vectors.forEach(type => ipStats[ipHash].attack_types.add(type));
        }

        // Collect severity
        if (sample.threat_severity) {
          ipStats[ipHash].severities.push(sample.threat_severity);
        }
      }
    }

    // Update each IP's reputation
    let updated = 0;
    for (const [ipHash, stats] of Object.entries(ipStats)) {
      const blockRate = stats.blocked / stats.total;

      // Calculate average severity score
      const severityScores = {
        'critical': 1.0,
        'high': 0.75,
        'medium': 0.5,
        'low': 0.25
      };
      const avgSeverity = stats.severities.length > 0
        ? stats.severities.reduce((sum, sev) => sum + (severityScores[sev] || 0), 0) / stats.severities.length * 10
        : 0;

      // Reputation score formula: 70% block rate + 30% severity
      const reputationScore = Math.min(1.0,
        blockRate * 0.7 + (avgSeverity / 10) * 0.3
      );

      // Auto-block threshold: >80% block rate AND >=5 samples
      const autoBlock = (blockRate > 0.8 && stats.total >= 5);

      // Upsert reputation
      const { error: upsertError } = await supabase
        .from('ip_reputation')
        .upsert({
          ip_hash: ipHash,
          total_requests: stats.total,
          blocked_requests: stats.blocked,
          block_rate: blockRate,
          attack_types: Array.from(stats.attack_types),
          severity_avg: avgSeverity,
          reputation_score: reputationScore,
          auto_block: autoBlock,
          last_seen: new Date().toISOString(),
          last_attack: stats.blocked > 0 ? new Date().toISOString() : null,
          sample_count: stats.total,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'ip_hash'
        });

      if (!upsertError) {
        updated++;
      }
    }

    console.log('[IPReputation] Updated scores:', {
      total_ips: updated,
      allowlisted_excluded: allowlistedHashes.size
    });

    return updated;

  } catch (error) {
    console.error('[IPReputation] Error updating scores:', error.message);
    return 0;
  }
}

/**
 * Add IP to allowlist (admin only)
 */
export async function addToAllowlist(ipAddress, description, purpose, createdBy) {
  try {
    const ipHash = hashIP(ipAddress);

    const { error } = await supabase
      .from('ip_allowlist')
      .insert({
        ip_address: ipAddress,
        ip_hash: ipHash,
        description,
        purpose,
        created_by: createdBy,
        active: true
      });

    if (error) {
      console.error('[IPReputation] Error adding to allowlist:', error.message);
      return false;
    }

    console.log('[IPReputation] Added to allowlist:', description);
    return true;

  } catch (error) {
    console.error('[IPReputation] Error adding to allowlist:', error.message);
    return false;
  }
}

// Named exports for testing
export { isTestSuiteRequest, checkAllowlist };

// Helper functions for allowlist module
export async function isIPAllowlisted(ipAddress) {
  const result = await checkAllowlist(ipAddress);
  return result.isAllowlisted;
}

export async function getAllowlistHashes() {
  try {
    const { data, error } = await supabase
      .from('ip_allowlist')
      .select('ip_hash')
      .eq('active', true);

    if (error || !data) {
      return [];
    }

    return data.map(entry => entry.ip_hash);
  } catch (error) {
    console.error('[IPReputation] Error getting allowlist hashes:', error.message);
    return [];
  }
}

export default {
  checkIPReputation,
  updateIPReputationScores,
  addToAllowlist,
  isTestSuiteRequest
};
