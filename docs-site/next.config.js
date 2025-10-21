/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    domains: ['safeprompt.dev'],
    unoptimized: true,
  },
}

module.exports = nextConfig