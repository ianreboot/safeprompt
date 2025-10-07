# SafePrompt Admin Operations Guide

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Audience**: SafePrompt administrators and security operators

## Overview

This guide provides operational procedures for SafePrompt administrators to manage the intelligence-driven pattern improvement system (Phase 6). All operations follow a **human-in-the-loop** safety model where automated systems propose improvements, but human review is required before deployment.

## Table of Contents

1. [Pattern Proposal Review Workflow](#1-pattern-proposal-review-workflow)
2. [Campaign Response Procedures](#2-campaign-response-procedures)
3. [Honeypot Monitoring Best Practices](#3-honeypot-monitoring-best-practices)
4. [Daily Operations Checklist](#4-daily-operations-checklist)
5. [Emergency Procedures](#5-emergency-procedures)
6. [Metrics & Reporting](#6-metrics--reporting)

---

## 1. Pattern Proposal Review Workflow

### 1.1 Overview

The Pattern Discovery Pipeline runs daily at 3 AM UTC, analyzing anonymized attack samples to propose new detection patterns. **All proposals require human review before deployment.**

### 1.2 Access Pattern Proposals Dashboard

1. Navigate to `/admin/pattern-proposals`
2. Verify admin access (email must be on whitelist)
3. Review dashboard showing:
   - Pending proposals
   - AI-generated vs rule-based proposals
   - Confidence scores
   - Historical testing results

### 1.3 Review Process

For each pending proposal:

#### Step 1: Evaluate Pattern Quality

**Questions to Ask:**
- Is the pattern specific enough to catch attacks?
- Is it too broad (risk of false positives)?
- Does it make semantic sense?
- Is there evidence of recurring attacks?

**Red Flags:**
- ❌ Patterns matching common legitimate phrases
- ❌ Patterns with <3 occurrences
- ❌ Patterns from single IP address
- ❌ Patterns containing only common words

**Green Flags:**
- ✅ Multiple unique IPs using same technique
- ✅ Clear attack intent (SQL keywords, XSS patterns)
- ✅ High frequency (10+ occurrences)
- ✅ AI confidence score ≥0.7

#### Step 2: Historical Validation

Click "Test Against Historical Data" to run validation:

```
Testing pattern: "SELECT * FROM"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Attack samples tested: 1000
✓ Legitimate samples tested: 1000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Results:
  True Positives:  87 (8.7% catch rate)
  False Positives: 2  (0.2% FP rate)

Recommendation: ✅ APPROVE
```

**Decision Matrix:**

| Catch Rate | False Positive Rate | Action |
|-----------|---------------------|--------|
| >50% | <5% | ✅ Auto-approve |
| >20% | <10% | ⚠️ Manual review (usually approve) |
| >10% | >10% | ❌ Reject (too risky) |
| <10% | Any | ❌ Reject (not effective) |

#### Step 3: Approve or Reject

**To Approve:**
1. Click "Approve" button
2. Pattern is added to `prompt-validator.js`
3. Takes effect immediately for new validation requests
4. Marked as `deployed_to_production: true`

**To Reject:**
1. Click "Reject" button
2. Add rejection reason (stored for analysis)
3. Pattern marked as `status: rejected`

**To Defer:**
1. Click "Defer" button
2. Keeps status as `pending` for later review

### 1.4 Pattern Proposal Types

**Type 1: Substring Patterns**
- Most common type
- Exact text matching
- Example: `"eval("`, `"<script>"`

**Type 2: Regex Patterns**
- AI-generated regular expressions
- More flexible but higher false positive risk
- Example: `/SELECT.*FROM.*WHERE/i`

**Type 3: Encoding Detection**
- Base64, URL encoding, hex, Unicode escapes
- Example: Detect `%3Cscript%3E`

### 1.5 Deployment Verification

After approving patterns:

1. Check deployment status: Pattern should show `deployed_to_production: true`
2. Monitor logs for 24 hours: Watch for unexpected blocks
3. Review false positive reports: Users may report legitimate prompts blocked
4. Roll back if needed: Mark pattern as `rejected` to disable

### 1.6 Best Practices

✅ **Do:**
- Review proposals within 24 hours of generation
- Test against historical data before approving
- Start conservative (approve only high-confidence patterns)
- Monitor for 48 hours after deployment
- Document rejection reasons

❌ **Don't:**
- Approve patterns without historical testing
- Deploy multiple patterns simultaneously (staged rollout)
- Ignore false positive reports
- Approve patterns with <3 unique IPs
- Rush approvals

---

## 2. Campaign Response Procedures

### 2.1 Overview

The Campaign Detection System runs hourly, identifying coordinated attacks across multiple IPs. Campaigns are detected through:
- **Temporal clustering**: >20 blocks in 10-minute window
- **Technique similarity**: >10 requests with >80% similar prompts

### 2.2 Access Campaigns Dashboard

1. Navigate to `/admin/campaigns`
2. Review active campaigns sorted by severity
3. Check for:
   - High attack volume
   - Multiple unique IPs
   - Novel techniques (not caught by patterns)

### 2.3 Campaign Analysis

For each active campaign:

#### Step 1: Assess Severity

**High Severity Indicators:**
- ✋ >100 requests in 10 minutes
- ✋ >20 unique IP addresses
- ✋ Novel attack technique (no pattern match)
- ✋ Targeting specific vulnerability

**Medium Severity:**
- ⚠️ 50-100 requests
- ⚠️ 10-20 unique IPs
- ⚠️ Known attack pattern but high volume

**Low Severity:**
- ℹ️ 20-50 requests
- ℹ️ 5-10 unique IPs
- ℹ️ Script kiddie / automated scanner

#### Step 2: Investigate Campaign

Click "Investigate" to view:
- Timeline of attacks
- IP address list with geolocation
- Sample attack prompts
- Pattern detection breakdown

**Questions to Answer:**
- Is this a coordinated attack or coincidence?
- Are attackers testing multiple techniques?
- Is there a vulnerability they're targeting?
- Are any requests getting through?

#### Step 3: Response Actions

**Action 1: Block IPs (Use with Caution)**
```
⚠️ WARNING: IP blocking affects all users from those IPs
```

**When to block IPs:**
- ✅ Sustained attack over 24+ hours
- ✅ No legitimate traffic from those IPs historically
- ✅ Pro tier customers (who opted into IP blocking)

**When NOT to block IPs:**
- ❌ Attack lasted <1 hour (may be transient)
- ❌ IPs from cloud providers (AWS, GCP, Azure) - legitimate users also use these
- ❌ Free tier (they didn't opt into IP blocking)

**Action 2: Create Pattern**

If campaign uses consistent technique:
1. Click "Create Pattern from Campaign"
2. System extracts common substring
3. Review and approve as new pattern (see Section 1)
4. Pattern immediately blocks future similar attacks

**Action 3: Mark False Positive**

If campaign is legitimate traffic:
1. Click "Mark False Positive"
2. Add notes explaining why
3. System learns from this feedback
4. Consider adjusting existing patterns

**Action 4: Resolve Campaign**

Once addressed:
1. Click "Resolve"
2. Campaign marked as `status: resolved`
3. Remains in logs for analysis

### 2.4 Campaign Response Time Targets

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| High | <1 hour | Security lead notification |
| Medium | <4 hours | Review during business hours |
| Low | <24 hours | Daily review queue |

### 2.5 Best Practices

✅ **Do:**
- Investigate all high-severity campaigns immediately
- Document response actions in campaign notes
- Look for patterns across multiple campaigns
- Communicate with customers if legitimate traffic blocked

❌ **Don't:**
- Block IPs without investigation
- Ignore low-severity campaigns indefinitely
- Create overly broad patterns from campaigns
- Resolve campaigns without taking action

---

## 3. Honeypot Monitoring Best Practices

### 3.1 Overview

Honeypot endpoints are fake API routes that **only attackers should find**. Any traffic to honeypots is automatically suspicious. The Honeypot Learning system auto-deploys patterns from honeypot data (safe because no legitimate users access these endpoints).

**Honeypot Endpoints:**
- `/api/v1/validate-debug` - Fake debug endpoint
- `/api/v1/admin-test` - Fake admin endpoint
- `/api/internal/check` - Fake internal endpoint

### 3.2 Access Honeypot Dashboard

1. Navigate to `/admin/honeypots`
2. Review honeypot analytics:
   - Requests per day
   - Unique IPs attempting access
   - Auto-deployed patterns count
   - Reconnaissance pattern breakdown

### 3.3 Monitoring Metrics

#### Key Performance Indicators

**Normal Baseline:**
- 10-100 honeypot requests/day
- 5-20 unique IPs/day
- 1-3 auto-deployed patterns/week

**Alert Conditions:**

🚨 **Immediate Investigation Required:**
- >1000 requests/day (possible targeted attack)
- Spike in unique IPs (>100/day)
- Same IP making >50 requests

⚠️ **Monitor Closely:**
- Sustained increase over 7 days
- New reconnaissance patterns detected
- Geographic concentration (90% from one country)

#### Reconnaissance Pattern Breakdown

Monitor which patterns are most common:

1. **Directory Traversal** (`../`) - File system probing
2. **Debug Parameters** (`?debug=`, `?test=`) - Endpoint fuzzing
3. **SQL Injection** (`SELECT`, `UNION`) - Database attacks
4. **Command Injection** (`;`, `|`, `$()`) - OS command execution
5. **XSS Probes** (`<script>`, `onerror=`) - Cross-site scripting
6. **File Inclusion** (`/etc/passwd`, `.env`) - Credential harvesting

### 3.4 Auto-Deployment Safety

**Why Honeypot Auto-Deployment is Safe:**
- ✅ Zero legitimate traffic to honeypot endpoints
- ✅ 100% of honeypot traffic = reconnaissance or attacks
- ✅ No false positive risk (no real users affected)
- ✅ Full audit trail maintained
- ✅ Patterns can be reverted if needed

**Auto-Deployment Thresholds:**
- Minimum 3 occurrences
- Minimum 2 unique IPs
- Automatically marked as `deployed_to_production: true`

### 3.5 Weekly Review Process

**Every Monday:**

1. **Review Last Week's Stats**
   - Total honeypot requests
   - Unique IPs count
   - Auto-deployed pattern count
   - Compare to previous week baseline

2. **Analyze Trends**
   - Is reconnaissance increasing?
   - New attack techniques emerging?
   - Geographic shift in attacker origins?

3. **Validate Auto-Deployed Patterns**
   - Spot-check 3-5 auto-deployed patterns
   - Verify they make sense
   - Check for any anomalies

4. **Export Data for Analysis**
   - Click "Export CSV"
   - Share with security team
   - Track month-over-month trends

### 3.6 Honeypot Best Practices

✅ **Do:**
- Review honeypot dashboard weekly minimum
- Investigate unusual spikes immediately
- Track reconnaissance trends over time
- Use honeypot insights to improve main validation

❌ **Don't:**
- Advertise honeypot endpoints publicly
- Link to honeypots from documentation
- Disable auto-deployment without reason
- Ignore sustained reconnaissance activity

---

## 4. Daily Operations Checklist

### Morning Routine (9:00 AM)

```
□ Check Threat Intelligence Dashboard (/admin/intelligence)
  - Review blocked attacks from last 24h
  - Note any novel attack patterns
  - Check pattern frequency distribution

□ Review Pattern Proposals (/admin/pattern-proposals)
  - New proposals from 3 AM job
  - Approve/reject high-confidence patterns
  - Test medium-confidence patterns

□ Check Active Campaigns (/admin/campaigns)
  - Any high-severity campaigns?
  - Response actions taken?
  - Update campaign status

□ Monitor Honeypot Activity (/admin/honeypots)
  - Request volume normal?
  - Any unusual patterns?
  - Auto-deployment working?
```

### Afternoon Review (2:00 PM)

```
□ Verify Pattern Deployments
  - Check recently approved patterns
  - Monitor for false positive reports
  - Review user feedback

□ Campaign Status Update
  - Follow up on morning investigations
  - Document response actions
  - Resolve completed campaigns

□ System Health Check
  - Background jobs running?
  - Data pipeline healthy?
  - No errors in logs?
```

### Weekly Review (Friday)

```
□ Pattern Effectiveness Analysis
  - Which patterns caught most attacks?
  - Any patterns with zero hits?
  - False positive rate by pattern

□ Campaign Trends
  - Total campaigns this week
  - Most common attack techniques
  - IP reputation updates

□ Honeypot Summary
  - Weekly reconnaissance stats
  - Auto-deployed pattern count
  - Export data for security report

□ Documentation Update
  - Update response procedures
  - Document new attack techniques
  - Share insights with team
```

---

## 5. Emergency Procedures

### 5.1 High-Volume Attack (DDoS-style)

**Symptoms:**
- >500 blocked requests/minute
- Multiple IPs
- All using same pattern

**Response:**

1. **Immediate (0-5 minutes):**
   ```
   □ Identify attack pattern (check Threat Intelligence)
   □ Create emergency pattern if novel technique
   □ Deploy immediately (skip historical testing)
   □ Monitor block rate
   ```

2. **Short-term (5-30 minutes):**
   ```
   □ Gather attacking IPs from campaign
   □ Consider temporary IP blocking (Pro tier only)
   □ Alert security lead
   □ Check infrastructure capacity
   ```

3. **Long-term (30+ minutes):**
   ```
   □ Analyze attack technique
   □ Create permanent pattern
   □ Document incident
   □ Review and improve defenses
   ```

### 5.2 Novel Attack Bypassing All Defenses

**Symptoms:**
- Attacks marked as `blocked: false` but clearly malicious
- User reports successful prompt injection
- Pattern and AI both missed attack

**Response:**

1. **Immediate:**
   ```
   □ Collect attack sample
   □ Manually add pattern immediately
   □ Test pattern against sample
   □ Deploy to production
   ```

2. **Investigation:**
   ```
   □ Why did AI miss this?
   □ Why did patterns miss this?
   □ Is this a new technique?
   □ How many got through?
   ```

3. **Remediation:**
   ```
   □ Update AI prompts if needed
   □ Add to pattern library
   □ Review similar attacks
   □ Improve detection rules
   ```

### 5.3 False Positive Crisis

**Symptoms:**
- Multiple users reporting legitimate prompts blocked
- Sudden spike in support tickets
- Pattern deployed in last 24h

**Response:**

1. **Immediate:**
   ```
   □ Identify problematic pattern (check recent approvals)
   □ Mark pattern as rejected (disables immediately)
   □ Notify affected users
   □ Document in incident log
   ```

2. **Analysis:**
   ```
   □ Review approval decision
   □ What went wrong with testing?
   □ How many users affected?
   □ Improve approval process
   ```

### 5.4 Data Pipeline Failure

**Symptoms:**
- No new pattern proposals for 48+ hours
- Background jobs not running
- Dashboard data stale

**Response:**

1. **Check Background Jobs:**
   ```bash
   # Check pattern discovery job
   SELECT * FROM pattern_proposals
   WHERE created_at > NOW() - INTERVAL '48 hours';

   # Check campaign detection
   SELECT * FROM attack_campaigns
   WHERE detected_at > NOW() - INTERVAL '24 hours';

   # Check honeypot learning
   SELECT COUNT(*) FROM honeypot_requests
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Restart Pipeline:**
   ```bash
   # Manually trigger pattern discovery
   node /home/projects/safeprompt/api/lib/pattern-discovery.js

   # Manually trigger campaign detection
   node /home/projects/safeprompt/api/lib/campaign-detector.js
   ```

3. **Fix Root Cause:**
   - Check cron job configuration
   - Verify Supabase credentials
   - Check API rate limits
   - Review error logs

---

## 6. Metrics & Reporting

### 6.1 Key Metrics to Track

#### Security Metrics

**Attack Detection Rate:**
```
Total blocked attacks / Total requests
Target: Maintain current rate, detect increase
```

**Pattern Effectiveness:**
```
Attacks caught by patterns / Total blocked attacks
Target: >70% (remaining 30% caught by AI)
```

**False Positive Rate:**
```
False positives / Total blocked requests
Target: <10% (ideally <5%)
```

**Novel Attack Detection:**
```
AI blocks without pattern match / Total blocked
Track trends - should decrease as patterns improve
```

#### Operational Metrics

**Pattern Approval Rate:**
```
Approved proposals / Total proposals
Target: 60-80% (too low = pipeline ineffective, too high = approving low-quality)
```

**Campaign Response Time:**
```
Time from detection to resolution
Target: High severity <1h, Medium <4h, Low <24h
```

**Honeypot Auto-Deployment:**
```
Auto-deployed patterns per week
Target: 2-5 (steady stream indicates active reconnaissance)
```

### 6.2 Weekly Security Report Template

```markdown
# SafePrompt Security Report - Week of [DATE]

## Executive Summary
- Total requests validated: [X]
- Total attacks blocked: [X] ([X]%)
- New patterns deployed: [X]
- Active campaigns: [X]
- Incidents: [X]

## Pattern Discovery
- Proposals generated: [X]
- Proposals approved: [X] ([X]%)
- Proposals rejected: [X] ([X]%)
- Top pattern by effectiveness: [Pattern name] - [X] blocks

## Campaign Activity
- Total campaigns detected: [X]
- High severity: [X]
- Medium severity: [X]
- Low severity: [X]
- Response time average: [X] hours

## Honeypot Intelligence
- Total honeypot requests: [X]
- Unique reconnaissance IPs: [X]
- Auto-deployed patterns: [X]
- Top reconnaissance technique: [Technique]

## Trends & Insights
- [Key observation 1]
- [Key observation 2]
- [Emerging threat pattern]

## Action Items
- [ ] [Action item 1]
- [ ] [Action item 2]

## Recommendations
- [Recommendation for improving detection]
- [Recommendation for process improvement]
```

### 6.3 Monthly Review

**Every 1st of month:**

1. **Pattern Effectiveness Analysis**
   - Review all patterns deployed last month
   - Identify low-performing patterns (0 hits)
   - Consider deprecating ineffective patterns
   - Track pattern library growth

2. **Campaign Trends**
   - Month-over-month attack volume
   - Most common attack techniques
   - Geographic trends
   - Coordinated attack analysis

3. **False Positive Review**
   - Total false positives reported
   - Patterns causing most FPs
   - Process improvements needed

4. **System Performance**
   - Pattern discovery job success rate
   - Campaign detection accuracy
   - Honeypot coverage
   - Admin response times

---

## Appendix A: Admin Dashboard URLs

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Threat Intelligence | `/admin/intelligence` | Real-time attack visibility (24h window) |
| Pattern Proposals | `/admin/pattern-proposals` | Review and approve AI-discovered patterns |
| Attack Campaigns | `/admin/campaigns` | Coordinated attack detection and response |
| Honeypot Analytics | `/admin/honeypots` | Reconnaissance monitoring |

## Appendix B: Database Queries

### Check Pattern Effectiveness
```sql
SELECT
  pp.proposed_pattern,
  pp.deployed_at,
  COUNT(tis.id) as blocks_since_deployment
FROM pattern_proposals pp
LEFT JOIN threat_intelligence_samples tis
  ON tis.pattern_detected @> ARRAY[pp.proposed_pattern]
  AND tis.created_at > pp.deployed_at
WHERE pp.deployed_to_production = true
GROUP BY pp.id
ORDER BY blocks_since_deployment DESC;
```

### Find High-Risk IPs
```sql
SELECT
  ip_hash,
  COUNT(*) as attack_count,
  MAX(created_at) as last_attack,
  ARRAY_AGG(DISTINCT pattern_detected) as techniques
FROM threat_intelligence_samples
WHERE blocked = true
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY ip_hash
HAVING COUNT(*) > 10
ORDER BY attack_count DESC;
```

### Campaign Overlap Analysis
```sql
SELECT
  ac1.id as campaign1_id,
  ac2.id as campaign2_id,
  ac1.pattern_type,
  ac2.pattern_type
FROM attack_campaigns ac1
JOIN attack_campaigns ac2
  ON ac1.id < ac2.id
  AND ac1.window_start < ac2.window_end
  AND ac2.window_start < ac1.window_end
WHERE ac1.status = 'active'
  AND ac2.status = 'active';
```

## Appendix C: Support Contacts

| Issue Type | Contact | SLA |
|-----------|---------|-----|
| High-severity attack | Security Lead | <30 minutes |
| False positive crisis | Product Lead | <1 hour |
| Data pipeline failure | Engineering Lead | <4 hours |
| General questions | #safeprompt-security Slack | <24 hours |

---

**Document Maintenance:**
- Review quarterly
- Update after major incidents
- Incorporate lessons learned
- Keep procedures current with codebase

**Last Reviewed**: 2025-10-07
**Next Review**: 2026-01-07
