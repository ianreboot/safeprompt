# SafePrompt Data Retention Policy

**Version**: 1.0 (Phase 1A)
**Effective Date**: 2025-10-06
**Last Updated**: 2025-10-06

## Table of Contents
1. [Policy Overview](#policy-overview)
2. [Retention Schedules](#retention-schedules)
3. [Data Categories](#data-categories)
4. [Anonymization Process](#anonymization-process)
5. [Deletion Procedures](#deletion-procedures)
6. [Legal Basis](#legal-basis)
7. [User Rights](#user-rights)
8. [Implementation](#implementation)

---

## Policy Overview

SafePrompt balances two competing needs:
1. **Network Security**: Learning from attacks to protect all customers
2. **User Privacy**: Minimizing personal data retention

Our approach: **Aggressive anonymization** with permanent pattern storage.

### Core Principles

1. **Time-Limited PII**: Personal data deleted within 24 hours
2. **Permanent Patterns**: Attack patterns stored indefinitely (no PII)
3. **User Control**: Pro tier can request immediate deletion
4. **Transparent**: Clear documentation of what's kept and why

---

## Retention Schedules

### Quick Reference Table

| Data Type | Retention Period | Anonymization | Permanent Storage |
|-----------|------------------|---------------|-------------------|
| **Validation Requests** | 90 days | N/A | No PII stored |
| **API Keys** | Until user deletion | N/A | Hashed only |
| **Session Data** | 2 hours | Automatic | No |
| **Prompt Text** | **24 hours** | Automatic | Hash only |
| **Client IP Addresses** | **24 hours** | Automatic | Hash only |
| **Attack Patterns** | **Indefinite** | N/A | Hashed |
| **IP Reputation** | **Indefinite** | N/A | Hashed |
| **User Profiles** | Until account deletion | N/A | No |
| **Usage Metrics** | **90 days** | Automatic | Aggregated only |
| **Logs** | **30 days** | Automatic | No |

### Timeline Visualization

```
┌──────────────────────────────────────────────────────────┐
│ T+0: Validation Request                                   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Stored: prompt_text, client_ip, attack_vectors     │   │
│ │ Also: prompt_hash, ip_hash (permanent)             │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ T+2 hours: Session Cleanup                                │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Deleted: validation_sessions (expired)             │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ T+24 hours: Anonymization (CRITICAL)                      │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Deleted: prompt_text, client_ip                    │   │
│ │ Retained: prompt_hash, ip_hash, attack_vectors     │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ T+30 days: Log Cleanup                                    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Deleted: API logs, error logs                      │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ T+90 days: Metrics Cleanup                                │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Deleted: User-level usage metrics                  │   │
│ │ Retained: Aggregate statistics (no PII)            │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ T+∞: Permanent Storage                                    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Kept Forever: Hashed patterns, IP reputation       │   │
│ │ No PII - Cannot be reversed to identify users      │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Data Categories

### Category 1: Identifiable Personal Data (24-Hour Retention)

**What**: Data that can identify specific users or end-users

**Examples**:
- Prompt text: `"My email is user@example.com, process this"`
- Client IP addresses: `203.0.113.45`
- Session history with full prompts

**Retention**: **24 hours maximum**

**Anonymization**:
- `UPDATE threat_intelligence_samples SET prompt_text = NULL, client_ip = NULL WHERE created_at < NOW() - INTERVAL '24 hours'`

**Legal Basis**: GDPR Article 5(1)(e) - Storage limitation

**Why 24 Hours**:
- Allows debugging of recent issues
- Enables user-requested data export
- Short enough to minimize privacy risk
- Long enough for operational needs

### Category 2: Cryptographic Hashes (Permanent Retention)

**What**: One-way hashes that cannot be reversed to identify users

**Examples**:
- `prompt_hash`: SHA-256 hash of prompt text
- `ip_hash`: SHA-256 hash of IP address + secret salt
- Attack pattern fingerprints

**Retention**: **Indefinite**

**Anonymization**: Not required (already anonymous)

**Legal Basis**: GDPR Recital 26 - Anonymous information

**Why Permanent**:
- Enables network defense intelligence
- No privacy risk (cannot identify users)
- Allows historical attack pattern analysis
- Core competitive advantage

### Category 3: Attack Metadata (Permanent Retention)

**What**: Information about attacks that contains no PII

**Examples**:
- Attack vectors: `["prompt_injection", "xss_attack"]`
- Threat severity: `"high"`
- Confidence scores: `0.95`
- Timestamps: `2025-10-06T10:00:00Z`
- User tier (anonymized): `"free"` or `"pro"`

**Retention**: **Indefinite**

**Anonymization**: Not required (no PII)

**Legal Basis**: Legitimate interest (network security)

**Why Permanent**:
- Essential for threat intelligence
- No identifiable information
- Enables attack trend analysis

### Category 4: Session Data (2-Hour Retention)

**What**: Multi-turn conversation tracking for attack detection

**Examples**:
- Session tokens: `sess_abc123...`
- Validation history (prompt text included)
- Suspicious pattern flags

**Retention**: **2 hours maximum**

**Anonymization**: Automatic deletion after expiration

**Legal Basis**: Contractual necessity (service provision)

**Why 2 Hours**:
- Most conversations complete within 2 hours
- Long enough for multi-turn detection
- Short enough to minimize exposure
- Balances security and privacy

### Category 5: User Account Data (Until Account Deletion)

**What**: Information required for service provision

**Examples**:
- Email address
- API keys (hashed)
- Subscription tier
- Usage limits
- Preferences

**Retention**: **Until user deletes account**

**Anonymization**: Not applicable (required for service)

**Legal Basis**: Contractual necessity

**Deletion**: On account deletion, all user data deleted except:
- Aggregate usage stats (no identifying info)
- Hashed attack patterns (already anonymous)

### Category 6: Usage Metrics (90-Day Retention)

**What**: Per-user API usage statistics

**Examples**:
- Daily validation counts
- Response times
- Threat detection rates
- Cost per 1K requests

**Retention**: **90 days**

**Anonymization**: After 90 days, aggregate into system-wide statistics (no per-user data)

**Legal Basis**: Legitimate interest (system optimization)

**Why 90 Days**:
- Allows quarterly usage analysis
- Enables billing dispute resolution
- Long enough for trend analysis
- Short enough to limit exposure

### Category 7: System Logs (30-Day Retention)

**What**: Application logs for debugging and monitoring

**Examples**:
- API request logs
- Error logs
- Database query logs
- Performance metrics

**Retention**: **30 days**

**Anonymization**: API keys hashed, IPs hashed in logs

**Legal Basis**: Legitimate interest (system operation)

**Why 30 Days**:
- Sufficient for debugging recent issues
- Long enough for security incident investigation
- Short enough to minimize log storage costs

---

## Anonymization Process

### Automated Anonymization (Hourly Job)

**Schedule**: Runs every hour via Vercel Cron

**SQL Query**:
```sql
-- Anonymize samples older than 24 hours
UPDATE threat_intelligence_samples
SET
  prompt_text = NULL,
  client_ip = NULL,
  anonymized_at = NOW()
WHERE
  created_at < NOW() - INTERVAL '24 hours'
  AND anonymized_at IS NULL;
```

**Success Criteria**:
- **100% success rate required** (legal compliance)
- Alert if job fails or is delayed >2 hours
- Manual intervention required if automatic job fails

**Monitoring**:
```sql
-- Check for samples that should be anonymized but aren't
SELECT COUNT(*) as overdue_samples
FROM threat_intelligence_samples
WHERE created_at < NOW() - INTERVAL '25 hours'  -- 1-hour grace period
  AND anonymized_at IS NULL;

-- Expected result: 0
-- Alert if > 0
```

### Manual Anonymization (On-Demand)

**Trigger**: User requests immediate data deletion via `/api/v1/privacy/delete`

**Process**:
1. Verify user authentication
2. Delete all samples with user's API key (<24h old)
3. Delete all active sessions
4. Retain hashed patterns (no PII)

**SQL Query**:
```sql
-- Immediate deletion for user request
UPDATE threat_intelligence_samples
SET
  prompt_text = NULL,
  client_ip = NULL,
  anonymized_at = NOW()
WHERE
  user_id = $1
  AND anonymized_at IS NULL;

DELETE FROM validation_sessions
WHERE user_id = $1;
```

### Verification Process

**Daily Audit**:
```sql
-- Verify no PII older than 24 hours exists
SELECT
  COUNT(*) as violations,
  MAX(created_at) as oldest_violation
FROM threat_intelligence_samples
WHERE
  created_at < NOW() - INTERVAL '24 hours'
  AND (prompt_text IS NOT NULL OR client_ip IS NOT NULL);

-- Expected: violations = 0
-- Alert if violations > 0
```

---

## Deletion Procedures

### User-Initiated Deletion

**Endpoint**: `DELETE /api/v1/privacy/delete`

**What Gets Deleted**:
1. All prompt text and IP addresses (<24h old)
2. All active validation sessions
3. All usage logs containing user's API key

**What Gets Retained** (Legal Basis: Legitimate Interest):
1. Cryptographic hashes (no PII)
2. Attack vectors and severity (anonymized)
3. Aggregate statistics (system-wide, no per-user data)

**Timeline**: Completed within 1 hour of request

**Confirmation**:
```json
{
  "success": true,
  "deleted": {
    "prompt_samples": 142,
    "sessions": 5,
    "logs": 284
  },
  "retained": {
    "hashed_patterns": 142,
    "reason": "No personally identifiable information"
  }
}
```

### Account Deletion

**Trigger**: User deletes account via dashboard

**What Gets Deleted**:
1. User profile (email, subscription info)
2. API keys (hashed copies deleted)
3. All identifiable data from samples/sessions
4. All usage metrics

**What Gets Retained**:
1. Cryptographic hashes (attack patterns)
2. Aggregate system statistics
3. Financial records (7 years for tax compliance)

**Timeline**: Completed within 48 hours of account deletion

### Administrative Deletion

**Trigger**: Legal request, compliance requirement, or data breach

**Process**:
1. Legal/compliance team approval required
2. Database admin executes deletion script
3. Verification query confirms deletion
4. Audit log entry created
5. User notification (if applicable)

**Example Script**:
```bash
# scripts/admin-delete-user.js
node scripts/admin-delete-user.js --user-id=UUID --reason="GDPR request"
```

---

## Legal Basis

### GDPR Compliance

**Article 5(1)(e) - Storage Limitation**:
> Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed.

**Compliance**: 24-hour retention for prompt text and IP addresses

**Article 6(1)(f) - Legitimate Interest**:
> Processing is necessary for the purposes of the legitimate interests pursued by the controller.

**Application**: Permanent storage of anonymized attack patterns for network security

**Article 17 - Right to Erasure**:
> The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay.

**Compliance**: `/api/v1/privacy/delete` endpoint provides immediate deletion

**Recital 26 - Anonymous Information**:
> The principles of data protection should therefore not apply to anonymous information, namely information which does not relate to an identified or identifiable natural person or to personal data rendered anonymous in such a manner that the data subject is not or no longer identifiable.

**Application**: Cryptographic hashes are considered anonymous information

### CCPA Compliance

**Section 1798.105 - Right to Delete**:
> A consumer shall have the right to request that a business delete any personal information about the consumer which the business has collected from the consumer.

**Compliance**: User-initiated deletion via API endpoint

**Section 1798.110 - Right to Know**:
> A consumer shall have the right to request that a business that collects a consumer's personal information disclose to that consumer... what personal information has been collected.

**Compliance**: `/api/v1/privacy/export` endpoint provides full data export

---

## User Rights

### Right to Access (GDPR Art. 15, CCPA 1798.110)

**Endpoint**: `GET /api/v1/privacy/export`

**Includes**:
- All identifiable data (<24h old)
- Session history
- User preferences
- Account metadata
- Usage statistics

**Timeline**: Provided immediately (real-time API call)

### Right to Deletion (GDPR Art. 17, CCPA 1798.105)

**Endpoint**: `DELETE /api/v1/privacy/delete`

**Deletes**:
- All identifiable personal data
- Active sessions
- Usage logs

**Timeline**: Completed within 1 hour

### Right to Rectification (GDPR Art. 16)

**Endpoint**: `PATCH /api/v1/account/profile`

**Allows Update of**:
- Email address
- Password
- Preferences

### Right to Data Portability (GDPR Art. 20)

**Endpoint**: `GET /api/v1/privacy/export`

**Format**: JSON (machine-readable)

**Includes**: All personal data in structured format

### Right to Object (GDPR Art. 21)

**For Pro Tier**: Disable intelligence sharing via preferences

**Endpoint**: `PATCH /api/v1/account/preferences`
```json
{
  "enable_intelligence_sharing": false
}
```

**For Free Tier**: Not available (legitimate interest + service requirement)

---

## Implementation

### Database Schema

**Anonymization Timestamp**:
```sql
ALTER TABLE threat_intelligence_samples
ADD COLUMN anonymized_at TIMESTAMPTZ;
```

**Index for Performance**:
```sql
CREATE INDEX idx_samples_anonymization
ON threat_intelligence_samples(created_at, anonymized_at)
WHERE anonymized_at IS NULL;
```

### Background Job (Vercel Cron)

**Configuration**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/anonymize-samples",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Implementation**: `/api/cron/anonymize-samples.js`
```javascript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Anonymize samples older than 24 hours
  const { data, error } = await supabase
    .from('threat_intelligence_samples')
    .update({
      prompt_text: null,
      client_ip: null,
      anonymized_at: new Date().toISOString()
    })
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .is('anonymized_at', null);

  if (error) {
    console.error('Anonymization failed:', error);
    // CRITICAL: Alert compliance team
    await alertComplianceTeam(error);
    return res.status(500).json({ error: 'Anonymization failed' });
  }

  return res.json({
    success: true,
    anonymized: data?.length || 0,
    timestamp: new Date().toISOString()
  });
}
```

### Monitoring Dashboard

**Metrics to Track**:
- Samples awaiting anonymization
- Anonymization job success rate
- Average time to anonymization
- Data deletion requests per day
- User opt-out rate (Pro tier)

**Alerts**:
- **CRITICAL**: Anonymization job failed
- **CRITICAL**: Samples >26 hours old with PII
- **WARNING**: Anonymization job delayed >2 hours
- **WARNING**: Data deletion request failed

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-06 | Initial policy with Phase 1A retention schedules |

---

## Contact

**Data Protection Officer**: [Contact SafePrompt](https://safeprompt.dev/contact)

**Data Deletion Requests**: `DELETE /api/v1/privacy/delete` (automated) or contact support for manual processing

**Policy Questions**: Email privacy@safeprompt.dev

---

## References

**Related Documentation**:
- `/home/projects/safeprompt/docs/PRIVACY_COMPLIANCE.md` - GDPR/CCPA compliance guide
- `/home/projects/safeprompt/docs/THREAT_INTELLIGENCE.md` - Intelligence system details
- `/home/projects/safeprompt/docs/ARCHITECTURE.md` - System architecture

---

**Document Version**: 1.0 (Phase 1A complete)
**Next Review**: 2026-01-06 (Quarterly)
