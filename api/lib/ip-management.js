/**
 * IP Management Module - Phase 1C
 *
 * Implements whitelist/blacklist priority logic:
 * 1. Whitelist FIRST (always allow)
 * 2. Blacklist SECOND (always block)
 * 3. Automatic Reputation THIRD (score-based)
 *
 * Admin-only operations with full audit trail
 */

import { supabase } from './supabase.js';

/**
 * Priority-based IP checking
 * @param {string} ip - IP address to check
 * @returns {Promise<{allowed: boolean, reason: string, source: string}>}
 */
export async function checkIpWithPriority(ip) {
  // Priority 1: Check whitelist first
  const whitelistResult = await checkIpWhitelist(ip);
  if (whitelistResult.isWhitelisted) {
    return {
      allowed: true,
      reason: whitelistResult.reason || 'IP is whitelisted',
      source: 'whitelist',
      data: whitelistResult.data
    };
  }

  // Priority 2: Check blacklist second
  const blacklistResult = await checkIpBlacklist(ip);
  if (blacklistResult.isBlacklisted) {
    return {
      allowed: false,
      reason: blacklistResult.reason || 'IP is blacklisted',
      source: 'blacklist',
      severity: blacklistResult.severity,
      data: blacklistResult.data
    };
  }

  // Priority 3: Check automatic reputation (existing system)
  const reputationResult = await checkIpReputation(ip);
  if (reputationResult.shouldBlock) {
    return {
      allowed: false,
      reason: reputationResult.reason || 'IP has poor reputation',
      source: 'reputation',
      score: reputationResult.score,
      data: reputationResult.data
    };
  }

  // Default: Allow
  return {
    allowed: true,
    reason: 'IP has no negative history',
    source: 'default',
    score: reputationResult.score || 0
  };
}

/**
 * Check if IP is in whitelist
 * @param {string} ip - IP address
 * @returns {Promise<{isWhitelisted: boolean, reason: string|null, data: object|null}>}
 */
export async function checkIpWhitelist(ip) {
  try {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .select('*')
      .eq('ip', ip)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking whitelist:', error);
      return { isWhitelisted: false, reason: null, data: null };
    }

    if (data) {
      return {
        isWhitelisted: true,
        reason: data.reason,
        data: data
      };
    }

    return { isWhitelisted: false, reason: null, data: null };
  } catch (err) {
    console.error('Exception checking whitelist:', err);
    return { isWhitelisted: false, reason: null, data: null };
  }
}

/**
 * Check if IP is in blacklist
 * @param {string} ip - IP address
 * @returns {Promise<{isBlacklisted: boolean, reason: string|null, severity: string|null, data: object|null}>}
 */
export async function checkIpBlacklist(ip) {
  try {
    const { data, error } = await supabase
      .from('ip_blacklist')
      .select('*')
      .eq('ip', ip)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking blacklist:', error);
      return { isBlacklisted: false, reason: null, severity: null, data: null };
    }

    if (data) {
      return {
        isBlacklisted: true,
        reason: data.reason,
        severity: data.severity,
        data: data
      };
    }

    return { isBlacklisted: false, reason: null, severity: null, data: null };
  } catch (err) {
    console.error('Exception checking blacklist:', err);
    return { isBlacklisted: false, reason: null, severity: null, data: null };
  }
}

/**
 * Check IP reputation from existing system
 * Uses ip_reputation table with manual_blocked override
 * @param {string} ip - IP address
 * @returns {Promise<{shouldBlock: boolean, reason: string|null, score: number, data: object|null}>}
 */
export async function checkIpReputation(ip) {
  try {
    // Hash the IP for lookup (existing system uses SHA256 hashing)
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    const { data, error } = await supabase
      .from('ip_reputation')
      .select('*')
      .eq('ip_hash', ipHash)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking reputation:', error);
      return { shouldBlock: false, reason: null, score: 0, data: null };
    }

    if (!data) {
      return { shouldBlock: false, reason: null, score: 0, data: null };
    }

    // Check if manually blocked (Phase 1C addition)
    if (data.manually_blocked === true) {
      return {
        shouldBlock: true,
        reason: data.manual_block_reason || 'IP manually blocked by admin',
        score: data.reputation_score || 1.0,
        data: data
      };
    }

    // Check automatic reputation score
    if (data.auto_block === true || data.reputation_score >= 0.8) {
      return {
        shouldBlock: true,
        reason: `IP has reputation score of ${data.reputation_score} (threshold: 0.8)`,
        score: data.reputation_score,
        data: data
      };
    }

    return {
      shouldBlock: false,
      reason: null,
      score: data.reputation_score || 0,
      data: data
    };
  } catch (err) {
    console.error('Exception checking reputation:', err);
    return { shouldBlock: false, reason: null, score: 0, data: null };
  }
}

/**
 * Add IP to whitelist (admin only)
 * @param {string} ip - IP address
 * @param {string} reason - Reason for whitelisting
 * @param {string} adminUserId - Admin user ID
 * @param {Date|null} expiresAt - Optional expiration date
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function addToWhitelist(ip, reason, adminUserId, expiresAt = null) {
  try {
    // Insert into whitelist
    const { data: whitelistData, error: insertError } = await supabase
      .from('ip_whitelist')
      .insert({
        ip,
        reason,
        added_by: adminUserId,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message, data: null };
    }

    // Create audit log entry
    await createAuditEntry({
      action_type: 'whitelist_add',
      ip,
      admin_user_id: adminUserId,
      reason,
      before_state: null,
      after_state: whitelistData
    });

    return { success: true, error: null, data: whitelistData };
  } catch (err) {
    console.error('Exception adding to whitelist:', err);
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Remove IP from whitelist (admin only)
 * @param {string} ip - IP address
 * @param {string} reason - Reason for removal
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function removeFromWhitelist(ip, reason, adminUserId) {
  try {
    // Get current state for audit trail
    const { data: beforeState } = await supabase
      .from('ip_whitelist')
      .select('*')
      .eq('ip', ip)
      .single();

    // Delete from whitelist
    const { error: deleteError } = await supabase
      .from('ip_whitelist')
      .delete()
      .eq('ip', ip);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Create audit log entry
    await createAuditEntry({
      action_type: 'whitelist_remove',
      ip,
      admin_user_id: adminUserId,
      reason,
      before_state: beforeState,
      after_state: null
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('Exception removing from whitelist:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Add IP to blacklist (admin only)
 * @param {string} ip - IP address
 * @param {string} reason - Reason for blacklisting
 * @param {string} severity - Severity level (low, medium, high, critical)
 * @param {string} adminUserId - Admin user ID
 * @param {string|null} source - Optional source (threat feed, incident ID, etc.)
 * @param {Date|null} expiresAt - Optional expiration date
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function addToBlacklist(ip, reason, severity, adminUserId, source = null, expiresAt = null) {
  try {
    // Insert into blacklist
    const { data: blacklistData, error: insertError } = await supabase
      .from('ip_blacklist')
      .insert({
        ip,
        reason,
        severity,
        source,
        added_by: adminUserId,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message, data: null };
    }

    // Create audit log entry
    await createAuditEntry({
      action_type: 'blacklist_add',
      ip,
      admin_user_id: adminUserId,
      reason,
      before_state: null,
      after_state: blacklistData
    });

    return { success: true, error: null, data: blacklistData };
  } catch (err) {
    console.error('Exception adding to blacklist:', err);
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Remove IP from blacklist (admin only)
 * @param {string} ip - IP address
 * @param {string} reason - Reason for removal
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function removeFromBlacklist(ip, reason, adminUserId) {
  try {
    // Get current state for audit trail
    const { data: beforeState } = await supabase
      .from('ip_blacklist')
      .select('*')
      .eq('ip', ip)
      .single();

    // Delete from blacklist
    const { error: deleteError } = await supabase
      .from('ip_blacklist')
      .delete()
      .eq('ip', ip);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Create audit log entry
    await createAuditEntry({
      action_type: 'blacklist_remove',
      ip,
      admin_user_id: adminUserId,
      reason,
      before_state: beforeState,
      after_state: null
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('Exception removing from blacklist:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Manually block an IP (admin only)
 * Updates ip_reputation table with manual block flag
 * @param {string} ip - IP address
 * @param {string} reason - Reason for blocking
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function manuallyBlockIp(ip, reason, adminUserId) {
  try {
    // Hash the IP
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Get current state
    const { data: beforeState } = await supabase
      .from('ip_reputation')
      .select('*')
      .eq('ip_hash', ipHash)
      .single();

    // Update or insert reputation record
    const { data: afterState, error: upsertError } = await supabase
      .from('ip_reputation')
      .upsert({
        ip_hash: ipHash,
        manually_blocked: true,
        manual_block_reason: reason,
        manual_block_by: adminUserId,
        manual_block_at: new Date().toISOString(),
        reputation_score: Math.max(beforeState?.reputation_score || 0, 0.9),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'ip_hash'
      })
      .select()
      .single();

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    // Create audit log entry
    await createAuditEntry({
      action_type: 'block',
      ip,
      admin_user_id: adminUserId,
      reason,
      before_state: beforeState,
      after_state: afterState
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('Exception manually blocking IP:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Unblock a manually blocked IP (admin only)
 * @param {string} ip - IP address
 * @param {string} reason - Reason for unblocking
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function unblockIp(ip, reason, adminUserId) {
  try {
    // Hash the IP
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Get current state
    const { data: beforeState } = await supabase
      .from('ip_reputation')
      .select('*')
      .eq('ip_hash', ipHash)
      .single();

    if (!beforeState) {
      return { success: false, error: 'IP reputation record not found' };
    }

    // Update reputation record - remove manual block
    const { data: afterState, error: updateError } = await supabase
      .from('ip_reputation')
      .update({
        manually_blocked: false,
        manual_block_reason: null,
        manual_block_by: null,
        manual_block_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('ip_hash', ipHash)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entry
    await createAuditEntry({
      action_type: 'unblock',
      ip,
      admin_user_id: adminUserId,
      reason,
      before_state: beforeState,
      after_state: afterState
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('Exception unblocking IP:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create audit trail entry
 * @param {object} entry - Audit entry data
 * @returns {Promise<void>}
 */
async function createAuditEntry(entry) {
  try {
    const { error } = await supabase
      .from('ip_admin_actions')
      .insert(entry);

    if (error) {
      console.error('Failed to create audit entry:', error);
    }
  } catch (err) {
    console.error('Exception creating audit entry:', err);
  }
}

/**
 * Check if user is admin
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>}
 */
export async function isUserAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('is_admin, revoked_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_admin === true && data.revoked_at === null;
  } catch (err) {
    console.error('Exception checking admin status:', err);
    return false;
  }
}

/**
 * Get IP reputation list (admin only)
 * @param {object} filters - Filter options (limit, offset, score_min, auto_block_only, etc.)
 * @returns {Promise<{data: array, error: string|null, total: number}>}
 */
export async function getIpReputationList(filters = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      score_min = null,
      auto_block_only = false,
      manually_blocked_only = false,
      order_by = 'reputation_score',
      order_dir = 'desc'
    } = filters;

    let query = supabase
      .from('ip_reputation')
      .select('*', { count: 'exact' });

    if (score_min !== null) {
      query = query.gte('reputation_score', score_min);
    }

    if (auto_block_only) {
      query = query.eq('auto_block', true);
    }

    if (manually_blocked_only) {
      query = query.eq('manually_blocked', true);
    }

    query = query.order(order_by, { ascending: order_dir === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], error: error.message, total: 0 };
    }

    return { data: data || [], error: null, total: count || 0 };
  } catch (err) {
    console.error('Exception getting IP reputation list:', err);
    return { data: [], error: err.message, total: 0 };
  }
}

/**
 * Get audit log entries (admin only)
 * @param {object} filters - Filter options (limit, offset, action_type, ip, admin_user_id)
 * @returns {Promise<{data: array, error: string|null, total: number}>}
 */
export async function getAuditLog(filters = {}) {
  try {
    const {
      limit = 100,
      offset = 0,
      action_type = null,
      ip = null,
      admin_user_id = null
    } = filters;

    let query = supabase
      .from('ip_admin_actions')
      .select('*', { count: 'exact' });

    if (action_type) {
      query = query.eq('action_type', action_type);
    }

    if (ip) {
      query = query.eq('ip', ip);
    }

    if (admin_user_id) {
      query = query.eq('admin_user_id', admin_user_id);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], error: error.message, total: 0 };
    }

    return { data: data || [], error: null, total: count || 0 };
  } catch (err) {
    console.error('Exception getting audit log:', err);
    return { data: [], error: err.message, total: 0 };
  }
}
