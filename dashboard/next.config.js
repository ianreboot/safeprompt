/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SAFEPROMPT_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  }
}

module.exports = nextConfig