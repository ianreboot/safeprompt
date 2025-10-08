import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // GDPR Article 17 - Right to Deletion (with scientific research exception per Article 17(3)(d))
    // We delete PII (prompt_text, client_ip) but keep anonymized threat statistics
    // This is legally compliant as anonymized data is no longer "personal data"

    const { data: deletedSamples, error: deleteError } = await supabase
      .from('threat_intelligence_samples')
      .update({
        prompt_text: null,
        prompt_compressed: null,
        client_ip: null,
        anonymized_at: new Date().toISOString()
      })
      .eq('profile_id', userId)
      .select('id')

    if (deleteError) {
      console.error('Error deleting PII:', deleteError)
      return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 })
    }

    // Log deletion for audit trail (GDPR Article 30 - Records of processing activities)
    const deletionLog = {
      user_id: userId,
      deleted_at: new Date().toISOString(),
      records_affected: deletedSamples?.length || 0,
      action: 'GDPR_DELETION',
      retained_data: 'Anonymized threat statistics (prompt_hash, ip_hash, validation_result, attack_vectors, threat_severity)'
    }

    console.log('GDPR deletion executed:', deletionLog)

    return NextResponse.json({
      success: true,
      deletedCount: deletedSamples?.length || 0,
      message: 'Personal data deleted successfully. Anonymized threat statistics retained for network defense.',
      audit_log: deletionLog
    }, { status: 200 })
  } catch (error: any) {
    console.error('GDPR deletion error:', error)
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 })
  }
}
