#!/bin/bash
# Deploy Dashboard to DEV environment

set -e

echo "🔧 Building Dashboard for DEV environment..."
cd /home/projects/safeprompt/dashboard

# Load DEV environment variables
export $(grep -v '^#' .env.development | xargs)

# Build
npm run build

# Deploy to Cloudflare Pages DEV project
echo "🚀 Deploying to dev-dashboard.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch dev

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dev-dashboard.safeprompt.dev"
