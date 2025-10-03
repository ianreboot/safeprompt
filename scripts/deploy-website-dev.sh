#!/bin/bash
# Deploy Website to DEV environment

set -e

echo "🔧 Building Website for DEV environment..."
cd /home/projects/safeprompt/website

# Backup production env and use development env for build
cp .env.production .env.production.backup
cp .env.development .env.production

# Build
npm run build

# Restore production env
mv .env.production.backup .env.production

# Deploy to Cloudflare Pages DEV project
echo "🚀 Deploying to dev.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dev --branch dev

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dev.safeprompt.dev"
