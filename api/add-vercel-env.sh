#!/bin/bash
# Add environment variables to Vercel safeprompt-api project

TOKEN="gxY3ZjYzBtWrDSxsmdT3ARpE"

# Add OPENROUTER_API_KEY
echo "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" | vercel --token $TOKEN env add OPENROUTER_API_KEY production

# Add SAFEPROMPT_SUPABASE_URL
echo "https://vkyggknknyfallmnrmfu.supabase.co" | vercel --token $TOKEN env add SAFEPROMPT_SUPABASE_URL production

# Add SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreWdna25rbnlmYWxsbW5ybWZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY0NzMxNywiZXhwIjoyMDc0MjIzMzE3fQ.xgHI9Nn8OseLsQ448-MwCH_FF2zmS0ns3s5UlEP5l-Q" | vercel --token $TOKEN env add SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY production

echo "Environment variables added successfully!"
