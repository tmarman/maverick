// Claude Code integration as Temporal activities

import { ActivityInterface } from '@temporalio/activity';

export interface ClaudeCodeRequest {
  projectName: string;
  businessType: 'e-commerce' | 'saas' | 'booking' | 'marketplace';
  requirements: {
    prd: string;
    technicalSpecs: TechnicalSpec[];
    squareIntegrations: string[];
    designPreferences: DesignPreferences;
  };
  iterationNumber: number;
  previousFeedback?: string;
}

export interface ClaudeCodeResponse {
  sessionId: string;
  generatedFiles: Record<string, string>; // filename -> content
  deploymentInstructions: string;
  testInstructions: string;
  repositoryUrl?: string;
  quality: {
    score: number; // 0-1
    issues: string[];
    suggestions: string[];
  };
}

export interface ClaudeCodeActivities extends ActivityInterface {
  // Start a new Claude Code session
  startClaudeCodeSession(request: ClaudeCodeRequest): Promise<string>;
  
  // Generate code using Claude Code IDE
  generateCodeWithClaude(sessionId: string, instruction: string): Promise<ClaudeCodeResponse>;
  
  // Iterate based on feedback
  refineCodeWithFeedback(sessionId: string, feedback: string): Promise<ClaudeCodeResponse>;
  
  // Deploy generated code
  deployGeneratedApp(sessionId: string, deploymentConfig: DeploymentConfig): Promise<DeployedApp>;
}

// Implementation of Claude Code activities
export const claudeCodeActivities: ClaudeCodeActivities = {
  
  async startClaudeCodeSession(request: ClaudeCodeRequest): Promise<string> {
    // This would integrate with Claude Code API/service
    const sessionId = `claude-session-${Date.now()}`;
    
    // In real implementation:
    // 1. Call Claude Code API to start new session
    // 2. Pass business requirements and technical specs
    // 3. Set up project structure based on business type
    // 4. Configure Square API integrations
    
    console.log(`Starting Claude Code session for ${request.projectName}`);
    console.log(`Business type: ${request.businessType}`);
    console.log(`Square integrations: ${request.requirements.squareIntegrations.join(', ')}`);
    
    return sessionId;
  },

  async generateCodeWithClaude(sessionId: string, instruction: string): Promise<ClaudeCodeResponse> {
    // This is where we'd call Claude Code programmatically
    const prompt = `
You are generating a ${instruction} application. Here's what I need:

**Project Requirements:**
${instruction}

**Square API Integration:**
- Use Square Web Payments SDK for payment processing
- Integrate Square Catalog API for product/service management
- Set up Square Customer API for user management
- Include Square Analytics for business insights

**Technical Requirements:**
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma ORM with SQL Server
- Responsive design
- Production-ready deployment configuration

**Deliverables:**
1. Complete application code
2. Database schema and migrations
3. Deployment instructions
4. README with setup guide
5. Environment configuration template

Please generate a complete, production-ready application.
    `;

    // Mock implementation - in reality this would:
    // 1. Send prompt to Claude Code API
    // 2. Stream the code generation process
    // 3. Collect all generated files
    // 4. Run quality checks
    // 5. Generate deployment instructions

    const generatedFiles = {
      'package.json': generatePackageJson(instruction),
      'src/app/page.tsx': generateMainPage(instruction),
      'src/lib/square-integration.ts': generateSquareIntegration(),
      'prisma/schema.prisma': generateDatabaseSchema(instruction),
      'README.md': generateReadme(instruction),
      '.env.example': generateEnvTemplate(),
      'deployment.md': generateDeploymentInstructions()
    };

    return {
      sessionId,
      generatedFiles,
      deploymentInstructions: 'Deploy to Vercel with environment variables configured',
      testInstructions: 'Run npm test and manual testing checklist',
      quality: {
        score: 0.85,
        issues: ['Add error boundary for payment processing'],
        suggestions: ['Consider adding offline support', 'Add more comprehensive logging']
      }
    };
  },

  async refineCodeWithFeedback(sessionId: string, feedback: string): Promise<ClaudeCodeResponse> {
    // Handle iterative improvement based on human feedback
    const refinementPrompt = `
Based on this feedback, please refine the generated application:

**Feedback:**
${feedback}

**Instructions:**
1. Address all concerns raised in the feedback
2. Improve code quality and user experience
3. Ensure Square API integration is robust
4. Add any missing features or functionality
5. Update documentation accordingly

Please provide the updated code files.
    `;

    // This would call Claude Code again with the refinement prompt
    // and return improved code

    return {
      sessionId,
      generatedFiles: {
        // Updated files based on feedback
      },
      deploymentInstructions: 'Updated deployment with feedback incorporated',
      testInstructions: 'Updated testing instructions',
      quality: {
        score: 0.92, // Improved after feedback
        issues: [],
        suggestions: ['Consider A/B testing for UI improvements']
      }
    };
  },

  async deployGeneratedApp(sessionId: string, deploymentConfig: DeploymentConfig): Promise<DeployedApp> {
    // Deploy the generated application
    const appName = deploymentConfig.appName.toLowerCase().replace(/\s+/g, '-');
    
    // In real implementation:
    // 1. Create GitHub repository
    // 2. Push generated code
    // 3. Set up CI/CD pipeline
    // 4. Deploy to Vercel/Azure/AWS
    // 5. Configure custom domain
    // 6. Set up monitoring and analytics

    return {
      id: `app-${Date.now()}`,
      name: deploymentConfig.appName,
      url: `https://${appName}.vercel.app`,
      repositoryUrl: `https://github.com/maverick-apps/${appName}`,
      status: 'deployed',
      squareIntegration: {
        merchantId: deploymentConfig.squareConfig.merchantId,
        applicationId: deploymentConfig.squareConfig.applicationId,
        webhookUrl: `https://${appName}.vercel.app/api/webhooks/square`,
        setupComplete: true
      },
      analytics: {
        deploymentTime: new Date(),
        buildDuration: '2m 34s',
        testsPassed: true
      }
    };
  }
};

// Helper functions for code generation
function generatePackageJson(projectType: string): string {
  return JSON.stringify({
    name: projectType.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      test: 'jest'
    },
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.0.0',
      'squareup': '^32.0.0',
      '@prisma/client': '^5.0.0',
      'tailwindcss': '^3.0.0'
    }
  }, null, 2);
}

function generateMainPage(projectType: string): string {
  return `// Generated by Maverick for ${projectType}
import { SquarePaymentForm } from '@/components/SquarePaymentForm'

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">${projectType}</h1>
      <SquarePaymentForm />
    </main>
  )
}`;
}

function generateSquareIntegration(): string {
  return `// Square API integration
import { Client, Environment } from 'squareup'

const squareClient = new Client({
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
})

export { squareClient }`;
}

function generateDatabaseSchema(projectType: string): string {
  return `// Prisma schema for ${projectType}
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;
}

function generateReadme(projectType: string): string {
  return `# ${projectType}

Generated by Maverick with Square integration.

## Features
- Square payment processing
- Responsive design
- TypeScript + Next.js
- Database integration

## Setup
1. \`npm install\`
2. Configure environment variables
3. \`npm run dev\`
`;
}

function generateEnvTemplate(): string {
  return `# Square Configuration
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox

# Database
DATABASE_URL="sqlserver://..."

# Next.js
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
`;
}

function generateDeploymentInstructions(): string {
  return `# Deployment Instructions

## Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with \`vercel --prod\`

## Database Setup
1. Create SQL Server database on Azure
2. Run \`npx prisma migrate deploy\`
3. Update connection string in environment variables

## Square Configuration
1. Update webhook endpoints in Square dashboard
2. Test payment flow in sandbox mode
3. Request production approval from Square
`;
}

// Type definitions
interface TechnicalSpec {
  component: string;
  technology: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface DesignPreferences {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  layout: 'modern' | 'classic' | 'minimal';
}

interface DeploymentConfig {
  appName: string;
  domain?: string;
  squareConfig: {
    merchantId: string;
    applicationId: string;
  };
}

interface DeployedApp {
  id: string;
  name: string;
  url: string;
  repositoryUrl: string;
  status: 'deployed' | 'failed' | 'building';
  squareIntegration: {
    merchantId: string;
    applicationId: string;
    webhookUrl: string;
    setupComplete: boolean;
  };
  analytics: {
    deploymentTime: Date;
    buildDuration: string;
    testsPassed: boolean;
  };
}