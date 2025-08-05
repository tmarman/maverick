/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone build for Azure deployment
  output: "standalone",
  
  // App directory is now stable in Next.js 14
  
  // Exclude temporary directories and git repositories from build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/tmp/**',
        '**/test-worktrees/**',
        '**/feature-branch/**',
        '**/.maverick/**'
      ]
    }
    
    return config
  },
  
  // Also exclude from TypeScript checking
  typescript: {
    ignoreBuildErrors: false
  },
  
  // Exclude from ESLint
  eslint: {
    dirs: ['src', 'pages', 'components', 'lib', 'utils']
  }
}

module.exports = nextConfig