import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SQL_FILE = '/tmp/setup_safeprompt_db.sql';

console.log('🔧 Executing SQL via Supabase Management API...\n');

async function executeSql() {
  try {
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    
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
    const body = await response.text();
    
    console.log('HTTP Status:', statusCode);
    console.log('Response:', body);
    
    if (statusCode === 200 || statusCode === 201) {
      console.log('\n✅ SQL executed successfully!');
    } else {
      console.log('\n❌ SQL execution failed');
      console.log('Status:', statusCode);
      console.log('Body:', body);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

executeSql();
