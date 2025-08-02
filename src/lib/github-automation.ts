/**
 * GitHub Repository Automation Service
 * Handles automated repository creation, deployment, and code synchronization
 */

import { Octokit } from '@octokit/rest'

export interface RepositoryConfig {
  name: string
  description: string
  businessName: string
  framework: 'nextjs' | 'react' | 'node' | 'static'
  features: string[]
  squareIntegration: boolean
  autoDeployment: boolean
}

export interface DeploymentConfig {
  provider: 'vercel' | 'netlify' | 'github-pages'
  domain?: string
  environmentVariables?: Record<string, string>
}

export class GitHubAutomationService {
  private octokit: Octokit
  
  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  /**
   * Create a new repository for a business
   */
  async createBusinessRepository(config: RepositoryConfig): Promise<any> {
    try {
      // Create the repository
      const { data: repo } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name: config.name,
        description: config.description,
        private: false, // Make public for demo purposes
        auto_init: true,
        gitignore_template: 'Node',
        license_template: 'mit'
      })

      // Add initial files based on framework
      await this.initializeRepository(repo.full_name, config)

      // Set up GitHub Pages if requested
      if (config.autoDeployment) {
        await this.setupGitHubPages(repo.full_name)
      }

      return {
        success: true,
        repository: {
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          cloneUrl: repo.clone_url,
          sshUrl: repo.ssh_url
        },
        message: `Repository ${repo.full_name} created successfully`
      }
    } catch (error) {
      console.error('Error creating repository:', error)
      throw new Error(`Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Initialize repository with starter code
   */
  private async initializeRepository(repoFullName: string, config: RepositoryConfig): Promise<void> {
    const [owner, repo] = repoFullName.split('/')

    // Create package.json
    const packageJson = this.generatePackageJson(config)
    await this.createOrUpdateFile(
      owner,
      repo,
      'package.json',
      JSON.stringify(packageJson, null, 2),
      'Initial package.json'
    )

    // Create README.md
    const readme = this.generateReadme(config)
    await this.createOrUpdateFile(
      owner,
      repo,
      'README.md',
      readme,
      'Initial README'
    )

    // Create basic project structure based on framework
    switch (config.framework) {
      case 'nextjs':
        await this.initializeNextJS(owner, repo, config)
        break
      case 'react':
        await this.initializeReact(owner, repo, config)
        break
      case 'node':
        await this.initializeNode(owner, repo, config)
        break
      case 'static':
        await this.initializeStatic(owner, repo, config)
        break
    }

    // Add Square integration if requested
    if (config.squareIntegration) {
      await this.addSquareIntegration(owner, repo, config)
    }
  }

  /**
   * Generate package.json based on configuration
   */
  private generatePackageJson(config: RepositoryConfig): any {
    const basePackage = {
      name: config.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: config.description,
      main: 'index.js',
      scripts: {},
      dependencies: {},
      devDependencies: {},
      keywords: [
        config.businessName.toLowerCase(),
        ...config.features.map(f => f.toLowerCase())
      ],
      author: config.businessName,
      license: 'MIT'
    }

    // Add framework-specific dependencies and scripts
    switch (config.framework) {
      case 'nextjs':
        basePackage.scripts = {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint'
        }
        basePackage.dependencies = {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        }
        basePackage.devDependencies = {
          '@types/node': '^20.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          typescript: '^5.0.0',
          eslint: '^8.0.0',
          'eslint-config-next': '^14.0.0'
        }
        break
      
      case 'react':
        basePackage.scripts = {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test',
          eject: 'react-scripts eject'
        }
        basePackage.dependencies = {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          'react-scripts': '^5.0.0'
        }
        basePackage.devDependencies = {
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          typescript: '^5.0.0'
        }
        break
      
      case 'node':
        basePackage.scripts = {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: 'jest'
        }
        basePackage.dependencies = {
          express: '^4.18.0',
          cors: '^2.8.5',
          dotenv: '^16.0.0'
        }
        basePackage.devDependencies = {
          nodemon: '^3.0.0',
          jest: '^29.0.0',
          '@types/node': '^20.0.0'
        }
        break

      case 'static':
        basePackage.scripts = {
          start: 'python -m http.server 8000',
          build: 'echo "Static site - no build needed"'
        }
        break
    }

    // Add Square SDK if integration is enabled
    if (config.squareIntegration) {
      basePackage.dependencies = basePackage.dependencies || {}
      ;(basePackage.dependencies as any).square = '^35.0.0'
    }

    return basePackage
  }

  /**
   * Generate README.md content
   */
  private generateReadme(config: RepositoryConfig): string {
    return `# ${config.businessName}

${config.description}

## Features

${config.features.map(feature => `- ${feature}`).join('\n')}

## Technology Stack

- Framework: ${config.framework.toUpperCase()}
${config.squareIntegration ? '- Payment Processing: Square' : ''}
- Deployment: ${config.autoDeployment ? 'Automated via GitHub Pages/Actions' : 'Manual'}

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/[username]/${config.name}.git
   cd ${config.name}
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Environment Variables

Create a \`.env.local\` file in the root directory with:

\`\`\`
# Application
NODE_ENV=development
PORT=3000

${config.squareIntegration ? `
# Square Configuration
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=sandbox # or production
` : ''}
\`\`\`

## Deployment

${config.autoDeployment ? `
This project is configured for automatic deployment via GitHub Pages/Actions.
Every push to the main branch will trigger a new deployment.
` : `
To deploy this application:

1. Build the project:
   \`\`\`bash
   npm run build
   \`\`\`

2. Deploy to your hosting provider of choice.
`}

## Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@${config.businessName.toLowerCase().replace(/\s+/g, '')}.com or create an issue in this repository.

---

*This repository was automatically generated by [Maverick](https://maverick.com) - The Complete Founder Platform*
`
  }

  /**
   * Initialize Next.js project structure
   */
  private async initializeNextJS(owner: string, repo: string, config: RepositoryConfig): Promise<void> {
    // Create next.config.js
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`

    await this.createOrUpdateFile(owner, repo, 'next.config.js', nextConfig, 'Add Next.js configuration')

    // Create app directory structure
    const appLayout = `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '${config.businessName}',
  description: '${config.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`

    await this.createOrUpdateFile(owner, repo, 'app/layout.tsx', appLayout, 'Add root layout')

    // Create homepage
    const homePage = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center">
          Welcome to ${config.businessName}
        </h1>
        <p className="text-xl text-center mt-4 text-gray-600">
          ${config.description}
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${config.features.map(feature => `
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="font-semibold">${feature}</h3>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>`).join('')}
        </div>
      </div>
    </main>
  )
}`

    await this.createOrUpdateFile(owner, repo, 'app/page.tsx', homePage, 'Add homepage')

    // Create global CSS
    const globalCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`

    await this.createOrUpdateFile(owner, repo, 'app/globals.css', globalCSS, 'Add global styles')

    // Add Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`

    await this.createOrUpdateFile(owner, repo, 'tailwind.config.js', tailwindConfig, 'Add Tailwind configuration')
  }

  /**
   * Initialize React project structure
   */
  private async initializeReact(owner: string, repo: string, config: RepositoryConfig): Promise<void> {
    // Create public/index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${config.description}" />
    <title>${config.businessName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`

    await this.createOrUpdateFile(owner, repo, 'public/index.html', indexHtml, 'Add HTML template')

    // Create src/App.tsx
    const appTsx = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${config.businessName}</h1>
        <p>${config.description}</p>
        
        <div className="features">
          <h2>Features</h2>
          <ul>
            ${config.features.map(feature => `<li>${feature}</li>`).join('\n            ')}
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;`

    await this.createOrUpdateFile(owner, repo, 'src/App.tsx', appTsx, 'Add main App component')

    // Create src/index.tsx
    const indexTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`

    await this.createOrUpdateFile(owner, repo, 'src/index.tsx', indexTsx, 'Add React entry point')
  }

  /**
   * Initialize Node.js project structure
   */
  private async initializeNode(owner: string, repo: string, config: RepositoryConfig): Promise<void> {
    const serverJs = `const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${config.businessName} API',
    description: '${config.description}',
    features: ${JSON.stringify(config.features, null, 2)},
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`${config.businessName} server running on port \${PORT}\`);
});`

    await this.createOrUpdateFile(owner, repo, 'index.js', serverJs, 'Add Express server')
  }

  /**
   * Initialize static website structure
   */
  private async initializeStatic(owner: string, repo: string, config: RepositoryConfig): Promise<void> {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.businessName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            color: white;
            padding: 60px 0;
        }
        h1 {
            font-size: 3rem;
            margin: 0 0 20px 0;
        }
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .features {
            background: white;
            margin: 40px 0;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .features h2 {
            text-align: center;
            margin-bottom: 30px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .feature-card {
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 8px;
            background: #f9f9f9;
        }
        footer {
            text-align: center;
            color: white;
            padding: 40px 0;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${config.businessName}</h1>
            <p class="subtitle">${config.description}</p>
        </header>

        <section class="features">
            <h2>What We Offer</h2>
            <div class="feature-grid">
                ${config.features.map(feature => `
                <div class="feature-card">
                    <h3>${feature}</h3>
                    <p>Coming soon...</p>
                </div>`).join('')}
            </div>
        </section>

        <footer>
            <p>&copy; ${new Date().getFullYear()} ${config.businessName}. All rights reserved.</p>
            <p>Built with Maverick - The Complete Founder Platform</p>
        </footer>
    </div>
</body>
</html>`

    await this.createOrUpdateFile(owner, repo, 'index.html', indexHtml, 'Add homepage')
  }

  /**
   * Add Square integration files
   */
  private async addSquareIntegration(owner: string, repo: string, config: RepositoryConfig): Promise<void> {
    const squareService = `// Square Web Payments SDK Integration
// Documentation: https://developer.squareup.com/docs/web-payments/overview

class SquarePaymentService {
  constructor(applicationId, locationId, environment = 'sandbox') {
    this.applicationId = applicationId;
    this.locationId = locationId;
    this.environment = environment;
    this.payments = null;
  }

  async initialize() {
    if (!window.Square) {
      throw new Error('Square.js not loaded');
    }

    this.payments = window.Square.payments(this.applicationId, this.locationId);
    return this.payments;
  }

  async createCardPayment(amount, currency = 'USD') {
    try {
      const card = await this.payments.card();
      await card.attach('#card-container');

      const result = await card.tokenize();
      if (result.status === 'OK') {
        return {
          success: true,
          token: result.token,
          amount,
          currency
        };
      } else {
        throw new Error(result.errors[0].message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }
}

// Usage example:
// const paymentService = new SquarePaymentService(
//   process.env.SQUARE_APPLICATION_ID,
//   process.env.SQUARE_LOCATION_ID,
//   process.env.SQUARE_ENVIRONMENT
// );

export default SquarePaymentService;`

    await this.createOrUpdateFile(
      owner, 
      repo, 
      config.framework === 'node' ? 'lib/square-service.js' : 'src/services/square.js', 
      squareService, 
      'Add Square payments integration'
    )

    // Add environment variables template
    const envExample = `# Square Configuration
SQUARE_APPLICATION_ID=your_square_app_id_here
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_LOCATION_ID=your_square_location_id_here
SQUARE_ENVIRONMENT=sandbox

# Application
NODE_ENV=development
PORT=3000`

    await this.createOrUpdateFile(owner, repo, '.env.example', envExample, 'Add environment variables template')
  }

  /**
   * Set up GitHub Pages deployment
   */
  private async setupGitHubPages(repoFullName: string): Promise<void> {
    const [owner, repo] = repoFullName.split('/')

    try {
      await this.octokit.repos.createPagesSite({
        owner,
        repo,
        source: {
          branch: 'main',
          path: '/'
        }
      })
    } catch (error) {
      // Pages might already be enabled, or repo might not support it
      console.warn('Could not enable GitHub Pages:', error)
    }
  }

  /**
   * Create or update a file in the repository
   */
  private async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    commitMessage: string
  ): Promise<void> {
    try {
      // Check if file exists
      let sha: string | undefined
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path
        })
        if ('sha' in data) {
          sha = data.sha
        }
      } catch (error) {
        // File doesn't exist, which is fine for creation
      }

      // Create or update file
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        sha
      })
    } catch (error) {
      console.error(`Error creating/updating file ${path}:`, error)
      throw error
    }
  }

  /**
   * Create a deployment workflow for GitHub Actions
   */
  async createDeploymentWorkflow(repoFullName: string, config: DeploymentConfig): Promise<void> {
    const [owner, repo] = repoFullName.split('/')

    let workflowContent = ''

    switch (config.provider) {
      case 'vercel':
        workflowContent = this.generateVercelWorkflow(config)
        break
      case 'netlify':
        workflowContent = this.generateNetlifyWorkflow(config)
        break
      case 'github-pages':
        workflowContent = this.generateGitHubPagesWorkflow(config)
        break
    }

    if (workflowContent) {
      await this.createOrUpdateFile(
        owner,
        repo,
        '.github/workflows/deploy.yml',
        workflowContent,
        `Add ${config.provider} deployment workflow`
      )
    }
  }

  private generateVercelWorkflow(config: DeploymentConfig): string {
    return `name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
`
  }

  private generateNetlifyWorkflow(config: DeploymentConfig): string {
    return `name: Deploy to Netlify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './build'
          production-branch: main
          github-token: \${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
`
  }

  private generateGitHubPagesWorkflow(config: DeploymentConfig): string {
    return `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './build'
          
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
`
  }
}

// Helper function to validate repository configuration
export function validateRepositoryConfig(config: Partial<RepositoryConfig>): string[] {
  const errors: string[] = []

  if (!config.name) errors.push('Repository name is required')
  if (!config.description) errors.push('Repository description is required')
  if (!config.businessName) errors.push('Business name is required')
  if (!config.framework) errors.push('Framework selection is required')

  // Validate repository name format
  if (config.name && !/^[a-zA-Z0-9._-]+$/.test(config.name)) {
    errors.push('Repository name contains invalid characters')
  }

  return errors
}