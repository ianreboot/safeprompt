import { supabase } from './supabase'

/**
 * SECURITY: Audit logging for all admin operations
 * Captures: who did what, when, to whom, with what result
 */

export interface AuditLogEntry {
  admin_id: string
  admin_email: string
  action: string
  target_user_id?: string
  target_email?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
}

/**
 * Log admin operation to database for security audit trail
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        ...entry,
        created_at: new Date().toISOString()
      })

    if (error) {
      // Log to console as fallback, don't fail the operation
      console.error('Failed to write audit log:', error)
      console.log('Audit log entry:', JSON.stringify(entry))
    }
  } catch (err) {
    // Never throw - audit logging failure shouldn't break admin operations
    console.error('Audit logging error:', err)
    console.log('Audit log entry:', JSON.stringify(entry))
  }
}

/**
 * Helper to get client IP from request (Next.js API routes)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

/**
 * Admin action types for consistency
 */
export const ADMIN_ACTIONS = {
  VIEW_USER_DETAILS: 'view_user_details',
  VIEW_USER_API_KEY: 'view_user_api_key',
  SUSPEND_USER: 'suspend_user',
  UNSUSPEND_USER: 'unsuspend_user',
  APPROVE_WAITLIST: 'approve_waitlist',
  REJECT_WAITLIST: 'reject_waitlist',
  UPDATE_USER_TIER: 'update_user_tier',
  REFUND_ISSUED: 'refund_issued',
  CREDIT_APPLIED: 'credit_applied',
  API_KEY_REGENERATED: 'api_key_regenerated',
  DELETE_USER: 'delete_user',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data'
} as const
