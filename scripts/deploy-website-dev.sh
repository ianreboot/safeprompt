#!/bin/bash
# Deploy Website to DEV environment

set -e

echo "🔧 Building Website for DEV environment..."
cd /home/projects/safeprompt/website

# Load DEV environment variables
export $(grep -v '^#' .env.development | xargs)

# Build
npm run build

# Deploy to Cloudflare Pages DEV project
echo "🚀 Deploying to dev.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dev --branch dev

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dev.safeprompt.dev"
