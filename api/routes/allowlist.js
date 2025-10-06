/**
 * IP Allowlist Management API
 * Quarter 1 Phase 1A Task 1A.12
 *
 * Admin-only endpoints for managing IP allowlist:
 * - GET /api/v1/admin/allowlist - List allowlisted IPs
 * - POST /api/v1/admin/allowlist - Add IP to allowlist
 * - PATCH /api/v1/admin/allowlist/:id - Update allowlist entry
 * - DELETE /api/v1/admin/allowlist/:id - Remove from allowlist
 *
 * Used for: Testing infrastructure, CI/CD, internal systems
 */

import { createClient } from '@supabase/supabase-js';
import { addToAllowlist } from '../lib/ip-reputation.js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if user is admin/internal tier
 */
async function isAdmin(userId) {
  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  return data?.tier === 'internal';
}

/**
 * GET /api/v1/admin/allowlist
 *
 * List all allowlisted IPs (admin only)
 */
export async function listAllowlist(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { data, error } = await supabase
      .from('ip_allowlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Allowlist] List error:', error.message);
      return res.status(500).json({
        error: 'Failed to list allowlist',
        message: error.message
      });
    }

    return res.json({
      success: true,
      allowlist: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.error('[Allowlist] Error:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list allowlist'
    });
  }
}

/**
 * POST /api/v1/admin/allowlist
 *
 * Add IP to allowlist (admin only)
 */
export async function addAllowlistEntry(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { ip_address, description, purpose } = req.body;

    // Validate input
    if (!ip_address || !description || !purpose) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'ip_address, description, and purpose are required'
      });
    }

    const validPurposes = ['testing', 'ci_cd', 'internal', 'monitoring', 'admin'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({
        error: 'Invalid purpose',
        message: `Purpose must be one of: ${validPurposes.join(', ')}`
      });
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip_address)) {
      return res.status(400).json({
        error: 'Invalid IP address',
        message: 'IP address must be in format: 192.168.1.1 or 192.168.1.0/24'
      });
    }

    // Add to allowlist
    const success = await addToAllowlist(ip_address, description, purpose, userId);

    if (!success) {
      return res.status(500).json({
        error: 'Failed to add to allowlist',
        message: 'Database error or duplicate IP'
      });
    }

    return res.json({
      success: true,
      message: 'IP added to allowlist successfully',
      ip_address,
      description,
      purpose
    });

  } catch (error) {
    console.error('[Allowlist] Error adding entry:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add to allowlist'
    });
  }
}

/**
 * PATCH /api/v1/admin/allowlist/:id
 *
 * Update allowlist entry (admin only)
 */
export async function updateAllowlistEntry(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { description, purpose, active, expires_at } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Allowlist entry ID required'
      });
    }

    // Build update object
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (purpose !== undefined) {
      const validPurposes = ['testing', 'ci_cd', 'internal', 'monitoring', 'admin'];
      if (!validPurposes.includes(purpose)) {
        return res.status(400).json({
          error: 'Invalid purpose',
          message: `Purpose must be one of: ${validPurposes.join(', ')}`
        });
      }
      updates.purpose = purpose;
    }
    if (active !== undefined) updates.active = active;
    if (expires_at !== undefined) updates.expires_at = expires_at;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Provide at least one field to update'
      });
    }

    const { error } = await supabase
      .from('ip_allowlist')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[Allowlist] Update error:', error.message);
      return res.status(500).json({
        error: 'Failed to update',
        message: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Allowlist entry updated successfully',
      id,
      updates
    });

  } catch (error) {
    console.error('[Allowlist] Error updating entry:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update allowlist entry'
    });
  }
}

/**
 * DELETE /api/v1/admin/allowlist/:id
 *
 * Remove IP from allowlist (admin only)
 */
export async function deleteAllowlistEntry(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Allowlist entry ID required'
      });
    }

    const { error } = await supabase
      .from('ip_allowlist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Allowlist] Delete error:', error.message);
      return res.status(500).json({
        error: 'Failed to delete',
        message: error.message
      });
    }

    return res.json({
      success: true,
      message: 'IP removed from allowlist successfully',
      id
    });

  } catch (error) {
    console.error('[Allowlist] Error deleting entry:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete allowlist entry'
    });
  }
}

export default {
  listAllowlist,
  addAllowlistEntry,
  updateAllowlistEntry,
  deleteAllowlistEntry
};
