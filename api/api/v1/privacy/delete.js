// GDPR Right to Deletion endpoint (Phase 1A)
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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
      .select('id')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    let deletionSummary = {
      intelligence_samples_deleted: 0,
      sessions_deleted: 0,
      total_records: 0
    };

    // 1. Delete intelligence samples (<24h with personal data)
    // Only delete samples that still have prompt_text (not yet anonymized)
    const { data: samplesDeleted, error: samplesError } = await supabase
      .from('intelligence_samples')
      .delete()
      .eq('user_id', profile.id)
      .is('anonymized_at', null) // Only delete non-anonymized samples
      .select('id');

    if (!samplesError && samplesDeleted) {
      deletionSummary.intelligence_samples_deleted = samplesDeleted.length;
    }

    // 2. Delete validation sessions (<2h session data)
    const { data: sessionsDeleted, error: sessionsError } = await supabase
      .from('validation_sessions')
      .delete()
      .eq('user_id', profile.id)
      .select('session_token');

    if (!sessionsError && sessionsDeleted) {
      deletionSummary.sessions_deleted = sessionsDeleted.length;
    }

    deletionSummary.total_records = deletionSummary.intelligence_samples_deleted + deletionSummary.sessions_deleted;

    return res.status(200).json({
      success: true,
      message: 'Personally identifiable data deleted successfully',
      deleted: deletionSummary,
      note: 'Anonymized data (cryptographic hashes) cannot be deleted as it contains no personally identifiable information'
    });

  } catch (error) {
    console.error('Privacy deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete data' });
  }
}
