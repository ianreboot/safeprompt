#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ path: '/home/projects/.env' });

const PROJECT_ID = 'prj_vEUOowUKqyUzHVH8v56iMoHBatLe';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const PRODUCTION_ENV_VARS = [
  // Supabase Production
  { key: 'SAFEPROMPT_PROD_SUPABASE_URL', value: process.env.SAFEPROMPT_PROD_SUPABASE_URL },
  { key: 'SAFEPROMPT_PROD_SUPABASE_ANON_KEY', value: process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY },
  { key: 'SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY', value: process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY },

  // Stripe Production
  { key: 'STRIPE_PROD_SECRET_KEY', value: process.env.STRIPE_PROD_SECRET_KEY },
  { key: 'STRIPE_PROD_PUBLISHABLE_KEY', value: process.env.STRIPE_PROD_PUBLISHABLE_KEY },
  { key: 'STRIPE_PROD_WEBHOOK_SECRET', value: process.env.STRIPE_PROD_WEBHOOK_SECRET },
  { key: 'STRIPE_PROD_BETA_PRICE_ID', value: process.env.STRIPE_PROD_BETA_PRICE_ID },
  { key: 'STRIPE_PROD_STARTER_PRICE_ID', value: process.env.STRIPE_PROD_STARTER_PRICE_ID },
  { key: 'STRIPE_PROD_BUSINESS_PRICE_ID', value: process.env.STRIPE_PROD_BUSINESS_PRICE_ID },
];

async function addEnvironmentVariable(key, value, target = ['production']) {
  try {
    const response = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target
        })
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Added ${key} to ${target.join(', ')}`);
      return true;
    } else {
      if (result.error && result.error.code === 'ENV_ALREADY_EXISTS') {
        console.log(`⚠️  ${key} already exists, skipping...`);
        return true;
      }
      console.log(`❌ Failed to add ${key}`);
      console.log('Error:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`Error adding ${key}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Adding production environment variables to Vercel API\n');

  for (const envVar of PRODUCTION_ENV_VARS) {
    if (!envVar.value) {
      console.log(`⚠️  Skipping ${envVar.key} - no value found in .env`);
      continue;
    }
    await addEnvironmentVariable(envVar.key, envVar.value);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ Finished adding production environment variables');
}

main().catch(console.error);
