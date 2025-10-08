import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../dashboard/.env.development') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking api_keys:', error.message)
    console.log('api_keys table may not exist')
    return
  }

  if (data && data.length > 0) {
    console.log('api_keys table columns:')
    console.log(Object.keys(data[0]).join('\n'))
  } else {
    console.log('No API keys found, but table exists')
  }
}

checkSchema()
