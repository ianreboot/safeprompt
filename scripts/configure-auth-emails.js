#!/usr/bin/env node
/**
 * Configure Supabase Auth Email Templates
 *
 * This script provides branded email templates for password reset and other auth emails.
 *
 * Site URL Configuration:
 * - PROD: https://dashboard.safeprompt.dev (NOT http - must be HTTPS)
 * - DEV: https://dev-dashboard.safeprompt.dev (NOT http)
 *
 * Email templates can be configured via:
 * 1. Supabase Dashboard: Authentication > Email Templates
 * 2. This script outputs the templates to copy/paste
 */

const passwordResetTemplate = {
  subject: 'Reset your SafePrompt password',
  body_html: `
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
      <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Reset your password</h2>

      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We received a request to reset your SafePrompt account password. Click the button below to create a new password.
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
          Reset Password
        </a>
      </div>

      <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
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
  `,
  body_text: `Reset your SafePrompt password

We received a request to reset your SafePrompt account password.

Click this link to create a new password:
{{ .ConfirmationURL }}

This link will expire in 24 hours.

If you didn't request a password reset, you can safely ignore this email.

---
SafePrompt - Prompt Injection Protection
© 2025 SafePrompt. All rights reserved.
  `
};

const confirmSignupTemplate = {
  subject: 'Confirm your SafePrompt account',
  body_html: `
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
  `,
  body_text: `Welcome to SafePrompt!

Thanks for signing up! Click this link to confirm your email address:
{{ .ConfirmationURL }}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

---
SafePrompt - Prompt Injection Protection
© 2025 SafePrompt. All rights reserved.
  `
};

const magicLinkTemplate = {
  subject: 'Sign in to SafePrompt',
  body_html: `
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
      <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Sign in to SafePrompt</h2>

      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Click the button below to securely sign in to your SafePrompt dashboard.
      </p>

      <!-- Sign In Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
          Sign In
        </a>
      </div>

      <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        This link will expire in 1 hour. If you didn't request this sign-in link, you can safely ignore this email.
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
  `,
  body_text: `Sign in to SafePrompt

Click this link to securely sign in to your dashboard:
{{ .ConfirmationURL }}

This link will expire in 1 hour.

If you didn't request this sign-in link, you can safely ignore this email.

---
SafePrompt - Prompt Injection Protection
© 2025 SafePrompt. All rights reserved.
  `
};

console.log('='.repeat(80));
console.log('SUPABASE AUTH EMAIL TEMPLATE CONFIGURATION');
console.log('='.repeat(80));
console.log('');

console.log('📧 SITE URL CONFIGURATION');
console.log('-'.repeat(80));
console.log('');
console.log('⚠️  IMPORTANT: Site URLs should be HTTPS, not HTTP');
console.log('');
console.log('Current (if you set HTTP):');
console.log('  PROD: http://dashboard.safeprompt.dev ❌');
console.log('  DEV:  http://dev-dashboard.safeprompt.dev ❌');
console.log('');
console.log('Correct configuration:');
console.log('  PROD: https://dashboard.safeprompt.dev ✅');
console.log('  DEV:  https://dev-dashboard.safeprompt.dev ✅');
console.log('');
console.log('To fix:');
console.log('1. Go to Supabase Dashboard → Authentication → URL Configuration');
console.log('2. Set Site URL to: https://dashboard.safeprompt.dev');
console.log('3. Add to Redirect URLs:');
console.log('   - https://dashboard.safeprompt.dev/**');
console.log('   - https://dashboard.safeprompt.dev/reset-password');
console.log('   - https://dashboard.safeprompt.dev/confirm');
console.log('');

console.log('📧 EMAIL TEMPLATES');
console.log('-'.repeat(80));
console.log('');
console.log('To configure branded email templates:');
console.log('1. Go to Supabase Dashboard → Authentication → Email Templates');
console.log('2. For each template below, click Edit and paste the content');
console.log('');

console.log('='.repeat(80));
console.log('PASSWORD RESET EMAIL');
console.log('='.repeat(80));
console.log('');
console.log('Subject:');
console.log(passwordResetTemplate.subject);
console.log('');
console.log('HTML Body:');
console.log(passwordResetTemplate.body_html);
console.log('');
console.log('Text Body:');
console.log(passwordResetTemplate.body_text);
console.log('');

console.log('='.repeat(80));
console.log('CONFIRM SIGNUP EMAIL');
console.log('='.repeat(80));
console.log('');
console.log('Subject:');
console.log(confirmSignupTemplate.subject);
console.log('');
console.log('HTML Body:');
console.log(confirmSignupTemplate.body_html);
console.log('');
console.log('Text Body:');
console.log(confirmSignupTemplate.body_text);
console.log('');

console.log('='.repeat(80));
console.log('MAGIC LINK EMAIL');
console.log('='.repeat(80));
console.log('');
console.log('Subject:');
console.log(magicLinkTemplate.subject);
console.log('');
console.log('HTML Body:');
console.log(magicLinkTemplate.body_html);
console.log('');
console.log('Text Body:');
console.log(magicLinkTemplate.body_text);
console.log('');

console.log('='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80));
console.log('');
console.log('1. ✅ Fix Site URL to use HTTPS (not HTTP)');
console.log('2. ✅ Configure email templates in Supabase Dashboard');
console.log('3. ✅ Test password reset flow');
console.log('4. ✅ Verify emails are branded and links work correctly');
console.log('');
console.log('Note: Supabase uses Go template syntax ({{ .ConfirmationURL }})');
console.log('');
