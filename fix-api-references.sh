#!/bin/bash

# Fix API references after consolidation
echo "Fixing API endpoint references after consolidation..."

# Fix website components
echo "Updating website components..."
sed -i 's|https://api.safeprompt.dev/v1/check|https://api.safeprompt.dev/api/v1/validate|g' \
  /home/projects/safeprompt/website/components/CodeSelector.tsx \
  /home/projects/safeprompt/website/components/CodeDemo.tsx

# Fix dashboard
echo "Updating dashboard..."
sed -i 's|https://api.safeprompt.dev/v1/check|https://api.safeprompt.dev/api/v1/validate|g' \
  /home/projects/safeprompt/dashboard/src/app/page.tsx

sed -i 's|https://api.safeprompt.dev/api/v1/batch-check|https://api.safeprompt.dev/api/v1/validate|g' \
  /home/projects/safeprompt/dashboard/src/app/page.tsx

# Fix documentation
echo "Updating documentation..."
sed -i 's|https://api.safeprompt.dev/v1/check|https://api.safeprompt.dev/api/v1/validate|g' \
  /home/projects/safeprompt/docs/API.md \
  /home/projects/safeprompt/README.md

# Fix monitoring scripts
echo "Updating monitoring scripts..."
sed -i 's|https://api.safeprompt.dev/api/v1/check|https://api.safeprompt.dev/api/v1/validate|g' \
  /home/projects/safeprompt/startup-monitor.sh \
  /home/projects/safeprompt/simple-health-check.js

# Fix Stripe webhook reference
echo "Updating Stripe webhook reference..."
sed -i 's|https://api.safeprompt.dev/api/v1/stripe-webhook|https://api.safeprompt.dev/api/webhooks?source=stripe|g' \
  /home/projects/safeprompt/api/scripts/setup-stripe-webhook.js

# Fix main website page
echo "Updating main website page..."
sed -i 's|https://api.safeprompt.dev/api/v1/check|https://api.safeprompt.dev/api/v1/validate|g' \
  /home/projects/safeprompt/website/app/page.tsx

echo "Done! API references updated."
echo ""
echo "Summary of changes:"
echo "- /v1/check → /api/v1/validate"
echo "- /api/v1/check → /api/v1/validate"
echo "- /api/v1/batch-check → /api/v1/validate (with prompts array)"
echo "- /api/v1/stripe-webhook → /api/webhooks?source=stripe"