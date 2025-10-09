#!/usr/bin/env node
/**
 * Fetch runtime logs from PROD API deployment
 */
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const DEPLOYMENT_URL = 'safeprompt-joo756923-ian-hos-projects.vercel.app';
const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_b0nTXs7q9e2SfpG7M3JJ8Pf9rQz5'; // from .vercel/project.json

async function fetchRuntimeLogs() {
  console.log('🔍 Fetching runtime logs from PROD deployment...\n');
  console.log(`Deployment: ${DEPLOYMENT_URL}`);
  console.log(`Project ID: ${PROJECT_ID}\n`);

  // Fetch deployment events using Vercel REST API
  const response = await fetch(
    `https://api.vercel.com/v3/deployments/${DEPLOYMENT_URL}/events?limit=100&direction=backward`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    }
  );

  if (!response.ok) {
    console.error('❌ Failed to fetch logs:', response.status, response.statusText);
    const text = await response.text();
    console.error('Response:', text);
    process.exit(1);
  }

  const logs = await response.json();

  console.log(`📊 Found ${Array.isArray(logs) ? logs.length : 0} log entries\n`);

  if (Array.isArray(logs)) {
    // Filter for errors and warnings
    const errors = logs.filter(log => log.type === 'error');
    const warnings = logs.filter(log => log.type === 'warning');

    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('='.repeat(60));
      console.log('ERROR LOGS:');
      console.log('='.repeat(60));
      errors.forEach((error, i) => {
        console.log(`\n[${i + 1}] ${new Date(error.created).toISOString()}`);
        console.log(`Text: ${error.text}`);
        if (error.info) console.log(`Info:`, error.info);
      });
    }

    if (warnings.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('WARNING LOGS:');
      console.log('='.repeat(60));
      warnings.forEach((warn, i) => {
        console.log(`\n[${i + 1}] ${new Date(warn.created).toISOString()}`);
        console.log(`Text: ${warn.text}`);
      });
    }

    // Show all recent logs for context
    console.log('\n' + '='.repeat(60));
    console.log('RECENT LOGS (last 20):');
    console.log('='.repeat(60));
    logs.slice(0, 20).forEach((log, i) => {
      if (log.text) {
        console.log(`\n[${i + 1}] ${log.type || 'log'} - ${new Date(log.created).toISOString()}`);
        console.log(`${log.text}`);
      }
    });
  }
}

fetchRuntimeLogs().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
