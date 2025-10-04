#!/usr/bin/env node
/**
 * Update production environment variables with correct PROD database credentials
 */
import { Vercel } from '@vercel/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

const projectName = 'safeprompt-api';

async function updateEnvironmentVariables() {
  console.log('🔧 Updating PROD environment variables for:', projectName);
  console.log('');

  try {
    // Update with correct PROD database credentials
    const response = await vercel.projects.createProjectEnv({
      idOrName: projectName,
      upsert: 'true',  // This will update if exists, create if not
      requestBody: [
        {
          key: 'SAFEPROMPT_SUPABASE_URL',
          value: process.env.SAFEPROMPT_PROD_SUPABASE_URL,
          target: ['production'],
          type: 'encrypted',
        },
        {
          key: 'SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY',
          value: process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY,
          target: ['production'],
          type: 'encrypted',
        },
      ],
    });

    console.log('✅ Environment variables updated successfully!');
    console.log('');
    console.log('Updated:');
    console.log('  - SAFEPROMPT_SUPABASE_URL → PROD database');
    console.log('  - SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY → PROD key');
    console.log('');
    console.log('Next step: Redeploy for changes to take effect');
    console.log('  cd /home/projects/safeprompt/api');
    console.log('  vercel --prod');

  } catch (error) {
    console.error('❌ Error updating environment variables:');
    console.error(error.message);
    if (error.body) {
      console.error('Response:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

updateEnvironmentVariables();
