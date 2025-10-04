#!/bin/bash
# Add environment variables to Vercel safeprompt-api project

TOKEN="gxY3ZjYzBtWrDSxsmdT3ARpE"

# Add OPENROUTER_API_KEY
echo "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" | vercel --token $TOKEN env add OPENROUTER_API_KEY production

# Add SAFEPROMPT_SUPABASE_URL
echo "https://vkyggknknyfallmnrmfu.supabase.co" | vercel --token $TOKEN env add SAFEPROMPT_SUPABASE_URL production

# Add SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
echo "sb_secret_-bKaNyXZApLTr09QCexbKw_v8G00Bng" | vercel --token $TOKEN env add SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY production

echo "Environment variables added successfully!"
