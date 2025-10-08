/**
 * User Preferences API
 * Quarter 1 Phase 1A Task 1A.10
 *
 * Allows Pro tier users to manage intelligence sharing preferences:
 * - intelligence_sharing: Opt in/out of data collection
 * - auto_block_enabled: Enable/disable IP reputation auto-blocking
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/v1/account/preferences
 *
 * Get current user preferences
 */
export async function getPreferences(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Get profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier, preferences')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile does not exist'
      });
    }

    // Default preferences
    const defaults = {
      intelligence_sharing: profile.tier === 'free' ? true : true,  // Free always true, Pro default true
      auto_block_enabled: false  // Default off (must opt-in)
    };

    const preferences = {
      ...defaults,
      ...(profile.preferences || {})
    };

    // Paid tiers can modify preferences
    const paidTiers = ['early_bird', 'starter', 'business', 'internal'];
    const canModify = paidTiers.includes(profile.tier);

    return res.json({
      tier: profile.tier,
      preferences,
      can_modify: canModify,  // Paid tiers can modify
      message: profile.tier === 'free'
        ? 'Free tier automatically participates in collective defense'
        : 'Paid tiers can opt in/out of intelligence sharing'
    });

  } catch (error) {
    console.error('[Preferences] Error getting preferences:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve preferences'
    });
  }
}

/**
 * PATCH /api/v1/account/preferences
 *
 * Update user preferences (Pro tier only)
 */
export async function updatePreferences(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { intelligence_sharing, auto_block_enabled } = req.body;

    // Validate input
    if (intelligence_sharing !== undefined && typeof intelligence_sharing !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'intelligence_sharing must be a boolean'
      });
    }

    if (auto_block_enabled !== undefined && typeof auto_block_enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'auto_block_enabled must be a boolean'
      });
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier, preferences')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile does not exist'
      });
    }

    // Only paid tiers can modify preferences
    const paidTiers = ['early_bird', 'starter', 'business', 'internal'];
    if (!paidTiers.includes(profile.tier)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Intelligence sharing preferences are only available for paid tiers',
        current_tier: profile.tier,
        upgrade_required: true
      });
    }

    // Update preferences
    const updatedPreferences = {
      ...(profile.preferences || {}),
      ...(intelligence_sharing !== undefined && { intelligence_sharing }),
      ...(auto_block_enabled !== undefined && { auto_block_enabled })
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ preferences: updatedPreferences })
      .eq('id', userId);

    if (updateError) {
      console.error('[Preferences] Update error:', updateError.message);
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to update preferences'
      });
    }

    // Build response message
    const warnings = [];
    if (intelligence_sharing === false) {
      warnings.push('You will no longer receive IP reputation protection or auto-blocking of known bad actors');
      warnings.push('Your data will not contribute to improving the SafePrompt network defense');
    }

    if (auto_block_enabled === true && intelligence_sharing !== false) {
      warnings.push('Auto-blocking is now enabled. High-confidence bad actors will be blocked automatically.');
    }

    if (auto_block_enabled === true && intelligence_sharing === false) {
      warnings.push('Auto-blocking requires intelligence sharing to be enabled. Auto-blocking will not work.');
    }

    return res.json({
      success: true,
      preferences: updatedPreferences,
      warnings: warnings.length > 0 ? warnings : undefined,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('[Preferences] Error updating preferences:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update preferences'
    });
  }
}

export default { getPreferences, updatePreferences };
