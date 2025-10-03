#!/bin/bash
# Deploy Website to PROD environment

set -e

echo "🔧 Building Website for PROD environment..."
cd /home/projects/safeprompt/website

# Load PROD environment variables
export $(grep -v '^#' .env.production | xargs)

# Build
npm run build

# Deploy to Cloudflare Pages PROD project
echo "🚀 Deploying to safeprompt.dev..."
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt --branch main

echo "✅ Deployment complete!"
echo "🌐 Live at: https://safeprompt.dev"
