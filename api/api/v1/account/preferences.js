// User preference management endpoint (Phase 1A)
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

export default async function handler(req, res) {
  // CORS
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const allowedOrigins = isProd
    ? ['https://safeprompt.dev', 'https://dashboard.safeprompt.dev']
    : ['https://dev.safeprompt.dev', 'https://dev-dashboard.safeprompt.dev', 'http://localhost:3000', 'http://localhost:5173'];

  const origin = req.headers.origin || req.headers.referer;
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user via API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const apiKeyHash = hashApiKey(apiKey);

    // Get profile by API key hash
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tier, subscription_tier, preferences')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const tier = profile.tier || profile.subscription_tier || 'free';
    const currentPreferences = profile.preferences || {};

    // GET - Return current preferences
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        preferences: {
          enable_intelligence_sharing: currentPreferences.enable_intelligence_sharing !== false, // Default true
          enable_ip_blocking: currentPreferences.enable_ip_blocking === true, // Default false
          tier: tier
        }
      });
    }

    // PATCH - Update preferences
    if (req.method === 'PATCH') {
      const { enable_intelligence_sharing, enable_ip_blocking } = req.body || {};

      // Validate tier restrictions
      if (enable_intelligence_sharing === false && tier === 'free') {
        return res.status(403).json({
          error: 'Free tier users cannot opt-out of intelligence sharing',
          message: 'Upgrade to Pro to disable intelligence collection',
          upgrade_required: true
        });
      }

      if (enable_ip_blocking === true && tier === 'free') {
        return res.status(403).json({
          error: 'IP blocking is only available on Pro tier',
          message: 'Upgrade to Pro to enable automatic IP blocking',
          upgrade_required: true
        });
      }

      // Build updated preferences (only update provided fields)
      const updatedPreferences = { ...currentPreferences };
      if (enable_intelligence_sharing !== undefined) {
        updatedPreferences.enable_intelligence_sharing = enable_intelligence_sharing;
      }
      if (enable_ip_blocking !== undefined) {
        updatedPreferences.enable_ip_blocking = enable_ip_blocking;
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Preference update error:', updateError);
        return res.status(500).json({ error: 'Failed to update preferences' });
      }

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          enable_intelligence_sharing: updatedPreferences.enable_intelligence_sharing !== false,
          enable_ip_blocking: updatedPreferences.enable_ip_blocking === true,
          tier: tier
        }
      });
    }

  } catch (error) {
    console.error('Preferences endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
