/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_PTA_DEBUG_ENABLED: process.env.PTA_DEBUG_ENABLED || 'false',
  },
}

module.exports = nextConfig
