#!/usr/bin/env node
/**
 * Configure Supabase Auth Redirect URLs
 *
 * WHY THIS IS NEEDED:
 * Password reset links redirect back to the dashboard after Supabase validates the token.
 * These redirect URLs MUST be whitelisted in Supabase Auth settings or the reset will fail.
 *
 * WHAT THIS CONFIGURES:
 * - site_url: Main dashboard URL
 * - uri_allow_list: All allowed redirect URLs including reset-password page
 *
 * USAGE:
 *   node scripts/configure-redirect-urls.js
 */

const https = require('https');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(os.homedir(), 'projects/.env') });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_6175a3eae85d560c40f8b9d2d38cff212415ed6f';

const projects = [
  {
    ref: 'vkyggknknyfallmnrmfu',
    env: 'DEV',
    siteUrl: 'https://dev-dashboard.safeprompt.dev',
    allowList: [
      'https://dev-dashboard.safeprompt.dev',
      'https://dev-dashboard.safeprompt.dev/**',
      'https://dev-dashboard.safeprompt.dev/reset-password',
      'https://dev-dashboard.safeprompt.dev/auth/callback',
      'http://localhost:3000',
      'http://localhost:3000/**'
    ]
  },
  {
    ref: 'adyfhzbcsqzgqvyimycv',
    env: 'PROD',
    siteUrl: 'https://dashboard.safeprompt.dev',
    allowList: [
      'https://dashboard.safeprompt.dev',
      'https://dashboard.safeprompt.dev/**',
      'https://dashboard.safeprompt.dev/reset-password',
      'https://dashboard.safeprompt.dev/auth/callback'
    ]
  }
];

function configureRedirects(projectRef, environment, siteUrl, allowList) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      site_url: siteUrl,
      uri_allow_list: allowList.join(',')
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
          console.log(`✅ ${environment}: Redirect URLs configured successfully`);
          console.log(`   Site URL: ${data.site_url}`);
          console.log(`   Allowed URLs: ${data.uri_allow_list}`);
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
  console.log('CONFIGURING SUPABASE AUTH REDIRECT URLs');
  console.log('═'.repeat(80));
  console.log('');

  for (const project of projects) {
    try {
      await configureRedirects(project.ref, project.env, project.siteUrl, project.allowList);
      console.log('');
    } catch (error) {
      console.error(`Error configuring ${project.env}:`, error.message);
      process.exit(1);
    }
  }

  console.log('═'.repeat(80));
  console.log('✅ REDIRECT URLs CONFIGURED SUCCESSFULLY');
  console.log('═'.repeat(80));
  console.log('');
  console.log('What was configured:');
  console.log('✅ DEV site URL: https://dev-dashboard.safeprompt.dev');
  console.log('✅ PROD site URL: https://dashboard.safeprompt.dev');
  console.log('✅ Password reset redirects enabled for both environments');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test password reset in DEV: https://dev-dashboard.safeprompt.dev/forgot-password');
  console.log('2. Test password reset in PROD: https://dashboard.safeprompt.dev/forgot-password');
  console.log('3. Verify reset links now work correctly');
  console.log('');
}

main();
