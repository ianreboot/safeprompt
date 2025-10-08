# Phase 6 Intelligence Pipeline - Rollback Plan

**Created**: 2025-10-08
**Status**: Production Deployment Emergency Procedures

## Executive Summary

Phase 6 is **additive only** - it does not modify core validation logic. Disabling Phase 6 returns SafePrompt to Phase 1A/2 functionality with **zero impact** on core validation accuracy and performance.

**Key Safety Principle**: The intelligence pipeline runs independently of the validation API. Background jobs can be disabled without affecting real-time validation.

## Rollback Severity Levels

### Level 1: Disable Specific Background Job (Low Risk)
**When**: Single job failing or timing out
**Impact**: No impact on validation, reduced intelligence gathering
**Recovery Time**: Immediate (config change)

### Level 2: Disable All Background Jobs (Medium Risk)
**When**: Multiple jobs failing, database performance issues
**Impact**: No new pattern discovery, existing patterns still active
**Recovery Time**: <5 minutes (config change + redeploy)

### Level 3: Revert Database Schema (High Risk)
**When**: Data corruption, migration errors, critical schema issues
**Impact**: Loss of Phase 6 tables, requires full redeployment
**Recovery Time**: 15-30 minutes (database operations + testing)

## Rollback Procedures

### Level 1: Disable Single Background Job

**Example: Disable Pattern Discovery**

1. **Update Vercel Configuration**
   ```bash
   cd /home/projects/safeprompt/api

   # Edit vercel.json
   # Comment out the specific cron job
   ```

2. **Edit vercel.json**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/intelligence-cleanup",
         "schedule": "0 * * * *"
       }
       // DISABLED: Pattern Discovery
       // {
       //   "path": "/api/cron/pattern-discovery",
       //   "schedule": "0 3 * * *"
       // },
       {
         "path": "/api/cron/campaign-detection",
         "schedule": "30 3 * * *"
       },
       {
         "path": "/api/cron/honeypot-learning",
         "schedule": "0 4 * * *"
       }
     ]
   }
   ```

3. **Deploy Changes**
   ```bash
   source /home/projects/.env
   git add api/vercel.json
   git commit -m "Disable pattern-discovery cron job (rollback)"
   git push
   vercel --token $VERCEL_TOKEN --prod --yes
   ```

4. **Verify Rollback**
   ```bash
   # Check Vercel dashboard cron jobs
   # Verify pattern-discovery is no longer scheduled
   vercel crons ls --token $VERCEL_TOKEN
   ```

**Estimated Time**: 5 minutes

### Level 2: Disable All Phase 6 Background Jobs

**When to Use**:
- Multiple background jobs failing
- Database performance degradation
- Unknown Phase 6 issue affecting system

**Procedure**:

1. **Backup Current Configuration**
   ```bash
   cd /home/projects/safeprompt/api
   cp vercel.json vercel.json.backup-phase6
   ```

2. **Remove All Phase 6 Cron Jobs**
   ```bash
   # Edit vercel.json to remove:
   # - pattern-discovery
   # - campaign-detection
   # - honeypot-learning
   ```

   **Minimal vercel.json (Phase 1A only)**:
   ```json
   {
     "functions": {
       "api/v1/validate.js": {
         "maxDuration": 10
       },
       "api/webhooks.js": {
         "maxDuration": 30
       },
       "api/playground.js": {
         "maxDuration": 15
       },
       "api/cron/intelligence-cleanup.js": {
         "maxDuration": 60
       }
     },
     "crons": [
       {
         "path": "/api/cron/intelligence-cleanup",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

3. **Deploy Rollback**
   ```bash
   source /home/projects/.env
   git add api/vercel.json
   git commit -m "Emergency rollback: Disable all Phase 6 background jobs"
   git push
   vercel --token $VERCEL_TOKEN --prod --yes
   ```

4. **Verify System Health**
   ```bash
   # Check validation API still works
   curl https://api.safeprompt.dev/api/v1/validate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test","apiKey":"test_key"}'

   # Expected: Normal validation response (no errors)
   ```

5. **Monitor Performance**
   ```bash
   # Check API response times
   vercel logs safeprompt-api-dev --since 1h | grep "validate"

   # Check database performance
   # Supabase dashboard: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv
   ```

**Estimated Time**: 10 minutes

**Impact Assessment**:
- ✅ Core validation: Unaffected
- ✅ Existing patterns: Still active
- ❌ New pattern discovery: Disabled
- ❌ Campaign detection: Disabled
- ❌ Honeypot learning: Disabled
- ❌ Admin intelligence dashboard: No new data

### Level 3: Revert Database Schema (CRITICAL)

**⚠️ WARNING**: Only use if database corruption or critical schema issues detected.

**When to Use**:
- Pattern_proposals table corrupted
- Migration errors causing validation failures
- Data integrity issues in Phase 6 tables

**Pre-Rollback Checklist**:
- [ ] Backup current database state
- [ ] Confirm issue is schema-related (not application bug)
- [ ] Notify team of downtime window
- [ ] Have restore plan ready

**Procedure**:

1. **Backup Current Database**
   ```bash
   cd /home/projects/safeprompt
   source /home/projects/.env
   export SUPABASE_ACCESS_TOKEN

   # Dump current schema
   supabase db dump --project-ref adyfhzbcsqzgqvyimycv > backups/prod-schema-$(date +%Y%m%d-%H%M%S).sql

   # Dump Phase 6 tables data (for recovery)
   supabase db dump --project-ref adyfhzbcsqzgqvyimycv \
     --data-only \
     --table pattern_proposals \
     --table attack_campaigns \
     --table honeypot_learnings \
     --table threat_intelligence_samples \
     > backups/phase6-data-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Mark Migrations as Reverted**
   ```bash
   # Connect to database via Supabase CLI
   supabase link --project-ref adyfhzbcsqzgqvyimycv

   # Mark Phase 6 migrations as reverted
   # Note: This doesn't actually revert, just marks them
   supabase migration repair --status reverted 20251007030000
   supabase migration repair --status reverted 20251007040000
   ```

3. **Manually Drop Phase 6 Tables** (CRITICAL STEP)
   ```sql
   -- ONLY run this if absolutely necessary
   -- This will delete all Phase 6 data

   -- Drop tables in correct order (respecting foreign keys)
   DROP TABLE IF EXISTS honeypot_learnings CASCADE;
   DROP TABLE IF EXISTS attack_campaigns CASCADE;
   DROP TABLE IF EXISTS pattern_proposals CASCADE;
   -- Note: threat_intelligence_samples used by Phase 1A, keep it

   -- Remove Phase 6 columns from threat_intelligence_samples
   ALTER TABLE threat_intelligence_samples
     DROP COLUMN IF EXISTS pattern_detected,
     DROP COLUMN IF EXISTS ai_reasoning,
     DROP COLUMN IF EXISTS confidence_score;
   ```

4. **Execute Schema Rollback**
   ```bash
   # Create rollback migration
   cd /home/projects/safeprompt

   # Execute manual SQL via Supabase dashboard or CLI
   # Go to: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/sql
   # Paste SQL from step 3
   ```

5. **Verify System Health**
   ```bash
   # Test validation API
   curl https://api.safeprompt.dev/api/v1/validate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test prompt","apiKey":"test_key"}'

   # Expected: Normal validation (Phase 1A/2 functionality)
   ```

6. **Update Documentation**
   ```bash
   # Mark Phase 6 as reverted
   cd /home/projects/safeprompt/docs

   # Update PHASE_6_INTELLIGENCE_ARCHITECTURE.md
   echo "STATUS: REVERTED - $(date)" >> PHASE_6_INTELLIGENCE_ARCHITECTURE.md

   git add docs/
   git commit -m "Documentation: Phase 6 reverted due to [REASON]"
   git push
   ```

**Estimated Time**: 30 minutes

**Data Loss**:
- All pattern proposals
- All attack campaigns
- All honeypot learnings
- Enhanced threat intelligence metadata

**Preserved**:
- Core validation functionality
- Existing static patterns (from Phase 1/2)
- Threat intelligence samples (anonymized)
- IP reputation system (Phase 1A)

## Recovery After Rollback

### From Level 1 (Single Job Disabled)

1. **Fix Root Cause**
   - Debug specific job failure
   - Fix code or configuration issue
   - Test in DEV environment

2. **Re-enable Job**
   ```bash
   # Uncomment cron job in vercel.json
   # Deploy to production
   vercel --token $VERCEL_TOKEN --prod --yes
   ```

3. **Monitor First Run**
   - Check Vercel logs
   - Verify job completes successfully
   - Check database for new records

**Recovery Time**: 1-2 hours

### From Level 2 (All Jobs Disabled)

1. **Root Cause Analysis**
   - Review Vercel logs
   - Check Supabase performance metrics
   - Identify specific failure point

2. **Fix and Test**
   - Fix issues in DEV environment
   - Run comprehensive tests
   - Validate with sample data

3. **Gradual Re-enable**
   ```bash
   # Day 1: Enable pattern-discovery only
   # Day 2: Enable campaign-detection
   # Day 3: Enable honeypot-learning
   ```

4. **Monitor Each Job**
   - Verify completion
   - Check performance impact
   - Validate data quality

**Recovery Time**: 3-7 days (gradual rollout)

### From Level 3 (Schema Reverted)

1. **Full Redeployment Required**
   - Fix root cause of schema issues
   - Test migrations in DEV
   - Apply migrations to PROD
   - Redeploy all Phase 6 components

2. **Data Migration**
   ```bash
   # If Phase 6 data was backed up:
   # Restore from backups/phase6-data-YYYYMMDD-HHMMSS.sql
   ```

3. **Comprehensive Testing**
   - Verify all background jobs
   - Test admin dashboard
   - Validate pattern discovery
   - Check campaign detection
   - Test honeypot learning

**Recovery Time**: 1-2 weeks (full redeployment + validation)

## Monitoring After Rollback

### Immediate (First 24 Hours)

- Check validation API every hour
- Monitor error rates in Vercel logs
- Watch database CPU/memory metrics
- Verify core validation accuracy maintained

### Short-term (First Week)

- Daily health checks
- Compare performance to pre-Phase 6 baseline
- Monitor customer reports
- Track any unusual patterns

### Long-term (First Month)

- Weekly performance reviews
- Analyze why rollback was necessary
- Plan Phase 6 redeployment (if applicable)
- Update deployment procedures

## Emergency Contacts

**Primary**: Ian Ho (ian.ho@rebootmedia.net)
**Vercel Support**: https://vercel.com/support
**Supabase Support**: https://supabase.com/dashboard/support

## Rollback Decision Matrix

| Issue | Level | Action | Recovery Time |
|-------|-------|--------|---------------|
| Single job timeout | Level 1 | Disable specific job | 5 min |
| Multiple job failures | Level 2 | Disable all Phase 6 jobs | 10 min |
| Database CPU >95% | Level 2 | Disable all Phase 6 jobs | 10 min |
| Data corruption | Level 3 | Revert schema | 30 min |
| Validation accuracy drop | Level 2 | Disable all Phase 6 jobs | 10 min |
| API response time spike | Level 2 | Disable all Phase 6 jobs | 10 min |
| Schema migration error | Level 3 | Revert schema | 30 min |

## Rollback Success Criteria

**Validation After Rollback**:
- [ ] Validation API responds within baseline (<3s P95)
- [ ] Error rate returns to baseline (<0.1%)
- [ ] Database performance normal (<50% CPU)
- [ ] No customer reports of issues
- [ ] Validation accuracy maintained (98.9%)

**Documentation**:
- [ ] Rollback reason documented
- [ ] Impact assessment completed
- [ ] Recovery plan created
- [ ] Team notified
- [ ] Post-mortem scheduled

---

**Last Updated**: 2025-10-08
**Next Review**: After first rollback event or quarterly
**Owner**: SafePrompt Engineering Team
