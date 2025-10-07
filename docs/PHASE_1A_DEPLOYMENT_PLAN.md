# Phase 1A Deployment & Migration Plan

**System:** SafePrompt Threat Intelligence & IP Reputation
**Phase:** 1A - Intelligence System
**Status:** Ready for Deployment
**Created:** 2025-10-07
**Owner:** Engineering Team

---

## 📋 Executive Summary

This document outlines the deployment strategy for Phase 1A Intelligence System, including:
- Database migration rollout (dev → prod)
- Feature flag implementation (gradual rollout 10% → 50% → 100%)
- Rollback procedures
- User communication plan
- Monitoring and success criteria

**Timeline:** 2-week rollout with 48-hour monitoring period

---

## 🎯 Deployment Objectives

1. **Zero Downtime**: No service interruption during migration
2. **Data Safety**: No data loss, all PII handled according to GDPR/CCPA
3. **Gradual Rollout**: Start with 10% of traffic, scale to 100%
4. **Rollback Ready**: Can revert within 5 minutes if critical issues detected
5. **User Communication**: All users notified of new features and privacy controls

---

## 📊 Current State

### Databases
- **DEV Database**: `vkyggknknyfallmnrmfu` (fully migrated, tested)
- **PROD Database**: `adyfhzbcsqzgqvyimycv` (migration ready)

### Code Status
- ✅ All Phase 1A code complete and tested
- ✅ 70/73 tasks complete (95.9%)
- ✅ Unit tests: 386 tests passing
- ✅ Integration tests: All passing
- ✅ Documentation complete (public and private)

### Environments
- **DEV**: api.safeprompt.dev, dashboard.safeprompt.dev (Phase 1A active)
- **PROD**: api.safeprompt.dev, dashboard.safeprompt.dev (awaiting deployment)

---

## 🗓️ Deployment Timeline

### Week 1: Database Migration & Infrastructure

#### Day 1 (Monday): DEV Validation
- **Morning (9 AM)**: Final validation of DEV environment
  - Run full test suite against DEV database
  - Verify all cron jobs running (session cleanup, anonymization, IP reputation)
  - Check job monitoring dashboard shows healthy status
  - Test API endpoints with X-User-IP header

- **Afternoon (2 PM)**: Load testing on DEV
  - Simulate 1000 requests with IP reputation checking
  - Measure latency impact (<10ms target)
  - Verify intelligence collection and anonymization
  - Monitor database performance

- **Evening (5 PM)**: DEV sign-off
  - Review test results
  - Document any issues found
  - Go/No-Go decision for PROD migration

#### Day 2 (Tuesday): PROD Database Migration (Off-Peak)
- **Time**: 2 AM PST (minimal traffic)
- **Duration**: Estimated 30 minutes
- **Team**: On-call engineer + backup

**Migration Steps:**
```bash
# 1. Backup PROD database
pg_dump -h db.xxx.supabase.co -U postgres safeprompt_prod > backup_pre_phase1a.sql

# 2. Apply migrations
cd /home/projects/safeprompt/supabase/migrations
supabase db push --project-ref adyfhzbcsqzgqvyimycv

# Migrations to apply:
# - 20251006_session_storage.sql (validation_sessions table)
# - 20251007_phase1a_intelligence.sql (threat_intelligence_samples, ip_reputation, ip_allowlist)
# - 20251007_intelligence_logs.sql (intelligence_logs, job_metrics tables)

# 3. Verify migration
supabase db diff --project-ref adyfhzbcsqzgqvyimycv

# 4. Seed allowlist data
# - Add CI/CD IPs (GitHub Actions, etc.)
# - Add internal IPs (office, VPN)
# - Add test suite marker

# 5. Set up cron jobs (Vercel)
# Verify vercel.json has hourly cron configured for /api/cron/intelligence-cleanup
```

**Rollback Plan (if migration fails):**
```bash
# Restore from backup
psql -h db.xxx.supabase.co -U postgres safeprompt_prod < backup_pre_phase1a.sql

# Revert code deployment (if needed)
git revert HEAD && git push && vercel --prod
```

**Success Criteria:**
- ✅ All tables created successfully
- ✅ RLS policies active
- ✅ Indexes created
- ✅ Sample query succeeds
- ✅ Zero errors in Supabase logs

#### Day 3 (Wednesday): Code Deployment with Feature Flags (OFF)
- **Morning (10 AM)**: Deploy code to PROD with features disabled
  ```javascript
  // Environment variables in Vercel
  PHASE_1A_ENABLED=false
  PHASE_1A_ROLLOUT_PERCENT=0
  IP_REPUTATION_ENABLED=false
  INTELLIGENCE_COLLECTION_ENABLED=false
  ```

- **Deployment steps:**
  ```bash
  # 1. Deploy API with features disabled
  cd /home/projects/safeprompt/api
  vercel --prod --token="$VERCEL_TOKEN"

  # 2. Verify API responds normally
  curl -X POST https://api.safeprompt.dev/api/v1/validate \
    -H "X-API-Key: $TEST_API_KEY" \
    -d '{"prompt": "test"}'

  # 3. Deploy dashboard
  cd /home/projects/safeprompt/dashboard
  npm run build
  wrangler pages deploy out --project-name safeprompt-dashboard --branch main

  # 4. Deploy website
  cd /home/projects/safeprompt/website
  npm run build
  wrangler pages deploy out --project-name safeprompt --branch main
  ```

- **Afternoon (2 PM)**: Monitor for 4 hours
  - Check error rates (should be unchanged)
  - Verify response times (should be unchanged)
  - Confirm no regressions

- **Evening (6 PM)**: Go/No-Go for Phase 1A activation

### Week 2: Gradual Feature Rollout

#### Day 4 (Thursday): 10% Rollout
- **Morning (9 AM)**: Enable for 10% of traffic
  ```javascript
  PHASE_1A_ENABLED=true
  PHASE_1A_ROLLOUT_PERCENT=10
  IP_REPUTATION_ENABLED=true
  INTELLIGENCE_COLLECTION_ENABLED=true
  ```

- **Monitoring (all day):**
  - Check job monitoring dashboard every hour
  - Verify anonymization job running successfully
  - Monitor intelligence sample collection rate
  - Watch for IP blocking false positives
  - Track API latency (<10ms added latency target)

- **Success Criteria (24 hours):**
  - Zero critical errors
  - <5% error rate increase
  - Intelligence samples being collected
  - Anonymization job 100% success rate
  - No user complaints

#### Day 5 (Friday): 50% Rollout (if Day 4 successful)
- **Morning (10 AM)**: Increase to 50%
  ```javascript
  PHASE_1A_ROLLOUT_PERCENT=50
  ```

- **Monitoring:**
  - Same as Day 4
  - Additional: Check database storage growth
  - Review intelligence metrics dashboard

- **Weekend**: Continue monitoring, on-call team ready

#### Day 8 (Monday): 100% Rollout (if Week 1 successful)
- **Morning (9 AM)**: Enable for all users
  ```javascript
  PHASE_1A_ROLLOUT_PERCENT=100
  ```

- **User Communication:**
  - Send email announcement to all users (see User Communication Plan below)
  - Post to status page and Twitter
  - Update documentation

#### Day 9-10 (Tuesday-Wednesday): 48-Hour Monitoring Period
- **Continuous monitoring:**
  - Job health dashboard
  - Error rates
  - User feedback
  - Performance metrics

- **Final Go/No-Go:** End of Day 10
  - If successful: Phase 1A deployment complete
  - If issues: Reduce rollout percentage or rollback

---

## 🚩 Feature Flag Implementation

### Environment Variables (Vercel)

```bash
# Feature flags
PHASE_1A_ENABLED=true              # Master switch
PHASE_1A_ROLLOUT_PERCENT=100       # 0-100 (percentage of traffic)

# Component flags
IP_REPUTATION_ENABLED=true         # IP reputation checking
INTELLIGENCE_COLLECTION_ENABLED=true  # Threat intelligence collection
SESSION_TRACKING_ENABLED=true      # Multi-turn attack detection

# Configuration
IP_BLOCK_THRESHOLD_DEFAULT=0.3     # Default threshold for new Pro users
ANONYMIZATION_WINDOW_HOURS=24      # PII deletion window
```

### Implementation Pattern

```javascript
// api/lib/feature-flags.js
export function isPhase1AEnabled(userId = null) {
  if (!process.env.PHASE_1A_ENABLED) return false;

  const rolloutPercent = parseInt(process.env.PHASE_1A_ROLLOUT_PERCENT || '0');
  if (rolloutPercent === 100) return true;
  if (rolloutPercent === 0) return false;

  // Deterministic rollout based on user ID
  if (userId) {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    return bucket < rolloutPercent;
  }

  // Random rollout for unauthenticated requests
  return Math.random() * 100 < rolloutPercent;
}

// Usage in validate.js
if (isPhase1AEnabled(userId)) {
  // Use Phase 1A features (IP reputation, intelligence collection)
  const ipReputationResult = await checkIPReputation(userIP, options);
  await collectIntelligence(prompt, threatData);
} else {
  // Skip Phase 1A features
  ipReputationResult = { checked: false };
}
```

---

## 🔄 Rollback Plan

### Trigger Conditions (Immediate Rollback)

1. **Critical Error Rate**: >5% error rate increase
2. **Anonymization Failure**: <95% success rate (legal compliance risk)
3. **Database Performance**: >2x latency increase
4. **User Impact**: >10 customer complaints in 1 hour
5. **Data Loss**: Any sign of data loss or corruption

### Rollback Procedures

#### Level 1: Disable Features (30 seconds)
```bash
# Set rollout to 0% via Vercel dashboard or CLI
vercel env rm PHASE_1A_ROLLOUT_PERCENT
vercel env add PHASE_1A_ROLLOUT_PERCENT 0
```
**Impact:** Phase 1A features disabled, system returns to pre-deployment state

#### Level 2: Code Rollback (5 minutes)
```bash
# Revert to previous deployment
cd /home/projects/safeprompt/api
git revert HEAD
git push
vercel --prod --token="$VERCEL_TOKEN"
```
**Impact:** Full code revert, all Phase 1A code removed

#### Level 3: Database Rollback (30 minutes)
```bash
# Only if database corruption detected
psql -h db.xxx.supabase.co -U postgres safeprompt_prod < backup_pre_phase1a.sql
```
**Impact:** Database restored to pre-Phase 1A state, all intelligence data lost

### Post-Rollback Actions

1. **Incident Report**: Document what went wrong
2. **Root Cause Analysis**: Identify and fix the issue
3. **Test in DEV**: Verify fix works
4. **Plan Re-deployment**: Schedule new deployment attempt

---

## 👥 User Communication Plan

### Existing User Defaults (Task 1A.70)

**Free Tier:**
- `contribute_intelligence`: `true` (required for free usage)
- `enable_ip_blocking`: `false` (Pro tier only)

**Pro Tier:**
- `contribute_intelligence`: `true` (opt-out available)
- `enable_ip_blocking`: `false` (opt-in required)
- `ip_block_threshold`: `0.3` (if they enable blocking)

**Migration Logic:**
```sql
-- Set defaults for existing users
UPDATE profiles
SET preferences = jsonb_build_object(
  'contribute_intelligence', CASE
    WHEN subscription_tier IN ('free', 'starter') THEN true
    WHEN subscription_tier IN ('pro', 'business', 'internal') THEN true
  END,
  'enable_ip_blocking', false,
  'ip_block_threshold', 0.3
)
WHERE preferences IS NULL OR preferences = '{}'::jsonb;
```

### Email Announcement (Task 1A.71)

**Subject:** "🛡️ SafePrompt Phase 1A: Network-Wide Threat Intelligence Now Live"

**Recipient Segments:**
- All active users (free + paid)
- Trial users
- Inactive users (last 90 days)

**Email Content:**

```
Hi [Name],

Great news! SafePrompt Phase 1A is now live with powerful new features to protect your applications.

🌐 What's New:

1. **Network-Wide Threat Intelligence**
   - Learn from attacks across all SafePrompt users
   - Automatic IP reputation tracking
   - Smarter detection with shared intelligence

2. **Multi-Turn Attack Protection**
   - Session-based validation detects context priming
   - Catches "As we discussed in ticket #123..." attacks
   - Protects conversational AI applications

3. **IP Reputation & Auto-Blocking** (Pro Tier)
   - Track bad actors with privacy-preserving hashes
   - Opt-in automatic IP blocking
   - Configurable reputation thresholds

🔒 Privacy First:
- All data anonymized after 24 hours (GDPR/CCPA compliant)
- Full control: export or delete your data anytime
- Pro tier can opt out of intelligence sharing

📚 Get Started:
- [Migration Guide](https://github.com/ianreboot/safeprompt/blob/main/docs/MIGRATION_GUIDE.md)
- [Code Examples](https://github.com/ianreboot/safeprompt/tree/main/examples)
- [Best Practices](https://github.com/ianreboot/safeprompt/blob/main/docs/BEST_PRACTICES.md)

💡 What You Need to Do:
1. Update SafePrompt SDK: `npm update safeprompt`
2. (Optional) Add X-User-IP header for IP reputation
3. (Pro tier) Enable IP blocking in [dashboard settings](https://dashboard.safeprompt.dev/settings)

Questions? Reply to this email or contact support@safeprompt.dev.

Thanks for using SafePrompt!

The SafePrompt Team
```

**Timing:**
- Send after 100% rollout is confirmed stable (Day 10)
- Stagger sends over 4 hours to avoid support spike

---

## 📊 Monitoring & Success Metrics

### Key Metrics to Track

**System Health:**
- API error rate: <2% target
- Average response time: <300ms (including AI validation)
- Database query time: <50ms average
- Cron job success rate: 100% (especially anonymization)

**Feature Adoption:**
- % of Pro users with IP blocking enabled: Target 30% in 30 days
- Session token usage: Target 20% of API calls in 30 days
- Intelligence samples collected: Target 1000/day initially

**Business Metrics:**
- Free tier signups: Monitor for increase (network effect)
- Pro tier upgrades: Monitor for increase (IP blocking value)
- User complaints: Target <5 complaints total
- Support ticket volume: Monitor for spike

### Monitoring Tools

1. **Job Monitoring Dashboard**
   - Location: https://dashboard.safeprompt.dev/admin
   - Check: Every hour during rollout
   - Alerts: Pagerduty for critical issues

2. **Vercel Logs**
   ```bash
   vercel logs --token="$VERCEL_TOKEN" --project=safeprompt-api
   ```

3. **Supabase Dashboard**
   - Database performance
   - RLS policy violations
   - Storage growth

4. **Custom Alerts**
   - Anonymization job failure (critical)
   - IP blocking rate >10/hour (possible false positives)
   - Storage capacity >80% (proactive scaling)

### Success Criteria (End of Week 2)

- ✅ Anonymization job: 100% success rate
- ✅ API error rate: <2% (unchanged from baseline)
- ✅ Average latency: <10ms increase
- ✅ Zero data loss incidents
- ✅ <10 user complaints
- ✅ Job monitoring dashboard: All green
- ✅ Intelligence samples: >500 collected in 7 days

---

## 🚨 Emergency Contacts

**On-Call Engineer:** TBD
**Backup Engineer:** TBD
**Product Owner:** Ian Ho (ian.ho@rebootmedia.net)

**Escalation Path:**
1. On-call engineer (immediate response)
2. Backup engineer (if on-call unavailable)
3. Product owner (critical decisions)

---

## 📝 Post-Deployment Checklist

### Day 10 (End of Monitoring Period)

- [ ] Review all metrics vs success criteria
- [ ] Analyze user feedback and support tickets
- [ ] Document any issues and resolutions
- [ ] Update CLAUDE.md with Phase 1A deployment status
- [ ] Archive deployment logs and metrics
- [ ] Write post-mortem (what went well, what to improve)
- [ ] Send user announcement email (if successful)
- [ ] Update status page: "Phase 1A deployed successfully"
- [ ] Begin planning for Phase 1B (session-based validation enhancements)

---

## 📚 Related Documentation

- **Technical Specs**: `/home/projects/safeprompt/docs/PHASE_1A_INTELLIGENCE_ARCHITECTURE.md`
- **Migration Guide**: `/home/projects/safeprompt-public/docs/MIGRATION_GUIDE.md`
- **Best Practices**: `/home/projects/safeprompt-public/docs/BEST_PRACTICES.md`
- **Security Hardening**: `/home/projects/safeprompt/docs/SECURITY_HARDENING_QUARTER1.md`

---

**Deployment plan approved by:** [To be filled]
**Deployment date:** [To be scheduled]
**Status:** Ready for execution
