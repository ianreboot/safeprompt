import dotenv from 'dotenv';
dotenv.config({ path: '/home/projects/.env' });

const PROJECT_ID = 'prj_vEUOowUKqyUzHVH8v56iMoHBatLe';

async function checkEnvironmentVariables() {
  console.log('Checking Vercel environment variables...\n');

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
        }
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Found environment variables:\n');

      const supabaseVars = result.envs.filter(env =>
        env.key.includes('SUPABASE')
      );

      if (supabaseVars.length > 0) {
        supabaseVars.forEach(env => {
          console.log(`Key: ${env.key}`);
          console.log(`  Type: ${env.type}`);
          console.log(`  Targets: ${env.target.join(', ')}`);
          console.log(`  Created: ${new Date(env.createdAt).toISOString()}`);
          console.log(`  Value: ${env.type === 'encrypted' ? '[ENCRYPTED]' : env.value}`);
          console.log();
        });
      } else {
        console.log('⚠️  No Supabase-related environment variables found!');
      }

      console.log(`\nTotal environment variables: ${result.envs.length}`);
    } else {
      console.log('❌ Failed to retrieve environment variables');
      console.log('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEnvironmentVariables();