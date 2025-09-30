import dotenv from 'dotenv';
dotenv.config({ path: '/home/projects/.env' });

const PROJECT_ID = 'prj_vEUOowUKqyUzHVH8v56iMoHBatLe';

async function addEnvironmentVariables() {
  console.log('Adding Supabase environment variables to Vercel...\n');

  const envVars = [
    {
      key: 'SAFEPROMPT_SUPABASE_URL',
      value: process.env.SAFEPROMPT_SUPABASE_URL,
      target: ['production', 'preview', 'development'],
      type: 'encrypted'
    },
    {
      key: 'SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY',
      value: process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY,
      target: ['production', 'preview', 'development'],
      type: 'encrypted'
    }
  ];

  try {
    const response = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envVars)
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Environment variables added successfully!');
      if (result.created) {
        console.log('\nCreated variables:');
        result.created.forEach(env => {
          console.log(`  - ${env.key} (${env.type}, targets: ${env.target.join(', ')})`);
        });
      }
      if (result.failed && result.failed.length > 0) {
        console.log('\n⚠️  Some variables failed:');
        result.failed.forEach(fail => {
          console.log(`  - ${fail.error.key}: ${fail.error.message}`);
        });
      }
    } else {
      console.log('❌ Failed to add environment variables');
      console.log('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addEnvironmentVariables();