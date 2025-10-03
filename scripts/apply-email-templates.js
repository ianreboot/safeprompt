#!/usr/bin/env node
/**
 * Apply Email Templates & SMTP Config to Supabase via Management API
 *
 * WHY THIS EXISTS:
 * Email templates and SMTP settings are stored in Supabase's database config, NOT in code.
 * This means they need to be reapplied whenever:
 * 1. A new Supabase project is created
 * 2. Templates/SMTP are accidentally reset/overwritten
 * 3. Branding or SMTP credentials need to be updated
 *
 * WHAT THIS CONFIGURES:
 * 1. Branded SafePrompt email templates (password reset)
 * 2. Resend SMTP for reliable email delivery
 * 3. Email sender: SafePrompt <noreply@safeprompt.dev>
 *
 * USAGE:
 *   node scripts/apply-email-templates.js
 *
 * This script applies configuration to both DEV and PROD Supabase instances.
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_6175a3eae85d560c40f8b9d2d38cff212415ed6f';

// Branded password reset template
const passwordResetTemplate = `<!DOCTYPE html>
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
</html>`;

const projects = [
  { ref: 'vkyggknknyfallmnrmfu', env: 'DEV' },
  { ref: 'adyfhzbcsqzgqvyimycv', env: 'PROD' }
];

function applyConfig(projectRef, environment) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      // Email templates
      mailer_subjects_recovery: 'Reset your SafePrompt password',
      mailer_templates_recovery_content: passwordResetTemplate,
      // SMTP configuration (Resend)
      smtp_host: 'smtp.resend.com',
      smtp_port: '587',
      smtp_user: 'resend',
      smtp_pass: 're_FPZirbgX_MQ4V1mnvF2VdKwrQgHxoQPBa',
      smtp_admin_email: 'noreply@safeprompt.dev',
      smtp_sender_name: 'SafePrompt'
    });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/config/auth`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const data = JSON.parse(body);
          console.log(`✅ ${environment}: Email config applied successfully`);
          console.log(`   Email subject: ${data.mailer_subjects_recovery}`);
          console.log(`   Template size: ${data.mailer_templates_recovery_content.length} chars`);
          console.log(`   SMTP host: ${data.smtp_host}`);
          console.log(`   SMTP sender: ${data.smtp_sender_name} <${data.smtp_admin_email}>`);
          resolve();
        } else {
          console.error(`❌ ${environment}: Failed (${res.statusCode})`);
          console.error(body);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ${environment}: Request failed`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('═'.repeat(80));
  console.log('APPLYING EMAIL TEMPLATES & SMTP CONFIG TO SUPABASE');
  console.log('═'.repeat(80));
  console.log('');

  for (const project of projects) {
    try {
      await applyConfig(project.ref, project.env);
      console.log('');
    } catch (error) {
      console.error(`Error applying config to ${project.env}:`, error.message);
      process.exit(1);
    }
  }

  console.log('═'.repeat(80));
  console.log('✅ ALL EMAIL CONFIGS APPLIED SUCCESSFULLY');
  console.log('═'.repeat(80));
  console.log('');
  console.log('What was configured:');
  console.log('✅ Branded SafePrompt email templates (password reset)');
  console.log('✅ Resend SMTP for reliable email delivery');
  console.log('✅ Sender: SafePrompt <noreply@safeprompt.dev>');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test password reset in DEV: https://dev-dashboard.safeprompt.dev/forgot-password');
  console.log('2. Test password reset in PROD: https://dashboard.safeprompt.dev/forgot-password');
  console.log('3. Verify branded emails are received from SafePrompt');
  console.log('');
}

main();
