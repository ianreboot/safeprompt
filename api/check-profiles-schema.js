import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adyfhzbcsqzgqvyimycv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeWZoemJjc3F6Z3F2eWlteWN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQyNTczMywiZXhwIjoyMDc1MDAxNzMzfQ.rB81thWdamalQlEo4Lur0OrtyMwgXXEFi2mmwvkAAkw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking profiles table schema...\n');
  
  // Get a sample profile to see the structure
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Profiles table columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\nSample profile:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️ No profiles found');
  }
}

checkSchema();
