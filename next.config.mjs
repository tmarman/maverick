import { withSentry } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
  // Disable source maps in production for smaller bundle size
  // Enable in development for debugging
  productionBrowserSourceMaps: false,
}

export default withSentry(nextConfig)