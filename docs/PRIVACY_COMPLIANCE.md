# SafePrompt Privacy Compliance Guide

**Version**: 1.0 (Phase 1A)
**Effective Date**: 2025-10-06
**Last Updated**: 2025-10-06
**Compliance**: GDPR, CCPA, Privacy Shield

## Table of Contents
1. [Overview](#overview)
2. [GDPR Compliance](#gdpr-compliance)
3. [CCPA Compliance](#ccpa-compliance)
4. [Data Processing Activities](#data-processing-activities)
5. [User Rights Implementation](#user-rights-implementation)
6. [Consent Management](#consent-management)
7. [Data Breach Response](#data-breach-response)
8. [Audit & Compliance Verification](#audit--compliance-verification)

---

## Overview

SafePrompt is designed for **privacy-first** threat intelligence, balancing network security with user privacy through aggressive anonymization and transparent data practices.

### Compliance Status

| Regulation | Status | Certification | Last Audit |
|-----------|--------|---------------|------------|
| **GDPR** (EU) | ✅ Compliant | Self-certified | 2025-10-06 |
| **CCPA** (California) | ✅ Compliant | Self-certified | 2025-10-06 |
| **Privacy Shield** | ⚠️ N/A (Invalidated 2020) | - | - |
| **SOC 2 Type II** | 🔄 In Progress | Target Q1 2026 | - |

### Core Privacy Principles

1. **Data Minimization**: Collect only what's necessary
2. **Purpose Limitation**: Use data only for stated purposes
3. **Storage Limitation**: 24-hour retention for identifiable data
4. **Transparency**: Clear disclosure of all data practices
5. **User Control**: Pro tier can opt-out of intelligence sharing

---

## GDPR Compliance

### Legal Basis Summary

| Processing Activity | Legal Basis | GDPR Article |
|-------------------|-------------|--------------|
| API validation | Contractual necessity | Art. 6(1)(b) |
| Threat intelligence (Free tier) | Legitimate interest | Art. 6(1)(f) |
| Threat intelligence (Pro tier) | Consent | Art. 6(1)(a) |
| IP reputation tracking | Legitimate interest | Art. 6(1)(f) |
| User account management | Contractual necessity | Art. 6(1)(b) |
| Security logs | Legitimate interest | Art. 6(1)(f) |

### Article-by-Article Compliance

#### Article 5 - Principles

**5(1)(a) - Lawfulness, Fairness, Transparency**:
- ✅ Legal basis documented for all processing
- ✅ Privacy policy published at https://safeprompt.dev/privacy
- ✅ Clear disclosure of data collection practices
- ✅ API documentation explains data usage

**5(1)(b) - Purpose Limitation**:
- ✅ Data collected only for threat detection
- ✅ No secondary uses without additional consent
- ✅ Clear purpose stated in privacy policy

**5(1)(c) - Data Minimization**:
- ✅ Only collect IP address + prompt text
- ✅ No email/name collection from end-users
- ✅ Session data limited to validation history only

**5(1)(d) - Accuracy**:
- ✅ Users can update account information
- ✅ Endpoint: `PATCH /api/v1/account/profile`

**5(1)(e) - Storage Limitation**:
- ✅ **24-hour retention** for identifiable data
- ✅ Automated anonymization after 24 hours
- ✅ Permanent storage only for anonymized hashes

**5(1)(f) - Integrity and Confidentiality**:
- ✅ TLS 1.3 encryption in transit
- ✅ Supabase encryption at rest
- ✅ API key-based authentication
- ✅ RLS policies on all database tables

#### Article 6 - Lawfulness of Processing

**6(1)(a) - Consent**:
- Applicable to Pro tier intelligence sharing (opt-in)
- User can withdraw consent via preferences endpoint
- Consent freely given (can disable without service degradation)

**Implementation**:
```javascript
// Check consent for Pro tier users
if (userTier === 'pro') {
  const preferences = await getPreferences(userId);
  if (!preferences.enable_intelligence_sharing) {
    // Skip intelligence collection
    return;
  }
}
```

**6(1)(b) - Contractual Necessity**:
- Applicable to API validation service
- Cannot provide security service without processing prompts
- User enters contract by using API

**6(1)(f) - Legitimate Interest**:
- Applicable to Free tier intelligence collection
- Legitimate interest: Network security for all customers
- Balancing test: User privacy vs. collective security
- Minimization: 24-hour anonymization limits impact

**Legitimate Interest Assessment (LIA)**:
```
Purpose: Threat intelligence for network security
Necessity: Essential for detecting novel attacks
Balancing: 24-hour anonymization + hash-based storage minimizes privacy impact
Less intrusive means: Not available (need real attack data)
Conclusion: Legitimate interest justified
```

#### Article 7 - Conditions for Consent (Pro Tier)

**7(2) - Demonstrable Consent**:
- ✅ Audit log of preference changes
- ✅ Timestamp of opt-in recorded
- ✅ Can prove consent was given

**7(3) - Right to Withdraw Consent**:
- ✅ Endpoint: `PATCH /api/v1/account/preferences`
- ✅ Same ease as giving consent
- ✅ No service degradation on withdrawal

**7(4) - Consent vs. Performance of Contract**:
- ✅ Pro tier validation works regardless of intelligence sharing preference
- ✅ No service features contingent on consent

#### Article 13 - Information to be Provided

**13(1) - Identity and Contact**:
- ✅ Published: SafePrompt, privacy@safeprompt.dev

**13(1)(c) - Purposes and Legal Basis**:
- ✅ Privacy policy: https://safeprompt.dev/privacy
- ✅ API docs: https://safeprompt.dev/docs

**13(2)(a) - Storage Period**:
- ✅ 24 hours for identifiable data
- ✅ Permanent for anonymized hashes

#### Article 15 - Right of Access

**Implementation**: `GET /api/v1/privacy/export`

**Response**:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "tier": "pro",
  "threat_intelligence_samples": [...],  // <24h old only
  "validation_sessions": [...],
  "preferences": {...}
}
```

**Timeline**: Immediate (real-time API call)

#### Article 17 - Right to Erasure

**Implementation**: `DELETE /api/v1/privacy/delete`

**What Gets Deleted**:
- All prompt text and IP addresses (<24h old)
- All active validation sessions
- All usage logs

**What Gets Retained** (Justification: Legitimate Interest + Anonymized):
- Cryptographic hashes (no PII)
- Attack vectors (anonymized)
- Aggregate statistics

**Timeline**: Within 1 hour

#### Article 25 - Data Protection by Design and by Default

**By Design**:
- ✅ 24-hour anonymization built into schema
- ✅ Automated background job (cannot be disabled)
- ✅ Hash-based IP reputation (no raw IPs stored permanently)
- ✅ RLS policies enforce data access controls

**By Default**:
- ✅ Free tier: Intelligence sharing enabled (necessary for service)
- ✅ Pro tier: User explicitly opts in for IP blocking
- ✅ Minimal data collection (only IP + prompt)

#### Article 30 - Records of Processing Activities

**Record**: Maintained in `/home/projects/safeprompt/docs/DATA_PROCESSING_RECORD.md`

**Contents**:
- Name and contact details of controller
- Purposes of processing
- Categories of data subjects
- Categories of personal data
- Recipients of personal data
- Retention periods
- Security measures

#### Article 32 - Security of Processing

**Technical Measures**:
- ✅ TLS 1.3 encryption in transit
- ✅ Database encryption at rest (Supabase)
- ✅ API key hashing (SHA-256)
- ✅ IP address hashing (SHA-256 + salt)

**Organizational Measures**:
- ✅ Access controls (RLS policies)
- ✅ Automated anonymization (cannot be manually disabled)
- ✅ Audit logging of all data access
- ✅ Incident response plan

#### Article 33 & 34 - Data Breach Notification

**Timeline**:
- Within 72 hours to supervisory authority (if risk to user rights)
- Without undue delay to affected users (if high risk)

**Process**: See [Data Breach Response](#data-breach-response)

---

## CCPA Compliance

### Applicability

SafePrompt processes California residents' data and is subject to CCPA.

### Consumer Rights Implementation

#### 1798.100 - Right to Know

**What Data is Collected**:
- Prompt text (24h retention)
- Client IP addresses (24h retention)
- Attack vectors (anonymized, permanent)
- Session data (2h retention)

**How Data is Used**:
- Threat detection (primary purpose)
- Network security intelligence (secondary purpose)

**Disclosure**: Privacy policy at https://safeprompt.dev/privacy

#### 1798.105 - Right to Delete

**Implementation**: `DELETE /api/v1/privacy/delete`

**Exceptions** (CCPA 1798.105(d)):
- (2) Detecting security incidents: Anonymized patterns retained
- (8) Internal lawful uses: Aggregate statistics retained

**Timeline**: Within 45 days (we provide within 1 hour)

#### 1798.110 - Right to Know What Data is Collected

**Implementation**: `GET /api/v1/privacy/export`

**Includes**:
- All identifiable data (<24h old)
- Session history
- Account information
- Usage statistics

**Timeline**: Within 45 days (we provide immediately)

#### 1798.115 - Right to Know What Data is Sold or Disclosed

**Disclosure**: SafePrompt does NOT sell personal information.

**Data Shared**:
- None (all processing is internal)
- No third-party data sharing
- No data brokers

#### 1798.120 - Right to Opt-Out of Sale

**Status**: Not applicable (no data sales)

#### 1798.125 - Non-Discrimination

**Pro Tier Opt-Out**:
- ✅ Same validation accuracy regardless of intelligence sharing preference
- ✅ No price increase for opting out
- ✅ No service degradation

**Free Tier Requirement**:
- Intelligence sharing required for Free tier (legitimate interest)
- User can upgrade to Pro tier for opt-out option

---

## Data Processing Activities

### Data Processing Record (GDPR Art. 30)

#### Activity 1: API Validation

**Purpose**: Detect prompt injection attacks

**Legal Basis**: Contractual necessity (GDPR 6(1)(b))

**Data Subjects**: End-users of customers' applications

**Personal Data**:
- Prompt text (processed in memory, not stored)
- IP address (for rate limiting only)

**Recipients**: None (internal processing only)

**Retention**: Not stored (unless blocked - see Activity 2)

**Security**: TLS 1.3, temporary processing only

#### Activity 2: Threat Intelligence Collection

**Purpose**: Learn from attacks across network

**Legal Basis**:
- Free tier: Legitimate interest (GDPR 6(1)(f))
- Pro tier: Consent (GDPR 6(1)(a))

**Data Subjects**: End-users whose prompts were blocked

**Personal Data**:
- Prompt text (24h retention)
- IP address (24h retention)
- Attack vectors (anonymized, permanent)

**Recipients**: None (internal use only)

**Retention**: 24h for identifiable data, permanent for hashes

**Security**: Database encryption, automated anonymization

#### Activity 3: IP Reputation Tracking

**Purpose**: Block repeat attackers (Pro tier opt-in)

**Legal Basis**: Legitimate interest (GDPR 6(1)(f))

**Data Subjects**: End-users from all customers

**Personal Data**:
- IP address hash (one-way, cannot reverse)
- Attack statistics (counts, block rate)

**Recipients**: None (internal use only)

**Retention**: Permanent (hash-based, no raw IPs)

**Security**: Salted hashing, no raw IP storage

#### Activity 4: Session Tracking

**Purpose**: Multi-turn attack detection

**Legal Basis**: Contractual necessity (GDPR 6(1)(b))

**Data Subjects**: End-users using session tokens

**Personal Data**:
- Session token (random, non-identifiable)
- Validation history (prompt text + results)
- IP fingerprint (hashed)

**Recipients**: None (internal use only)

**Retention**: 2 hours (automatic cleanup)

**Security**: Server-side storage, automatic expiration

#### Activity 5: User Account Management

**Purpose**: Provide API service

**Legal Basis**: Contractual necessity (GDPR 6(1)(b))

**Data Subjects**: API customers (not end-users)

**Personal Data**:
- Email address
- API keys (hashed)
- Subscription information
- Usage statistics

**Recipients**: Stripe (payment processing)

**Retention**: Until account deletion

**Security**: Database encryption, API key hashing

---

## User Rights Implementation

### Technical Implementation

#### Right of Access (GDPR Art. 15, CCPA 1798.110)

**Endpoint**: `GET /api/v1/privacy/export`

**Authentication**: API key required

**Implementation**:
```javascript
export default async function handler(req, res) {
  const userId = await authenticateUser(req);

  const [profile, samples, sessions] = await Promise.all([
    getProfile(userId),
    getThreatSamples(userId),
    getSessions(userId)
  ]);

  return res.json({
    user_id: userId,
    email: profile.email,
    tier: profile.tier,
    threat_intelligence_samples: samples.filter(s =>
      !s.anonymized_at  // Only include <24h data
    ),
    validation_sessions: sessions,
    preferences: profile.preferences
  });
}
```

**Response Time**: <1 second (real-time)

#### Right to Erasure (GDPR Art. 17, CCPA 1798.105)

**Endpoint**: `DELETE /api/v1/privacy/delete`

**Implementation**:
```javascript
export default async function handler(req, res) {
  const userId = await authenticateUser(req);

  // Delete identifiable data
  const result = await Promise.all([
    // Anonymize samples (DELETE prompt_text, client_ip)
    supabase.from('threat_intelligence_samples')
      .update({ prompt_text: null, client_ip: null, anonymized_at: new Date() })
      .match({ user_id: userId, anonymized_at: null }),

    // Delete sessions
    supabase.from('validation_sessions')
      .delete()
      .match({ user_id: userId }),

    // Delete usage logs
    deleteUsageLogs(userId)
  ]);

  return res.json({
    success: true,
    deleted: {
      prompt_samples: result[0].count,
      sessions: result[1].count,
      logs: result[2].count
    },
    retained: {
      hashed_patterns: result[0].count,
      reason: "No personally identifiable information"
    }
  });
}
```

**Response Time**: <5 seconds

#### Right to Rectification (GDPR Art. 16)

**Endpoint**: `PATCH /api/v1/account/profile`

**Allowed Updates**:
- Email address
- Password
- Preferences

**Implementation**:
```javascript
export default async function handler(req, res) {
  const userId = await authenticateUser(req);
  const { email, password, preferences } = req.body;

  const updates = {};
  if (email) updates.email = email;
  if (password) updates.password_hash = hashPassword(password);
  if (preferences) updates.preferences = preferences;

  await supabase.from('profiles')
    .update(updates)
    .match({ id: userId });

  return res.json({ success: true });
}
```

#### Right to Object (GDPR Art. 21)

**Endpoint**: `PATCH /api/v1/account/preferences`

**Pro Tier Only**:
```javascript
{
  "enable_intelligence_sharing": false  // Opt-out
}
```

**Effect**: Intelligence collection skipped for this user

**Free Tier**: Not available (legitimate interest + service requirement)

---

## Consent Management

### Consent for Pro Tier Intelligence Sharing

**Opt-In Required**: Pro tier must explicitly enable intelligence sharing

**Default**: Intelligence sharing DISABLED for new Pro accounts

**Implementation**:
```javascript
// New Pro account creation
await supabase.from('profiles').insert({
  email: userEmail,
  tier: 'pro',
  preferences: {
    enable_intelligence_sharing: false,  // Default: disabled
    enable_ip_blocking: false            // Default: disabled (requires separate opt-in)
  }
});
```

**Consent Requirements (GDPR Art. 7)**:
- ✅ Freely given (no service degradation if disabled)
- ✅ Specific (separate toggle for intelligence vs. IP blocking)
- ✅ Informed (clear explanation in dashboard)
- ✅ Unambiguous (checkbox, not pre-checked)

### Consent Withdrawal

**Process**:
1. User navigates to dashboard → Settings → Privacy
2. Toggles "Enable intelligence sharing" to OFF
3. Confirmation dialog: "This will disable intelligence collection but won't affect validation accuracy"
4. Preference saved immediately
5. Next validation: Intelligence collection skipped

**Audit Trail**:
```sql
CREATE TABLE preference_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  preference_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB
);
```

---

## Data Breach Response

### Incident Response Plan

#### Phase 1: Detection (T+0)

**Triggers**:
- Automated alert: Unauthorized database access
- Security scan: Vulnerability detected
- User report: Suspicious activity

**Actions**:
1. Alert security team (Slack + PagerDuty)
2. Isolate affected systems
3. Preserve evidence (logs, database snapshots)

#### Phase 2: Assessment (T+0 to T+4 hours)

**Questions to Answer**:
- What data was accessed?
- How many users affected?
- What is the risk to user rights?
- Is notification required?

**Criteria for GDPR Notification (Art. 33)**:
- Risk to rights and freedoms of data subjects
- If yes → Notify supervisory authority within 72 hours

**Criteria for User Notification (Art. 34)**:
- High risk to rights and freedoms
- Cannot be mitigated by technical measures (e.g., encryption)
- If yes → Notify users without undue delay

#### Phase 3: Containment (T+4 to T+24 hours)

**Actions**:
1. Patch vulnerability
2. Reset API keys (if compromised)
3. Force password reset (if applicable)
4. Block malicious IPs

#### Phase 4: Notification (T+24 to T+72 hours)

**To Supervisory Authority** (if required):
- Nature of breach
- Categories and number of data subjects affected
- Likely consequences
- Measures taken or proposed

**To Affected Users** (if required):
- Email notification
- Dashboard alert
- Describe breach in clear language
- Provide guidance on protective measures

#### Phase 5: Post-Incident (T+72 hours+)

**Actions**:
1. Root cause analysis (RCA)
2. Update security measures
3. Document incident
4. Update incident response plan

### Example Breach Scenarios

#### Scenario 1: Database Credentials Leaked

**Severity**: CRITICAL

**Data at Risk**:
- All user accounts
- All validation history (<24h old)
- All session data

**Notification Required**: YES (high risk to user rights)

**Response**:
1. Immediately rotate database credentials
2. Force password reset for all users
3. Notify supervisory authority within 72h
4. Notify all users immediately
5. Offer 1 year of identity monitoring (if required)

#### Scenario 2: Anonymization Job Failed

**Severity**: HIGH

**Data at Risk**:
- Prompt text and IP addresses >24h old

**Notification Required**: DEPENDS (GDPR Art. 33 assessment)

**Response**:
1. Immediately run manual anonymization
2. Verify completion
3. If >72 hours delayed → Notify supervisory authority
4. Implement additional monitoring

#### Scenario 3: Unauthorized API Access

**Severity**: MEDIUM

**Data at Risk**:
- Validation results from compromised API key

**Notification Required**: LIKELY NO (limited scope, single user)

**Response**:
1. Revoke compromised API key
2. Notify affected user
3. Investigate root cause (phishing? weak password?)
4. Recommend 2FA (future feature)

---

## Audit & Compliance Verification

### Internal Audits

**Frequency**: Quarterly

**Checklist**:
- [ ] Anonymization job success rate = 100% (last 90 days)
- [ ] No PII older than 24 hours in database
- [ ] User rights requests completed within SLA
- [ ] Security logs reviewed for unauthorized access
- [ ] Data processing record up to date
- [ ] Privacy policy published and accurate
- [ ] Consent records complete (Pro tier)

### External Audits

**Target**: SOC 2 Type II certification by Q1 2026

**Scope**:
- Security controls (access, encryption, monitoring)
- Availability (uptime, incident response)
- Confidentiality (data access controls)
- Processing integrity (validation accuracy)
- Privacy (GDPR/CCPA compliance)

### Automated Compliance Checks

**Daily**:
```sql
-- Check for PII older than 24 hours
SELECT COUNT(*) as violations
FROM threat_intelligence_samples
WHERE created_at < NOW() - INTERVAL '24 hours'
  AND (prompt_text IS NOT NULL OR client_ip IS NOT NULL);
-- Expected: 0

-- Check anonymization job health
SELECT MAX(anonymized_at) as last_run
FROM threat_intelligence_samples
WHERE anonymized_at IS NOT NULL;
-- Expected: Within last 2 hours
```

**Weekly**:
- Review data deletion requests (response time <1 hour?)
- Review data export requests (successful delivery?)
- Check consent withdrawal requests (processed correctly?)

---

## Regulatory Change Monitoring

### Process

**Quarterly Review**:
1. Check for new GDPR guidance (EDPB, national DPAs)
2. Check for CCPA amendments (California legislature)
3. Review court cases (CJEU, California courts)
4. Update policies if needed

**Stakeholders**:
- Legal counsel (external)
- Compliance officer (internal)
- Engineering team (implementation)

**Recent Changes to Monitor**:
- GDPR enforcement trends (increasing fines)
- CCPA regulations (CPRA amendments)
- EU-US Data Privacy Framework (Schrems III risk)

---

## Contact & Resources

**Data Protection Officer**: privacy@safeprompt.dev

**Supervisory Authority** (EU): Depends on user location
- Ireland: Data Protection Commission (DPC)
- Germany: Bundesbeauftragter für den Datenschutz und die Informationsfreiheit (BfDI)
- France: Commission Nationale de l'Informatique et des Libertés (CNIL)

**Supervisory Authority** (California): California Attorney General

**Internal Resources**:
- Privacy policy: https://safeprompt.dev/privacy
- API documentation: `/home/projects/safeprompt/docs/API.md`
- Data retention policy: `/home/projects/safeprompt/docs/DATA_RETENTION_POLICY.md`
- Threat intelligence details: `/home/projects/safeprompt/docs/THREAT_INTELLIGENCE.md`

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-06 | Initial compliance guide for Phase 1A |

---

**Document Version**: 1.0 (Phase 1A complete)
**Next Review**: 2026-01-06 (Quarterly)
