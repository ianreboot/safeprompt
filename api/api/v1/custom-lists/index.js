/**
 * Custom Lists API Routes
 * Phase 5 Task 5.2
 *
 * CRUD operations for custom whitelist/blacklist management
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sanitizeCustomRules } from '../../../lib/custom-lists-sanitizer.js';
import { getEffectiveLists, TIER_LIMITS } from '../../../lib/custom-lists-validator.js';
import { DEFAULT_WHITELIST, DEFAULT_BLACKLIST } from '../../../lib/default-lists.js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * GET /api/v1/custom-lists
 * Fetch user's effective lists (default + custom - removed)
 */
export async function getLists(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier, custom_whitelist, custom_blacklist, removed_defaults, uses_default_whitelist, uses_default_blacklist')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile does not exist'
      });
    }

    const tier = profile.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    // Get effective lists
    const effectiveLists = getEffectiveLists({
      customRules: null,
      profile: {
        custom_whitelist: profile.custom_whitelist || [],
        custom_blacklist: profile.custom_blacklist || [],
        removed_defaults: profile.removed_defaults || { whitelist: [], blacklist: [] },
        uses_default_whitelist: profile.uses_default_whitelist !== false,
        uses_default_blacklist: profile.uses_default_blacklist !== false
      },
      tier
    });

    return res.json({
      tier,
      limits: {
        customRulesEnabled: limits.customRulesEnabled,
        canEditDefaults: limits.canEditDefaults,
        maxCustomWhitelist: limits.maxCustomWhitelist,
        maxCustomBlacklist: limits.maxCustomBlacklist,
        maxTotalRules: limits.maxTotalRules
      },
      defaults: {
        whitelist: DEFAULT_WHITELIST,
        blacklist: DEFAULT_BLACKLIST
      },
      custom: {
        whitelist: profile.custom_whitelist || [],
        blacklist: profile.custom_blacklist || []
      },
      removed: profile.removed_defaults || { whitelist: [], blacklist: [] },
      uses_defaults: {
        whitelist: profile.uses_default_whitelist !== false,
        blacklist: profile.uses_default_blacklist !== false
      },
      effective: {
        whitelist: effectiveLists.whitelist,
        blacklist: effectiveLists.blacklist,
        sources: effectiveLists.sources
      }
    });

  } catch (error) {
    console.error('[CustomLists] Error fetching lists:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch custom lists'
    });
  }
}

/**
 * POST /api/v1/custom-lists/add
 * Add a custom phrase to whitelist or blacklist
 */
export async function addPhrase(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { listType, phrase } = req.body;

    // Validate input
    if (!listType || !['whitelist', 'blacklist'].includes(listType)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'listType must be "whitelist" or "blacklist"'
      });
    }

    if (!phrase || typeof phrase !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'phrase must be a non-empty string'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, custom_whitelist, custom_blacklist')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const tier = profile.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    // Check if tier allows custom rules
    if (!limits.customRulesEnabled) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Custom rules are not available for free tier',
        upgrade_required: true
      });
    }

    // Get current lists
    const currentWhitelist = profile.custom_whitelist || [];
    const currentBlacklist = profile.custom_blacklist || [];

    // Check limits
    const targetList = listType === 'whitelist' ? currentWhitelist : currentBlacklist;
    const maxLimit = listType === 'whitelist' ? limits.maxCustomWhitelist : limits.maxCustomBlacklist;

    if (targetList.length >= maxLimit) {
      return res.status(400).json({
        error: 'Limit exceeded',
        message: `Maximum ${listType} size of ${maxLimit} reached`,
        current: targetList.length,
        max: maxLimit
      });
    }

    // Sanitize the phrase
    const sanitizeResult = sanitizeCustomRules({
      [listType]: [phrase]
    }, tier);

    if (!sanitizeResult.valid) {
      return res.status(400).json({
        error: 'Invalid phrase',
        details: sanitizeResult.errors
      });
    }

    const sanitizedPhrase = sanitizeResult.sanitized[listType][0];

    // Check for duplicates (case-insensitive)
    const isDuplicate = targetList.some(p => p.toLowerCase() === sanitizedPhrase.toLowerCase());

    if (isDuplicate) {
      return res.status(400).json({
        error: 'Duplicate phrase',
        message: 'This phrase already exists in your list'
      });
    }

    // Add phrase to list
    const updatedList = [...targetList, sanitizedPhrase];

    // Update database
    const columnName = listType === 'whitelist' ? 'custom_whitelist' : 'custom_blacklist';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [columnName]: updatedList })
      .eq('id', userId);

    if (updateError) {
      console.error('[CustomLists] Update error:', updateError.message);
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to add phrase'
      });
    }

    return res.json({
      success: true,
      message: 'Phrase added successfully',
      listType,
      phrase: sanitizedPhrase,
      warnings: sanitizeResult.warnings,
      list: updatedList
    });

  } catch (error) {
    console.error('[CustomLists] Error adding phrase:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add phrase'
    });
  }
}

/**
 * DELETE /api/v1/custom-lists/remove
 * Remove a custom phrase from whitelist or blacklist
 */
export async function removePhrase(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { listType, phrase } = req.body;

    // Validate input
    if (!listType || !['whitelist', 'blacklist'].includes(listType)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'listType must be "whitelist" or "blacklist"'
      });
    }

    if (!phrase || typeof phrase !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'phrase must be a non-empty string'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, custom_whitelist, custom_blacklist')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const tier = profile.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    // Check if tier allows custom rules
    if (!limits.customRulesEnabled) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Custom rules are not available for free tier'
      });
    }

    // Get current list
    const targetList = listType === 'whitelist'
      ? (profile.custom_whitelist || [])
      : (profile.custom_blacklist || []);

    // Remove phrase (case-insensitive)
    const updatedList = targetList.filter(p => p.toLowerCase() !== phrase.toLowerCase());

    if (updatedList.length === targetList.length) {
      return res.status(404).json({
        error: 'Phrase not found',
        message: 'This phrase does not exist in your list'
      });
    }

    // Update database
    const columnName = listType === 'whitelist' ? 'custom_whitelist' : 'custom_blacklist';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [columnName]: updatedList })
      .eq('id', userId);

    if (updateError) {
      console.error('[CustomLists] Update error:', updateError.message);
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to remove phrase'
      });
    }

    return res.json({
      success: true,
      message: 'Phrase removed successfully',
      listType,
      phrase,
      list: updatedList
    });

  } catch (error) {
    console.error('[CustomLists] Error removing phrase:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to remove phrase'
    });
  }
}

/**
 * POST /api/v1/custom-lists/reset
 * Reset custom lists to defaults (clear all custom phrases)
 */
export async function resetLists(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const tier = profile.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    // Check if tier allows custom rules
    if (!limits.customRulesEnabled) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Custom rules are not available for free tier'
      });
    }

    // Reset custom lists
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        custom_whitelist: [],
        custom_blacklist: [],
        removed_defaults: { whitelist: [], blacklist: [] },
        uses_default_whitelist: true,
        uses_default_blacklist: true
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[CustomLists] Reset error:', updateError.message);
      return res.status(500).json({
        error: 'Reset failed',
        message: 'Failed to reset lists'
      });
    }

    return res.json({
      success: true,
      message: 'Custom lists reset to defaults successfully'
    });

  } catch (error) {
    console.error('[CustomLists] Error resetting lists:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reset lists'
    });
  }
}

/**
 * POST /api/v1/custom-lists/toggle-default
 * Enable/disable default lists
 */
export async function toggleDefaults(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { listType, enabled } = req.body;

    // Validate input
    if (!listType || !['whitelist', 'blacklist'].includes(listType)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'listType must be "whitelist" or "blacklist"'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'enabled must be a boolean'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const tier = profile.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    // Only paid tiers can disable defaults
    if (!limits.canEditDefaults) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Editing default lists is not available for free tier',
        upgrade_required: true
      });
    }

    // Update database
    const columnName = listType === 'whitelist' ? 'uses_default_whitelist' : 'uses_default_blacklist';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [columnName]: enabled })
      .eq('id', userId);

    if (updateError) {
      console.error('[CustomLists] Toggle error:', updateError.message);
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to toggle default list'
      });
    }

    return res.json({
      success: true,
      message: `Default ${listType} ${enabled ? 'enabled' : 'disabled'} successfully`,
      listType,
      enabled
    });

  } catch (error) {
    console.error('[CustomLists] Error toggling defaults:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to toggle default list'
    });
  }
}

/**
 * POST /api/v1/custom-lists/remove-default
 * Remove a specific phrase from default list (paid tiers only)
 */
export async function removeDefault(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { listType, phrase } = req.body;

    // Validate input
    if (!listType || !['whitelist', 'blacklist'].includes(listType)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'listType must be "whitelist" or "blacklist"'
      });
    }

    if (!phrase || typeof phrase !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'phrase must be a non-empty string'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, removed_defaults')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const tier = profile.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    // Only paid tiers can edit defaults
    if (!limits.canEditDefaults) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Editing default lists is not available for free tier',
        upgrade_required: true
      });
    }

    // Verify phrase exists in default list
    const defaultList = listType === 'whitelist' ? DEFAULT_WHITELIST : DEFAULT_BLACKLIST;
    const phraseExists = defaultList.some(p => p.toLowerCase() === phrase.toLowerCase());

    if (!phraseExists) {
      return res.status(404).json({
        error: 'Phrase not found',
        message: 'This phrase does not exist in the default list'
      });
    }

    // Get current removed_defaults
    const removedDefaults = profile.removed_defaults || { whitelist: [], blacklist: [] };
    const removedList = removedDefaults[listType] || [];

    // Check if already removed
    const alreadyRemoved = removedList.some(p => p.toLowerCase() === phrase.toLowerCase());

    if (alreadyRemoved) {
      return res.status(400).json({
        error: 'Already removed',
        message: 'This phrase has already been removed from defaults'
      });
    }

    // Add to removed list
    const updatedRemovedDefaults = {
      ...removedDefaults,
      [listType]: [...removedList, phrase]
    };

    // Update database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ removed_defaults: updatedRemovedDefaults })
      .eq('id', userId);

    if (updateError) {
      console.error('[CustomLists] Remove default error:', updateError.message);
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to remove default phrase'
      });
    }

    return res.json({
      success: true,
      message: 'Default phrase removed successfully',
      listType,
      phrase,
      removed: updatedRemovedDefaults[listType]
    });

  } catch (error) {
    console.error('[CustomLists] Error removing default:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to remove default phrase'
    });
  }
}

export default {
  getLists,
  addPhrase,
  removePhrase,
  resetLists,
  toggleDefaults,
  removeDefault
};
