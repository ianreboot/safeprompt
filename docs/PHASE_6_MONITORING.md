# Phase 6 Intelligence Pipeline - Monitoring & Alerts

**Created**: 2025-10-08
**Status**: Production Deployment

## Overview

This document defines monitoring, alerting, and health checks for the Phase 6 Intelligence Pipeline deployed to production.

## Background Job Monitoring

### 1. Pattern Discovery (Daily at 3:00 AM UTC)

**Endpoint**: `/api/cron/pattern-discovery`
**Schedule**: `0 3 * * *`
**Max Duration**: 5 minutes (300s)

**Success Criteria**:
- Job completes within 5 minutes
- Returns HTTP 200 status
- Analyzes anonymized samples (>24h old)
- Creates pattern proposals in database

**Alert Triggers**:
- Job fails (HTTP 500) → **Critical** alert
- Job timeout (>5 minutes) → **Warning** alert
- No proposals created in 48 hours → **Warning** alert
- AI API errors (OpenRouter) → **Warning** alert

**Vercel Logs Check**:
```bash
# Check last run
vercel logs safeprompt-api-dev --since 24h | grep "Pattern Discovery"

# Expected output:
# [Cron] Pattern Discovery: Starting...
# [Cron] Pattern Discovery: Completed in XXXXms
```

**Database Health Check**:
```sql
-- Check recent pattern proposals
SELECT created_at, status, ai_confidence
FROM pattern_proposals
WHERE created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC
LIMIT 10;

-- Alert if no rows returned
```

### 2. Campaign Detection (Daily at 3:30 AM UTC)

**Endpoint**: `/api/cron/campaign-detection`
**Schedule**: `30 3 * * *`
**Max Duration**: 2 minutes (120s)

**Success Criteria**:
- Job completes within 2 minutes
- Returns HTTP 200 status
- Analyzes threat intelligence samples
- Creates attack_campaigns if patterns detected

**Alert Triggers**:
- Job fails (HTTP 500) → **Critical** alert
- Job timeout (>2 minutes) → **Warning** alert
- No run in 36 hours → **Critical** alert
- Active campaigns detected → **Info** alert (notify admin)

**Vercel Logs Check**:
```bash
# Check last run
vercel logs safeprompt-api-dev --since 24h | grep "Campaign Detection"

# Expected output:
# [Cron] Campaign Detection: Starting...
# [Cron] Campaign Detection: Completed in XXXXms
```

**Database Health Check**:
```sql
-- Check recent campaigns
SELECT name, start_time, attack_count, status, severity
FROM attack_campaigns
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Alert if active campaigns with severity='critical'
```

### 3. Honeypot Learning (Daily at 4:00 AM UTC)

**Endpoint**: `/api/cron/honeypot-learning`
**Schedule**: `0 4 * * *`
**Max Duration**: 3 minutes (180s)

**Success Criteria**:
- Job completes within 3 minutes
- Returns HTTP 200 status
- Analyzes honeypot requests
- Auto-deploys safe patterns (status='deployed')

**Alert Triggers**:
- Job fails (HTTP 500) → **Critical** alert
- Job timeout (>3 minutes) → **Warning** alert
- No auto-deployments in 7 days → **Info** alert
- Honeypot requests spike (>500/day) → **Warning** alert (potential attack)

**Vercel Logs Check**:
```bash
# Check last run
vercel logs safeprompt-api-dev --since 24h | grep "Honeypot Learning"

# Expected output:
# [Cron] Honeypot Learning: Starting...
# [Cron] Honeypot Learning: Completed in XXXXms
```

**Database Health Check**:
```sql
-- Check auto-deployed patterns
SELECT pattern_text, occurrences, confidence, created_at
FROM pattern_proposals
WHERE status = 'deployed'
  AND deployed_to_production = true
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Alert if no rows in 7 days (unusual but not critical)
```

## Performance Baselines

### API Response Times (P95)

**Pattern Discovery**:
- Baseline: 60-120 seconds (AI-heavy)
- Alert if: >300 seconds (timeout)

**Campaign Detection**:
- Baseline: 30-60 seconds
- Alert if: >120 seconds (timeout)

**Honeypot Learning**:
- Baseline: 45-90 seconds
- Alert if: >180 seconds (timeout)

### Database Load

**Threat Intelligence Samples Table**:
- Growth rate: ~1000-5000 samples/day (variable based on traffic)
- Anonymization: >24h samples should have `is_anonymized=true`
- Cleanup: Old samples retained for pattern analysis

**Pattern Proposals Table**:
- Growth rate: ~2-10 proposals/week
- Review queue: Target <50 pending proposals at any time

**Attack Campaigns Table**:
- Growth rate: ~1-5 campaigns/week
- Active campaigns: Should be resolved within 7 days

**Honeypot Requests Table**:
- Growth rate: ~100-1000 requests/day
- Auto-deployed: ~2-5 patterns/week

### Supabase Metrics

**Query Performance**:
- Anonymization RPC: <5 seconds for 1000 samples
- Pattern discovery queries: <30 seconds
- Campaign detection queries: <15 seconds

**Connection Pool**:
- Monitor connection count: Alert if >80% utilization
- Expected: <10 concurrent connections for background jobs

## Alert Configuration

### Vercel Integration Logs

**Setup**:
1. Go to: https://vercel.com/ian-hos-projects/safeprompt-api-dev/settings/integrations
2. Add integration: **Vercel Log Drains** (or similar monitoring service)
3. Configure alerts for cron job failures

**Alternative**: Use Vercel CLI to check logs daily
```bash
# Daily health check script
vercel logs safeprompt-api-dev --since 24h | grep -E "Pattern Discovery|Campaign Detection|Honeypot Learning"
```

### Supabase Dashboard Alerts

**Setup**:
1. Go to: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/settings/alerts
2. Configure alerts:
   - Database CPU >80% sustained
   - Database Memory >90%
   - Query execution time >10s sustained
   - Connection pool >80% utilization

### Email Alerts (via Resend)

**Already Configured**: Alert system in `/api/lib/alert-notifier.js`

**Admin Email**: ian.ho@rebootmedia.net

**Alert Types**:
- `error_rate`: High error rate detected
- `openrouter_spend`: Unusual AI API spending
- `system`: General system alerts
- `background_job`: Cron job failures (NEW for Phase 6)

## Daily Health Check Routine

**Manual verification** (until automated monitoring is set up):

```bash
# 1. Check Vercel cron job logs (daily at 5 AM UTC)
vercel logs safeprompt-api-dev --since 24h | grep -E "Cron.*Pattern Discovery|Cron.*Campaign Detection|Cron.*Honeypot Learning"

# 2. Check Supabase dashboard (weekly)
# - Database performance metrics
# - Query performance
# - Storage usage

# 3. Check admin dashboard (weekly)
# - https://dashboard.safeprompt.dev/admin/intelligence
# - Review pending pattern proposals
# - Check active campaigns
# - Monitor threat trends
```

## Rollback Triggers

**Immediate rollback required if**:

1. **Data corruption**:
   - Anonymization fails for >100 samples
   - Pattern proposals corrupted
   - Database migration errors

2. **Performance degradation**:
   - API response times >10s sustained
   - Database CPU >95% sustained
   - Cron jobs timing out consistently (>3 failures)

3. **Security issues**:
   - False negatives detected (attacks passing through)
   - Pattern proposals auto-deploying incorrectly
   - Honeypot data leaking to production

**Rollback Procedure**: See `/home/projects/safeprompt/docs/PHASE_6_INTELLIGENCE_ARCHITECTURE.md` lines 517-546

## Production Readiness Checklist

- [x] Background jobs deployed to Vercel
- [x] Cron schedules configured (3 AM, 3:30 AM, 4 AM UTC)
- [x] Database migrations applied to PROD
- [x] Admin dashboard accessible
- [x] Alert system configured
- [x] Performance baselines documented
- [x] Rollback plan documented
- [ ] First 24h monitoring period completed (monitor after deployment)
- [ ] First week metrics captured (validate baselines)

## Next Steps (Post-Deployment)

1. **Week 1**: Monitor daily, capture actual baselines
2. **Week 2**: Fine-tune alert thresholds based on Week 1 data
3. **Month 1**: Evaluate pattern discovery quality, adjust AI confidence thresholds
4. **Month 2**: Assess campaign detection accuracy, refine clustering algorithms
5. **Quarter 1**: Full security audit, validate Phase 6 effectiveness

---

**Last Updated**: 2025-10-08
**Owner**: SafePrompt Security Team
**Next Review**: 2025-10-15 (1 week post-deployment)
