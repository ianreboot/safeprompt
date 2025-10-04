#!/bin/bash
# Deploy Dashboard to DEV environment
#
# Environment variables are set via export before building
# This overrides .env.production values during the build process

set -e

echo "🔧 Building Dashboard for DEV environment..."
cd /home/projects/safeprompt/dashboard

# Export DEV environment variables (these override .env.production)
export NEXT_PUBLIC_SUPABASE_URL=https://vkyggknknyfallmnrmfu.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreWdna25rbnlmYWxsbW5ybWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDczMTcsImV4cCI6MjA3NDIyMzMxN30.yC2lRuZI4hYWpeT4rJW67zYc8A-kg7hp8NossOKnRlo
export NEXT_PUBLIC_DASHBOARD_URL=https://dev-dashboard.safeprompt.dev
export NEXT_PUBLIC_WEBSITE_URL=https://dev.safeprompt.dev
export NEXT_PUBLIC_APP_URL=https://dev-dashboard.safeprompt.dev
export NEXT_PUBLIC_API_URL=https://dev-api.safeprompt.dev

# Build with exported DEV environment variables
npm run build

# Deploy to Cloudflare Pages DEV project
# production_branch=main, so deploying to main creates Production deployments
echo "🚀 Deploying to dev-dashboard.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch main --commit-dirty=true

# Purge Cloudflare cache to ensure changes are visible immediately
echo "🗑️  Purging Cloudflare cache..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/d52a2b2821d830af1c9ace4cdc407a9f/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}' -s > /dev/null

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dev-dashboard.safeprompt.dev"
echo "💡 Changes may take 1-2 minutes to fully propagate due to CDN caching"
