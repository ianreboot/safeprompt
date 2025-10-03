/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.safeprompt.dev',
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.safeprompt.dev',
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://safeprompt.dev',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  images: {
    domains: ['safeprompt.dev'],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/blog/gmail-ai-threat',
        destination: '/blog/prevent-ai-email-attacks',
        permanent: true,
      },
      {
        source: '/blog/chatbot-hacks',
        destination: '/blog/stop-chatbot-prompt-injection',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig