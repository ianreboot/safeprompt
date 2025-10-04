# DEV/PROD Separation Verification Checklist
**Date**: 2025-10-03
**Status**: NEEDS VERIFICATION

## 🚨 CRITICAL: Git Repository Separation

### Repository Rules
- ✅ **safeprompt** (PUBLIC): NPM package only, NO application code
- ✅ **safeprompt-internal** (PRIVATE): All development work happens here
- ✅ Local git remote points to: safeprompt-internal
- ✅ Dev branch deleted from public repo
- ✅ All secrets removed from git history

### Verification Commands
```bash
cd /home/projects/safeprompt
git remote -v  # Should show: safeprompt-internal
git push origin dev  # Should push to PRIVATE repo only
```

---

## 📧 Email Configuration

### 1. Email Templates Applied to Both Environments
**Script**: `scripts/apply-email-templates.js`

**What to verify**:
- [ ] DEV has branded SafePrompt email template
- [ ] PROD has branded SafePrompt email template
- [ ] Both use Resend SMTP (not Supabase default)
- [ ] Both send from SafePrompt <noreply@safeprompt.dev>

**Test**:
```bash
cd /home/projects/safeprompt
node scripts/apply-email-templates.js
```

**Expected output**:
```
✅ DEV: Email config applied successfully
   SMTP host: smtp.resend.com
   SMTP sender: SafePrompt <noreply@safeprompt.dev>

✅ PROD: Email config applied successfully
   SMTP host: smtp.resend.com
   SMTP sender: SafePrompt <noreply@safeprompt.dev>
```

### 2. Password Reset Email Flow

**✅ FIXED (Oct 3, 2025)**: Redirect URLs now configured in Supabase

**DEV Environment**:
- [x] Visit https://dev-dashboard.safeprompt.dev/forgot-password
- [x] Request reset for ian.ho@rebootmedia.net
- [x] Receive branded email from SafePrompt
- [x] Email contains DEV reset link
- [ ] Reset link works and connects to DEV database (TEST AGAIN WITH NEW LINK)

**PROD Environment**:
- [ ] Visit https://dashboard.safeprompt.dev/forgot-password
- [ ] Request reset for test account
- [ ] Receive branded email from SafePrompt
- [ ] Email contains PROD reset link
- [ ] Reset link works and connects to PROD database

---

## 🗄️ Database Configuration

### Database URLs (CRITICAL REFERENCE)
- **PROD**: `adyfhzbcsqzgqvyimycv.supabase.co` ← Production, authoritative
- **DEV**: `vkyggknknyfallmnrmfu.supabase.co` ← Testing only

### 3. Environment Variable Separation

**Dashboard DEV** (`dashboard/.env.development`):
- [ ] NEXT_PUBLIC_SUPABASE_URL points to DEV
- [ ] NEXT_PUBLIC_DASHBOARD_URL: https://dev-dashboard.safeprompt.dev
- [ ] STRIPE keys are TEST keys

**Dashboard PROD** (`dashboard/.env.production`):
- [ ] NEXT_PUBLIC_SUPABASE_URL points to PROD
- [ ] NEXT_PUBLIC_DASHBOARD_URL: https://dashboard.safeprompt.dev
- [ ] STRIPE keys are LIVE keys

**Website DEV** (`website/.env.development`):
- [ ] NEXT_PUBLIC_DASHBOARD_URL: https://dev-dashboard.safeprompt.dev
- [ ] NEXT_PUBLIC_WEBSITE_URL: https://dev.safeprompt.dev
- [ ] STRIPE keys are TEST keys

**Website PROD** (`website/.env.production`):
- [ ] NEXT_PUBLIC_DASHBOARD_URL: https://dashboard.safeprompt.dev
- [ ] NEXT_PUBLIC_WEBSITE_URL: https://safeprompt.dev
- [ ] STRIPE keys are LIVE keys

**Verify**:
```bash
cd /home/projects/safeprompt
grep SUPABASE_URL dashboard/.env.development
grep SUPABASE_URL dashboard/.env.production
```

### 4. No .env.local Files
- [ ] NO `dashboard/.env.local` exists
- [ ] NO `website/.env.local` exists
- [ ] Only `.env.local.backup` remains (for reference)

**Verify**:
```bash
cd /home/projects/safeprompt
find . -name ".env.local" ! -name "*.backup" ! -path "*/node_modules/*"
# Should return EMPTY or only website/.env.local
```

### 5. Dashboard Database Connection

**DEV Dashboard Build**:
- [ ] Build uses .env.development
- [ ] Deployed to dev-dashboard.safeprompt.dev
- [ ] Connects to DEV database (vkyggknknyfallmnrmfu)
- [ ] Can login as ian.ho@rebootmedia.net

**PROD Dashboard Build**:
- [ ] Build uses .env.production
- [ ] Deployed to dashboard.safeprompt.dev
- [ ] Connects to PROD database (adyfhzbcsqzgqvyimycv)
- [ ] Can login as real users (yuenho.8@gmail.com, etc)

**Verify Deployed Build**:
```bash
# Check what database the deployed dashboard is using
curl -s https://dashboard.safeprompt.dev/_next/static/chunks/*.js | grep -o 'adyfhzbcsqzgqvyimycv' | head -1
# Should return: adyfhzbcsqzgqvyimycv (PROD database)

curl -s https://dev-dashboard.safeprompt.dev/_next/static/chunks/*.js | grep -o 'vkyggknknyfallmnrmfu' | head -1
# Should return: vkyggknknyfallmnrmfu (DEV database)
```

---

## 🚀 Deployment Process

### 6. Dashboard Deployment

**DEV Deployment**:
- [ ] Build command: `npm run build` (uses .env.development)
- [ ] Deploy to Cloudflare Pages: dev-dashboard project
- [ ] URL: https://dev-dashboard.safeprompt.dev
- [ ] Verify database: DEV

**PROD Deployment**:
- [ ] Build command: `npm run build` (uses .env.production)
- [ ] Deploy to Cloudflare Pages: dashboard project
- [ ] URL: https://dashboard.safeprompt.dev
- [ ] Verify database: PROD

**Deploy Commands**:
```bash
cd /home/projects/safeprompt/dashboard
source /home/projects/.env && export CLOUDFLARE_API_TOKEN

# DEV
wrangler pages deploy out --project-name safeprompt-dashboard-dev

# PROD
wrangler pages deploy out --project-name safeprompt-dashboard
```

### 7. Website Deployment

**DEV Deployment**:
- [ ] Build command: `npm run build` (uses .env.development)
- [ ] Deploy to Cloudflare Pages: website-dev project
- [ ] URL: https://dev.safeprompt.dev

**PROD Deployment**:
- [ ] Build command: `npm run build` (uses .env.production)
- [ ] Deploy to Cloudflare Pages: website project
- [ ] URL: https://safeprompt.dev

---

## 🔑 Environment Variables Location

### Centralized Secrets
**Location**: `/home/projects/.env` (outside git)

**Contains**:
- ✅ RESEND_API_KEY
- ✅ SUPABASE_ACCESS_TOKEN
- ✅ CLOUDFLARE_API_TOKEN
- ✅ GITHUB_PAT
- ✅ All org-level secrets

**Project-Level** (in git as .env.example, actual files ignored):
- Dashboard: Supabase URLs, Stripe keys (per environment)
- Website: Public URLs, Stripe public keys (per environment)

---

## ✅ Quick Verification Script

Run this to verify everything:

```bash
#!/bin/bash
cd /home/projects/safeprompt

echo "=== GIT REPO CHECK ==="
git remote -v | grep safeprompt-internal && echo "✅ Correct repo" || echo "❌ Wrong repo!"

echo ""
echo "=== ENV FILES CHECK ==="
[ -f dashboard/.env.local ] && echo "❌ dashboard/.env.local exists!" || echo "✅ No .env.local"
[ -f dashboard/.env.development ] && echo "✅ DEV env exists" || echo "❌ Missing DEV env"
[ -f dashboard/.env.production ] && echo "✅ PROD env exists" || echo "❌ Missing PROD env"

echo ""
echo "=== DATABASE CONFIG CHECK ==="
grep "vkyggknknyfallmnrmfu" dashboard/.env.development > /dev/null && echo "✅ DEV uses DEV database" || echo "❌ DEV config wrong"
grep "adyfhzbcsqzgqvyimycv" dashboard/.env.production > /dev/null && echo "✅ PROD uses PROD database" || echo "❌ PROD config wrong"

echo ""
echo "=== EMAIL SCRIPT CHECK ==="
node scripts/apply-email-templates.js

echo ""
echo "=== RESEND KEY CHECK ==="
source /home/projects/.env
[ -n "$RESEND_API_KEY" ] && echo "✅ Resend key loaded" || echo "❌ Resend key missing"
```

---

## 🚨 CRITICAL ISSUES TO FIX

1. [ ] **Test password reset in DEV** (send email to ian.ho@rebootmedia.net)
2. [ ] **Test password reset in PROD** (send email to test account)
3. [ ] **Verify dashboard connects to correct databases** (check deployed builds)
4. [ ] **Remove website/.env.local** (only dashboard should have none)
5. [ ] **Run apply-email-templates.js** to confirm SMTP works
6. [ ] **Deploy dashboard to DEV and PROD** to test full flow
7. [ ] **Add git repo warning to CLAUDE.md**

---

## 📝 Git Repository Warning (ADD TO CLAUDE.MD)

```markdown
## 🚨 CRITICAL: Git Repository Separation

### Repository Structure
- **safeprompt** (PUBLIC): https://github.com/ianreboot/safeprompt
  - Purpose: NPM package distribution ONLY
  - Visibility: PUBLIC ⚠️
  - NEVER push application code here
  - Only contains: package.json, README.md, src/ (SDK code)

- **safeprompt-internal** (PRIVATE): https://github.com/ianreboot/safeprompt-internal
  - Purpose: Full application (dashboard, website, API, scripts)
  - Visibility: PRIVATE ✅
  - ALL development work happens here
  - Local repo remote points here: `git remote -v`

### MANDATORY Git Workflow
**ALWAYS verify repo before pushing:**
```bash
git remote -v  # Should show: safeprompt-internal
git push origin dev  # Pushes to PRIVATE repo ✅
```

**NEVER do this:**
```bash
# ❌ WRONG - pushes to PUBLIC repo
git push https://github.com/ianreboot/safeprompt.git
```

### Emergency: Pushed to Wrong Repo
If code accidentally pushed to PUBLIC safeprompt repo:
1. Delete branch immediately: `gh api -X DELETE repos/ianreboot/safeprompt/git/refs/heads/BRANCH`
2. Force push to correct internal repo
3. Verify public repo only has `main` branch
```
