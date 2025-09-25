import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hash API key for comparison
const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Generate new API key
const generateApiKey = () => {
  return `sp_live_${crypto.randomBytes(32).toString('hex')}`;
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the user token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist
      if (profileError?.code === 'PGRST116') {
        const newApiKey = generateApiKey();
        const hashedKey = hashApiKey(newApiKey);
        const keyHint = newApiKey.slice(-4);

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            api_key: newApiKey,
            api_key_hash: hashedKey,
            api_key_hint: keyHint,
            subscription_tier: 'free',
            api_requests_limit: 10000,
            api_requests_used: 0,
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return res.status(500).json({ error: 'Failed to create profile' });
        }

        return res.status(200).json({
          api_key: newApiKey,
          key_hint: keyHint,
          subscription_tier: 'free',
          usage: {
            current: 0,
            limit: 10000,
            percentage: 0
          },
          created_at: newProfile.created_at
        });
      }

      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (req.method === 'GET') {
      // Return user's API key and usage
      const usagePercentage = profile.api_requests_limit > 0
        ? Math.round((profile.api_requests_used / profile.api_requests_limit) * 100)
        : 0;

      return res.status(200).json({
        api_key: profile.api_key || `sp_${profile.api_key_hint ? '•'.repeat(60) + profile.api_key_hint : 'hidden'}`,
        key_hint: profile.api_key_hint,
        subscription_tier: profile.subscription_tier,
        subscription_status: profile.subscription_status,
        usage: {
          current: profile.api_requests_used || 0,
          limit: profile.api_requests_limit || 10000,
          percentage: usagePercentage
        },
        created_at: profile.created_at,
        last_used_at: profile.last_used_at
      });

    } else if (req.method === 'POST') {
      // Regenerate API key
      const { action } = req.body;

      if (action === 'regenerate') {
        const newApiKey = generateApiKey();
        const hashedKey = hashApiKey(newApiKey);
        const keyHint = newApiKey.slice(-4);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            api_key: newApiKey,
            api_key_hash: hashedKey,
            api_key_hint: keyHint,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error regenerating API key:', updateError);
          return res.status(500).json({ error: 'Failed to regenerate API key' });
        }

        return res.status(200).json({
          success: true,
          api_key: newApiKey,
          key_hint: keyHint,
          message: 'API key regenerated successfully'
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API key endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}