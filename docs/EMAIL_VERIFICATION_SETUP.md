# Email Verification Setup Guide

## Overview
This guide configures branded email verification for SafePrompt free tier users on both DEV and PROD environments.

## ✅ Implementation Status

**Date**: 2025-10-04
**Status**: PARTIALLY CONFIGURED (Manual steps remaining)

**Automated Configuration Completed:**
- ✅ Site URLs configured via `scripts/configure-redirect-urls.js`
- ✅ Email templates applied via `scripts/apply-email-templates.js`
- ✅ SMTP configuration (Resend) applied
- ✅ Redirect URLs whitelist configured

**Manual Steps Remaining:**
- ⚠️ Enable "Confirm email" toggle in Supabase Dashboard (CRITICAL - cannot be automated)
- ⚠️ Enable "Double confirm email changes" toggle (recommended)

## Configuration Steps

### 1. Enable Email Confirmation (CRITICAL - MANUAL STEP REQUIRED)

**⚠️ THIS STEP CANNOT BE AUTOMATED - MUST BE DONE MANUALLY**

**For both PROD and DEV Supabase projects:**

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Email" provider
3. **Enable**: "Confirm email" toggle ✅
4. **Set**: "Double confirm email changes" ✅ (optional but recommended)

**Direct links:**
- PROD: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/auth/providers
- DEV: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/auth/providers

**Why manual?** The Supabase Management API does not expose the email confirmation toggle setting. This must be enabled through the web dashboard.

### 2. Configure Site URLs (✅ AUTOMATED)

**Status**: ✅ Configured automatically via `scripts/configure-redirect-urls.js`

**PROD Configuration:**
```
Site URL: https://dashboard.safeprompt.dev

Redirect URLs:
- https://dashboard.safeprompt.dev/**
- https://dashboard.safeprompt.dev/confirm
- https://dashboard.safeprompt.dev/reset-password
```

**DEV Configuration:**
```
Site URL: https://dev-dashboard.safeprompt.dev

Redirect URLs:
- https://dev-dashboard.safeprompt.dev/**
- https://dev-dashboard.safeprompt.dev/confirm
- https://dev-dashboard.safeprompt.dev/reset-password
```

**Verify configuration:**
- PROD: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/auth/url-configuration
- DEV: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/auth/url-configuration

**To re-apply:** `node scripts/configure-redirect-urls.js`

### 3. Apply Branded Email Templates (✅ AUTOMATED)

**Status**: ✅ Configured automatically via `scripts/apply-email-templates.js`

This script applies:
- Branded signup confirmation email template
- Branded password reset email template
- Resend SMTP configuration
- Email sender: SafePrompt <noreply@safeprompt.dev>

**Verify configuration:**
- PROD: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/auth/templates
- DEV: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/auth/templates

**To re-apply:** `node scripts/apply-email-templates.js`

#### Confirm Signup Template

**Subject:**
```
Confirm your SafePrompt account
```

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 32px; font-weight: 600; margin: 0;">SafePrompt</h1>
      <p style="color: #888888; font-size: 14px; margin-top: 8px;">Stop users from hijacking your AI</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #111111; border: 1px solid #222222; border-radius: 12px; padding: 40px;">
      <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Welcome to SafePrompt! 🎉</h2>

      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Thanks for signing up! Click the button below to confirm your email address and access your dashboard.
      </p>

      <!-- Confirm Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
          Confirm Email
        </a>
      </div>

      <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
      </p>

      <!-- Fallback URL -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #222222;">
        <p style="color: #666666; font-size: 12px; margin: 0 0 8px 0;">
          Or copy and paste this URL into your browser:
        </p>
        <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 0;">
          {{ .ConfirmationURL }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #666666; font-size: 12px; margin: 0 0 8px 0;">
        SafePrompt - Prompt Injection Protection
      </p>
      <p style="color: #444444; font-size: 12px; margin: 0;">
        © 2025 SafePrompt. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

**Text Body:**
```
Welcome to SafePrompt!

Thanks for signing up! Click this link to confirm your email address:
{{ .ConfirmationURL }}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

---
SafePrompt - Prompt Injection Protection
© 2025 SafePrompt. All rights reserved.
```

## Verification Checklist

### PROD Verification
- [ ] Email confirmation enabled in Auth settings
- [ ] Site URL set to `https://dashboard.safeprompt.dev`
- [ ] Redirect URLs configured (dashboard.safeprompt.dev/**)
- [ ] Confirm signup template applied with branded HTML
- [ ] Test signup flow:
  1. Sign up at https://safeprompt.dev/signup?plan=free
  2. Check email for branded confirmation
  3. Click confirm link
  4. Verify redirect to https://dashboard.safeprompt.dev/confirm
  5. Confirm waitlist addition

### DEV Verification
- [ ] Email confirmation enabled in Auth settings
- [ ] Site URL set to `https://dev-dashboard.safeprompt.dev`
- [ ] Redirect URLs configured (dev-dashboard.safeprompt.dev/**)
- [ ] Confirm signup template applied with branded HTML
- [ ] Test signup flow:
  1. Sign up at dev environment
  2. Check email for branded confirmation
  3. Click confirm link
  4. Verify redirect to https://dev-dashboard.safeprompt.dev/confirm

## Testing Commands

```bash
# Test email template rendering
node scripts/configure-auth-emails.js

# Verify auth settings via API
node scripts/verify-email-config.js
```

## Free Tier Flow

1. User signs up with email/password (plan=free)
2. Supabase sends branded confirmation email
3. User clicks confirmation link
4. Dashboard /confirm page handles verification
5. User added to waitlist
6. Success message displayed: "You're on the list!"

## Paid Tier Flow (For Reference)

1. User signs up with email/password (plan=paid)
2. User completes Stripe checkout
3. Webhook auto-confirms email (payment validates identity)
4. User receives welcome email with API key
5. Dashboard access granted immediately

## Important Notes

- **Free users MUST verify email** before getting waitlist access
- **Paid users auto-confirmed** after successful payment
- **Email templates use Supabase Go syntax**: `{{ .ConfirmationURL }}`
- **Confirmation links expire** in 24 hours
- **Site URLs must be HTTPS** (not HTTP)

## Troubleshooting

**Email not received:**
1. Check Supabase logs: Authentication → Logs
2. Verify SMTP configuration (default Supabase or custom Resend)
3. Check spam folder
4. Verify email provider allows auth emails

**Confirmation link broken:**
1. Verify Site URL is HTTPS
2. Check redirect URLs include `/confirm` path
3. Verify dashboard /confirm page is deployed
4. Check browser console for errors

**Users not added to waitlist:**
1. Check API logs for waitlist endpoint
2. Verify /confirm page calls waitlist API
3. Check Supabase RLS policies on waitlist table
