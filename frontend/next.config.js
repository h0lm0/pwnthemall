/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_PTA_DEBUG_ENABLED: process.env.PTA_DEBUG_ENABLED || 'false',
  },
  async headers() {
    return [
      {
        // Configure cache headers for locale files
        // Next.js automatically generates ETags for static files
        source: '/locales/:locale.json',
        headers: [
          {
            key: 'Cache-Control',
            // Allow browser caching but always revalidate with server
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
