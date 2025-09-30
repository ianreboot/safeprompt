import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SQL_FILE = '/tmp/setup_profiles_only.sql';

console.log('🔧 Executing profiles setup SQL via Supabase Management API...\n');

async function executeSql() {
  try {
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    
    console.log('Sending request...');
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sqlContent })
      }
    );
    
    const statusCode = response.status;
    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    
    console.log('HTTP Status:', statusCode);
    console.log('Response:', JSON.stringify(body, null, 2));
    
    if (statusCode === 200 || statusCode === 201) {
      console.log('\n✅ DATABASE SETUP COMPLETE!');
      console.log('   - Profiles table created');
      console.log('   - API logs table created');
      console.log('   - Triggers and RLS policies set up');
      console.log('   - ian.ho@rebootmedia.net profile configured');
    } else {
      console.log('\n❌ SQL execution failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

executeSql();
