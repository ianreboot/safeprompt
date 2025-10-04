# SafePrompt Security Remediation - Long Running Task

**Long Running Task ID**: SAFEPROMPT_SEC_REM_20251003
**Status**: INITIATED
**Start Date**: 2025-10-03
**Target Completion**: 2025-10-05
**Task Type**: Security Remediation & Feature Implementation
**Context Switches**: 0

## 📊 Quick Stats
- **Items Completed**: 0/28 (0%)
- **Current Phase**: Phase 0 - Investigation & Setup
- **Blockers**: None
- **Last Update**: 2025-10-03 15:55 by Claude

## 🧭 Status-Driven Navigation
- **✅ Completed**: 0 tasks
- **🔧 In Progress**: Investigation
- **❌ Blocked/Missing**: 0 tasks
- **🐛 Bug Fixes**: 0 tasks

**Current Focus**: Phase 0.1 - Document exposed secrets from git history
**Last Completed**: N/A - Starting task

## Executive Summary

This task addresses all P0 (Critical), P1 (High), and P2 (Medium) security issues identified in the comprehensive security audit conducted on 2025-10-03.

**Critical Issues Identified:**
- 20+ production secrets exposed in git commit a80fa7f1
- TESTING_MODE backdoor allowing authentication bypass
- Billing/upgrade functionality completely stubbed (blocks revenue)
- Password stored in sessionStorage (XSS vulnerability)
- Missing rate limiting, weak passwords, and other security gaps

**User Decisions:**
1. ✅ Rotate all exposed secrets (APPROVED)
2. ✅ Remove TESTING_MODE backdoor, use internal account instead (APPROVED)
3. ✅ Build billing/upgrade functionality (APPROVED)
4. ✅ Fix password in sessionStorage (APPROVED)
5. ℹ️ Footer GitHub link remains public (intentional - for developers to see SafePrompt code examples)

**Expected Outcome:**
- Security grade improvement from D+ (69/100) to B (85/100)
- All P0 issues resolved before Product Hunt launch
- Production secrets rotated and secured
- Complete billing functionality enabling revenue

## Methodology
Following LONG_RUNNING_TASK_METHODOLOGY from `/home/projects/docs/methodology-long-running-tasks.md`

**Context Refresh Pattern**: Every 2 tasks, re-read:
1. `/home/projects/safeprompt/CLAUDE.md` (project knowledge)
2. `/home/projects/docs/reference-vercel-access.md` (Vercel operations)
3. `/home/projects/docs/reference-cloudflare-access.md` (Cloudflare operations)
4. `/home/projects/docs/reference-supabase-access.md` (Database operations)

## 📝 Document Update Instructions (EXECUTE DURING CONTEXT REFRESH)

### When you reach a 🧠 CONTEXT REFRESH task, complete these steps:

**ESSENTIAL UPDATES:**

1. **Update Task Checklist**:
   - Find the task you just completed
   - Change `[ ]` to `[x]` and add `(COMPLETED: YYYY-MM-DD HH:MM)`
   - If you encountered issues, add a note under the task

2. **Update Current State Variables**:
   - Go to "Current State Variables" section
   - Update `CURRENT_PHASE` to reflect where you are
   - Set boolean flags based on what's been completed
   - Update secrets status

3. **Update Progress Log**:
   - Go to "Progress Log" section
   - Add new entry with current date/time
   - Document: What was done, files modified, results, issues, next step

4. **Update Quick Stats** (at top of document):
   - Count completed vs total tasks for percentage
   - Update "Current Phase"
   - Update "Last Update" with current timestamp
   - Note any new blockers

5. **Re-read Reference Documentation**:
   - Read `/home/projects/safeprompt/CLAUDE.md` (complete file)
   - Read `/home/projects/docs/reference-vercel-access.md` (relevant sections)
   - Read `/home/projects/docs/reference-cloudflare-access.md` (relevant sections)
   - Read `/home/projects/docs/reference-supabase-access.md` (relevant sections)

6. **Document Any Discoveries**:
   - If you found something unexpected, add to "Notes & Observations"
   - If you hit an error, add to "Error Recovery & Troubleshooting"

## 🚨 MANDATORY: Zero Bug Tolerance Protocol

**When You Discover ANY Bug**:
1. IMMEDIATELY add the bug fix as a NEW task to the checklist
2. Position appropriately (blocking bugs immediately after current, non-blocking at phase end)
3. Add a CONTEXT REFRESH task right after the bug fix
4. Re-evaluate all subsequent refresh positioning
5. Document the discovery
6. NEVER continue with known bugs unaddressed

## Task Checklist (UPDATE AFTER EACH STEP)

### Phase 0: Investigation & Secret Documentation
- [ ] 0.1 Examine commit a80fa7f1 to document all exposed secrets
- [ ] 0.2 Create secret rotation checklist with service URLs and procedures
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"

### Phase 1: Git History & Secret Rotation (P0 - CRITICAL)
- [ ] 1.1 Answer: Can we delete commit a80fa7f1 permanently? Document git filter-branch vs rewriting history
- [ ] 1.2 Rotate Supabase PROD service role key (update Vercel env vars)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 1.3 Rotate Stripe live secret key (update Vercel env vars, test webhooks)
- [ ] 1.4 Regenerate Stripe webhook secret (update Vercel, verify signature validation)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 1.5 Rotate Resend API key (update Vercel env vars, test email sending)
- [ ] 1.6 Verify all rotated secrets in Vercel environment variables
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 1.7 Redeploy API with new secrets to DEV and PROD
- [ ] 1.8 Test API functionality with rotated secrets (validation, webhooks, emails)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 1.9 Document secret rotation procedure in `/home/projects/safeprompt/CLAUDE.md` Hard-Fought Knowledge

### Phase 2: Remove Testing Backdoors (P0 - CRITICAL)
- [ ] 2.1 Remove TESTING_MODE backdoor from `/home/projects/safeprompt/api/lib/ai-validator-hardened.js:24`
- [ ] 2.2 Verify internal account `ian.ho@rebootmedia.net` exists with `tier='internal'` and unlimited quota
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 2.3 Test internal account can still bypass subscription checks via tier-based logic
- [ ] 2.4 Commit and deploy backdoor removal to DEV and PROD
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"

### Phase 3: Build Stripe Billing Portal (P0 - CRITICAL - Revenue Blocker)
- [ ] 3.1 Read Stripe Customer Portal documentation (use context7 if needed)
- [ ] 3.2 Implement Stripe Customer Portal session creation in `/home/projects/safeprompt/api/api/stripe-portal.js`
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 3.3 Update dashboard `openBillingPortal()` function to call new API endpoint
- [ ] 3.4 Test billing portal in Stripe test mode (cancel subscription, update payment, view invoices)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 3.5 Deploy to DEV and test end-to-end flow
- [ ] 3.6 Deploy to PROD and verify production Stripe integration
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"

### Phase 4: Build Stripe Checkout for Upgrades (P0 - CRITICAL - Revenue Blocker)
- [ ] 4.1 Read Stripe Checkout documentation (use context7 if needed)
- [ ] 4.2 Implement Stripe Checkout session creation in `/home/projects/safeprompt/api/api/stripe-checkout.js`
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 4.3 Update dashboard plan selection buttons to call new API endpoint
- [ ] 4.4 Test checkout flow in Stripe test mode (all 3 plans: Starter, Growth, Business)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 4.5 Verify webhook updates subscription tier after successful payment
- [ ] 4.6 Deploy to DEV and test end-to-end purchase flow
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 4.7 Deploy to PROD and verify production checkout integration
- [ ] 4.8 Test production purchase flow with Stripe test cards

### Phase 5: Fix Password in SessionStorage (P0 - CRITICAL - Security)
- [ ] 5.1 Remove password from sessionStorage in `/home/projects/safeprompt/dashboard/src/app/onboard/page.tsx:24-26`
- [ ] 5.2 Implement alternative: Use one-time token or remove entirely (signup redirects directly to dashboard)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 5.3 Test onboarding flow works without password in sessionStorage
- [ ] 5.4 Deploy to DEV and PROD
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"

### Phase 6: Final Testing & Launch Readiness
- [ ] 6.1 Run complete security audit verification (verify all P0 fixes applied)
- [ ] 6.2 Test all critical user flows: signup → dashboard → upgrade → billing portal
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"
- [ ] 6.3 Update audit report with completion status and new security grade
- [ ] 6.4 Document all changes in project CLAUDE.md Hard-Fought Knowledge
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CLAUDE.md` and `/home/projects/docs/reference-*.md`, execute "📝 Document Update Instructions"

## Current State Variables

```yaml
CURRENT_PHASE: "Phase 0 - Investigation & Setup"
SECRETS_DOCUMENTED: false
SECRETS_ROTATED: false
TESTING_BACKDOOR_REMOVED: false
BILLING_PORTAL_IMPLEMENTED: false
CHECKOUT_IMPLEMENTED: false
PASSWORD_STORAGE_FIXED: false
LAUNCH_READY: false

# Blocker Tracking
BLOCKER_ENCOUNTERED: false
BLOCKER_DESCRIPTION: ""

# File Locations (will be updated as we progress)
STRIPE_PORTAL_API: "/home/projects/safeprompt/api/api/stripe-portal.js"
STRIPE_CHECKOUT_API: "/home/projects/safeprompt/api/api/stripe-checkout.js"
DASHBOARD_PAGE: "/home/projects/safeprompt/dashboard/src/app/page.tsx"
ONBOARD_PAGE: "/home/projects/safeprompt/dashboard/src/app/onboard/page.tsx"
AI_VALIDATOR: "/home/projects/safeprompt/api/lib/ai-validator-hardened.js"
```

## Implementation Details

### Critical Context

**Exposed Secrets Location**: Git commit a80fa7f1 "Production environment deployment complete - Step 6 complete"

**Secrets in /home/projects/.env** (NOT in git):
- SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
- STRIPE_PROD_SECRET_KEY
- STRIPE_PROD_WEBHOOK_SECRET
- RESEND_API_KEY

**Vercel Projects:**
- DEV API: safeprompt-api-dev
- PROD API: safeprompt-api

**Stripe Configuration:**
- Test mode: For development testing
- Live mode: For production (currently has exposed keys)

**Key Files to Modify:**
1. `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` - Remove TESTING_MODE
2. `/home/projects/safeprompt/dashboard/src/app/page.tsx` - Implement billing portal and checkout
3. `/home/projects/safeprompt/dashboard/src/app/onboard/page.tsx` - Remove password storage
4. Create new API endpoints for Stripe portal and checkout

### User Questions Answered

**Q: Can we delete commit a80fa7f1 permanently?**
A: (To be investigated in Phase 1, Task 1.1)

**Short Answer Preview:**
- Git history can be rewritten using `git filter-branch` or `git filter-repo`
- Requires force push to remote (breaks anyone who has cloned)
- Secrets are already exposed - rotation is more important than deletion
- Recommendation: Rotate secrets immediately, consider history rewrite as secondary cleanup

**Q: Why should footer GitHub link go to private repo?**
A: User clarification - footer should link to PUBLIC repo (safeprompt, not safeprompt-internal) so developers can see SafePrompt usage examples. Audit recommendation was incorrect.

### Secret Rotation Procedures

**Supabase Service Role Key:**
1. Go to https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/settings/api
2. Click "Reset service_role secret"
3. Copy new key
4. Update Vercel: `vercel env add SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY "new_key" --project safeprompt-api`
5. Update `/home/projects/.env`
6. Redeploy API

**Stripe Keys:**
1. Go to https://dashboard.stripe.com/apikeys
2. Roll secret key (Developers → API Keys → Roll key)
3. Copy new key
4. Update Vercel: `vercel env add STRIPE_SECRET_KEY "new_key" --project safeprompt-api`
5. Update `/home/projects/.env`
6. Test webhook signature validation

**Stripe Webhook Secret:**
1. Go to https://dashboard.stripe.com/webhooks
2. Delete old webhook endpoint
3. Create new endpoint pointing to production API
4. Copy new webhook secret
5. Update Vercel: `vercel env add STRIPE_WEBHOOK_SECRET "new_secret" --project safeprompt-api`
6. Update `/home/projects/.env`
7. Test webhook delivery

**Resend API Key:**
1. Go to https://resend.com/api-keys
2. Delete old key
3. Create new API key
4. Update Vercel: `vercel env add RESEND_API_KEY "new_key" --project safeprompt-api`
5. Update `/home/projects/.env`
6. Test email sending

### Pre-Approved Commands

```bash
# Vercel environment variable management
vercel env add * "value" --project safeprompt-api*
vercel env ls --project safeprompt-api*
vercel env rm * --project safeprompt-api*

# API deployment
cd /home/projects/safeprompt/api
vercel link --project safeprompt-api* --yes
vercel --prod

# Dashboard deployment
cd /home/projects/safeprompt/dashboard
npm run build
wrangler pages deploy out --project-name safeprompt-dashboard*

# Testing
curl -X POST https://*-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sp_*" \
  -d '{"prompt":"*"}'

# Database queries
supabase db query "SELECT * FROM profiles WHERE email = 'ian.ho@rebootmedia.net'"
supabase db query "UPDATE profiles SET * WHERE *"

# Git operations
cd /home/projects/safeprompt
git status
git add *
git commit -m "*"
git push origin *
git log --oneline *
git show *
```

## Progress Log

### 2025-10-03 15:55 - Initialization
- **AI**: Claude (session recovered from auto-compaction)
- **Action**: Created long-running task document following methodology
- **Files**: Created `/home/projects/user-input/SAFEPROMPT_SECURITY_REMEDIATION.md`
- **Result**: Task structure established with 28 total tasks across 6 phases
- **Issues**: None
- **Next Step**: Phase 0.1 - Examine commit a80fa7f1 to document exposed secrets

## Error Recovery & Troubleshooting

### Common Issues and Solutions

**If Vercel deployment fails with "Invalid credentials"**:
1. Check token: `export VERCEL_TOKEN=$(grep VERCEL_TOKEN /home/projects/.env | cut -d'=' -f2)`
2. Verify authentication: `vercel whoami`
3. Re-link project: `vercel link --project safeprompt-api --yes`

**If Stripe webhook signature validation fails**:
1. Verify webhook secret in Vercel matches Stripe dashboard
2. Check API receives raw body (not parsed JSON)
3. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks`

**If Supabase connection fails after key rotation**:
1. Verify new key copied correctly (no whitespace)
2. Check Vercel env var updated in both DEV and PROD projects
3. Redeploy API to pick up new environment variables

## Validation Checklist

- [ ] All P0 issues resolved and tested
- [ ] Secret rotation completed and verified
- [ ] Billing portal functional in test and production mode
- [ ] Checkout flow tested with all 3 plans
- [ ] Password no longer stored client-side
- [ ] Internal account testing still works
- [ ] All deployments successful
- [ ] Security audit grade improved to B (85/100)

## Notes & Observations

### Hard-Fought Knowledge
(Will be populated as we encounter challenges)

## References

- **Methodology**: `/home/projects/docs/methodology-long-running-tasks.md`
- **Audit Report**: `/home/projects/user-input/SAFEPROMPT_SECURITY_AUDIT_20251003.md`
- **Project Knowledge**: `/home/projects/safeprompt/CLAUDE.md`
- **Vercel Access**: `/home/projects/docs/reference-vercel-access.md`
- **Cloudflare Access**: `/home/projects/docs/reference-cloudflare-access.md`
- **Supabase Access**: `/home/projects/docs/reference-supabase-access.md`
