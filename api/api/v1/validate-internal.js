// SafePrompt validation endpoint with internal test user support
import { validatePrompt } from '../../lib/prompt-validator.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hardcoded internal test API key for dogfooding
const INTERNAL_API_KEY = 'sp_test_unlimited_dogfood_key_2025';
const INTERNAL_USER_ID = '20c61fc4-9bc6-492a-9eeb-16f94391e745';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    let userId = null;
    let isInternalUser = false;

    // Check if it's our internal test API key
    if (apiKey === INTERNAL_API_KEY) {
      userId = INTERNAL_USER_ID;
      isInternalUser = true;
      console.log('[SafePrompt] Internal test API key used');
    } else if (apiKey && apiKey !== 'demo_key') {
      // For other API keys, validate against users table
      // (This would need to be implemented with proper API key storage)
      return res.status(401).json({
        error: 'API key validation not implemented for non-internal keys'
      });
    }

    // Track usage for internal user (but don't enforce limits)
    if (userId && !isInternalUser) {
      const { data: user } = await supabase
        .from('users')
        .select('monthly_limit, tier')
        .eq('id', userId)
        .single();

      if (user && user.monthly_limit) {
        // Check limits only for non-internal users
        // Internal users have monthly_limit=999999
        if (user.monthly_limit < 999999) {
          // Would check actual usage here
          console.log(`[SafePrompt] User ${userId} has limit of ${user.monthly_limit}`);
        }
      }
    }

    // Get request parameters
    const {
      prompt,
      mode = 'optimized',
      include_stats = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate the prompt
    const startTime = Date.now();
    const result = await validatePrompt(prompt, { mode });
    const processingTime = Date.now() - startTime;

    // Add metadata
    const response = {
      ...result,
      mode,
      processingTime,
      timestamp: new Date().toISOString()
    };

    // Add internal user flag if applicable
    if (isInternalUser) {
      response.internal_account = true;
      response.usage_tracking = 'unlimited';
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      safe: false,
      confidence: 0,
      details: error.message
    });
  }
}