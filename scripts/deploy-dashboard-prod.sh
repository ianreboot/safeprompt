#!/bin/bash
# Deploy Dashboard to PROD environment

set -e

echo "🔧 Building Dashboard for PROD environment..."
cd /home/projects/safeprompt/dashboard

# Load PROD environment variables
export $(grep -v '^#' .env.production | xargs)

# Build
npm run build

# Deploy to Cloudflare Pages PROD project
echo "🚀 Deploying to dashboard.safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dashboard --branch main

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dashboard.safeprompt.dev"
