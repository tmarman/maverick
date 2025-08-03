/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  output: 'standalone',
  // Ensure proper static asset handling for Azure
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
}

module.exports = nextConfig