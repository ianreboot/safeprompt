import dotenv from 'dotenv';
dotenv.config({ path: '/home/projects/.env' });

const SUPABASE_PROJECT_REF = 'vkyggknknyfallmnrmfu';

async function addInsertPolicy() {
  console.log('Adding INSERT policy to api_logs table...\n');

  const sql = `
    -- Drop policy if exists, then recreate
    DROP POLICY IF EXISTS "API can insert logs" ON api_logs;

    -- Allow service role and authenticated users to insert logs
    CREATE POLICY "API can insert logs" ON api_logs
      FOR INSERT WITH CHECK (true);
  `;

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (response.ok) {
      console.log('✅ INSERT policy added successfully');
      console.log('   Policy: "API can insert logs" - allows all inserts');
    } else {
      const error = await response.text();
      console.log('❌ Failed to add policy');
      console.log('   Response:', error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addInsertPolicy();