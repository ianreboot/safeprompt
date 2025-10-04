#!/usr/bin/env node
/**
 * Add missing environment variables to Vercel safeprompt-api project
 */
import { Vercel } from '@vercel/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

const projectName = 'safeprompt-api';

async function addEnvironmentVariables() {
  console.log('🔧 Adding environment variables to Vercel project:', projectName);
  console.log('');

  try {
    // Add Supabase environment variables for production
    const addResponse = await vercel.projects.createProjectEnv({
      idOrName: projectName,
      upsert: 'true',
      requestBody: [
        {
          key: 'SAFEPROMPT_PROD_SUPABASE_URL',
          value: process.env.SAFEPROMPT_PROD_SUPABASE_URL,
          target: ['production'],
          type: 'encrypted',
        },
        {
          key: 'SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY',
          value: process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY,
          target: ['production'],
          type: 'encrypted',
        },
        {
          key: 'SAFEPROMPT_SUPABASE_URL',
          value: process.env.SAFEPROMPT_SUPABASE_URL,
          target: ['preview', 'development'],
          type: 'encrypted',
        },
        {
          key: 'SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY',
          value: process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY,
          target: ['preview', 'development'],
          type: 'encrypted',
        },
      ],
    });

    console.log('✅ Environment variables added successfully!');
    console.log('');
    console.log('Created:', JSON.stringify(addResponse.created, null, 2));

    if (addResponse.failed && addResponse.failed.length > 0) {
      console.log('');
      console.log('⚠️  Some variables failed:');
      addResponse.failed.forEach(f => {
        console.log('  -', f.error?.message || 'Unknown error');
      });
    }

    console.log('');
    console.log('Next step: Redeploy the project for changes to take effect');
    console.log('  cd /home/projects/safeprompt/api');
    console.log('  vercel --prod');

  } catch (error) {
    console.error('❌ Error adding environment variables:');
    console.error(error.message);
    if (error.body) {
      console.error('Response:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

addEnvironmentVariables();
