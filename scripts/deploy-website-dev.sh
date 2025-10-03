#!/bin/bash
# Deploy Website to DEV environment
# NOTE: safeprompt-dev project's production_branch is set to "main"
# Deploying to main branch creates Production deployments that serve dev.safeprompt.dev

set -e

echo "🔧 Building Website for DEV environment..."
cd /home/projects/safeprompt/website

# Backup production env and use development env for build
cp .env.production .env.production.backup
cp .env.development .env.production

# Build with dev environment variables
npm run build

# Restore production env
mv .env.production.backup .env.production

# Deploy to Cloudflare Pages DEV project (main branch = production)
echo "🚀 Deploying to dev.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dev --branch main --commit-dirty=true

# Purge Cloudflare cache to ensure changes are visible
echo "🗑️  Purging Cloudflare cache..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/d52a2b2821d830af1c9ace4cdc407a9f/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}' -s > /dev/null

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dev.safeprompt.dev"
echo "💡 Changes may take 1-2 minutes to fully propagate due to CDN caching"
