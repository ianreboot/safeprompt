// GDPR Right to Access endpoint (Phase 1A)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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
      .select('*')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Build export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: profile.id,
      account: {
        email: profile.email,
        tier: profile.tier || profile.subscription_tier,
        subscription_status: profile.subscription_status,
        created_at: profile.created_at,
        api_requests_used: profile.api_requests_used,
        api_requests_limit: profile.api_requests_limit
      },
      preferences: profile.preferences || {},
      intelligence_samples: [],
      validation_sessions: [],
      api_usage: {
        total_requests: profile.api_requests_used || 0,
        requests_limit: profile.api_requests_limit || 0
      }
    };

    // Fetch intelligence samples (non-anonymized only - contains PII)
    const { data: samples } = await supabase
      .from('intelligence_samples')
      .select('*')
      .eq('user_id', profile.id)
      .is('anonymized_at', null) // Only export non-anonymized (contains PII)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (samples) {
      exportData.intelligence_samples = samples.map(s => ({
        prompt_text: s.prompt_text,
        threat_type: s.threat_type,
        confidence: s.confidence,
        created_at: s.created_at,
        ip_hash: s.ip_hash.substring(0, 16) + '...' // Partial hash for reference
      }));
    }

    // Fetch validation sessions (last 2 hours)
    const { data: sessions } = await supabase
      .from('validation_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (sessions) {
      exportData.validation_sessions = sessions.map(s => ({
        session_token: s.session_token,
        created_at: s.created_at,
        last_activity: s.last_activity,
        history: s.history, // Validation history
        flags: s.flags // Suspicious patterns detected
      }));
    }

    // Add metadata
    exportData.metadata = {
      total_samples: exportData.intelligence_samples.length,
      total_sessions: exportData.validation_sessions.length,
      data_retention: {
        intelligence_samples: '24 hours before anonymization',
        validation_sessions: '2 hours auto-deletion',
        account_data: 'While active + 90 days after deletion'
      },
      note: 'This export contains only personally identifiable information. Anonymized data (cryptographic hashes) is excluded as it contains no PII.'
    };

    return res.status(200).json(exportData);

  } catch (error) {
    console.error('Privacy export error:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
}
