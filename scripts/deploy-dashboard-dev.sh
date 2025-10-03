#!/bin/bash
# Deploy Dashboard to DEV environment

set -e

echo "🔧 Building Dashboard for DEV environment..."
cd /home/projects/safeprompt/dashboard

# Backup production env and use development env for build
cp .env.production .env.production.backup
cp .env.development .env.production

# Build
npm run build

# Restore production env
mv .env.production.backup .env.production

# Deploy to Cloudflare Pages DEV project
echo "🚀 Deploying to dev-dashboard.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch dev

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dev-dashboard.safeprompt.dev"
