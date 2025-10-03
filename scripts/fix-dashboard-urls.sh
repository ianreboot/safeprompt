#!/bin/bash
# Fix hardcoded URLs in dashboard to use environment variables

cd /home/projects/safeprompt/dashboard/src

# Fix LoginHeader.tsx
sed -i 's|href="https://safeprompt\.dev/signup"|href={(process.env.NEXT_PUBLIC_WEBSITE_URL \|\| "https://safeprompt.dev") + "/signup"}|g' components/LoginHeader.tsx

# Fix app/page.tsx - website contact URL
sed -i 's|href="https://safeprompt\.dev/contact?subject=support"|href={(process.env.NEXT_PUBLIC_WEBSITE_URL \|\| "https://safeprompt.dev") + "/contact?subject=support"}|g' app/page.tsx

# Fix confirm/page.tsx
sed -i "s|window\.location\.href = 'https://safeprompt\.dev/contact'|window.location.href = (process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev') + '/contact'|g" app/confirm/page.tsx
sed -i "s|window\.location\.href = 'https://safeprompt\.dev'|window.location.href = process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev'|g" app/confirm/page.tsx
sed -i "s|window\.location\.href = 'https://safeprompt\.dev/signup?plan=paid'|window.location.href = (process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev') + '/signup?plan=paid'|g" app/confirm/page.tsx

# Fix onboard/page.tsx
sed -i "s|window\.location\.href = 'https://safeprompt\.dev/signup'|window.location.href = (process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev') + '/signup'|g" app/onboard/page.tsx
sed -i 's|emailRedirectTo: `https://dashboard\.safeprompt\.dev/confirm?plan=free`|emailRedirectTo: `${process.env.NEXT_PUBLIC_DASHBOARD_URL \|\| "https://dashboard.safeprompt.dev"}/confirm?plan=free`|g' app/onboard/page.tsx
sed -i "s|successUrl: 'https://dashboard\.safeprompt\.dev?welcome=true'|successUrl: (process.env.NEXT_PUBLIC_DASHBOARD_URL \|\| 'https://dashboard.safeprompt.dev') + '?welcome=true'|g' app/onboard/page.tsx
sed -i "s|cancelUrl: 'https://safeprompt\.dev/signup'|cancelUrl: (process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev') + '/signup'|g' app/onboard/page.tsx
sed -i 's|href="https://safeprompt\.dev/contact"|href={(process.env.NEXT_PUBLIC_WEBSITE_URL \|\| "https://safeprompt.dev") + "/contact"}|g' app/onboard/page.tsx
sed -i "s|window\.location\.href = 'https://safeprompt\.dev'|window.location.href = process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev'|g" app/onboard/page.tsx
sed -i "s|window\.location\.href = 'https://safeprompt\.dev/signup?plan=paid'|window.location.href = (process.env.NEXT_PUBLIC_WEBSITE_URL \|\| 'https://safeprompt.dev') + '/signup?plan=paid'|g" app/onboard/page.tsx

# Fix login/page.tsx
sed -i 's|href="https://safeprompt\.dev/signup"|href={(process.env.NEXT_PUBLIC_WEBSITE_URL \|\| "https://safeprompt.dev") + "/signup"}|g' app/login/page.tsx

# Fix login/page-improved.tsx
sed -i 's|href="https://safeprompt\.dev"|href={process.env.NEXT_PUBLIC_WEBSITE_URL \|\| "https://safeprompt.dev"}|g' app/login/page-improved.tsx
sed -i 's|href="https://safeprompt\.dev/contact"|href={(process.env.NEXT_PUBLIC_WEBSITE_URL \|\| "https://safeprompt.dev") + "/contact"}|g' app/login/page-improved.tsx

echo "✅ Dashboard URLs fixed!"
