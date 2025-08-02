import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { GitHubRepository, RepositorySetupOptions, WorkingDirectorySetup, CloneOptions } from '@/types/github-integration'

export class RepositorySetupService {
  private baseWorkingDir: string

  constructor(baseWorkingDir: string = '/tmp/maverick/workspaces') {
    this.baseWorkingDir = baseWorkingDir
  }

  /**
   * Set up a complete workspace based on the repository setup options
   */
  async setupWorkspace(setup: RepositorySetupOptions, userEmail: string): Promise<WorkingDirectorySetup> {
    const companyId = this.generateCompanyId(setup.companyName)
    const workspaceDir = path.join(this.baseWorkingDir, companyId)

    // Ensure workspace directory exists
    await fs.mkdir(workspaceDir, { recursive: true })

    const workingSetup: WorkingDirectorySetup = {
      companyId,
      baseDirectory: workspaceDir,
      repositoryClones: []
    }

    switch (setup.setupType) {
      case 'existing-repo':
        if (setup.existingRepository) {
          await this.cloneExistingRepository(setup.existingRepository, workspaceDir, workingSetup)
        }
        break

      case 'new-company':
        await this.createNewCompanyStructure(setup, workspaceDir, workingSetup, userEmail)
        break

      case 'fork-template':
        await this.forkTemplate(setup, workspaceDir, workingSetup, userEmail)
        break
    }

    return workingSetup
  }

  /**
   * Clone an existing repository
   */
  private async cloneExistingRepository(
    repository: GitHubRepository,
    workspaceDir: string,
    setup: WorkingDirectorySetup
  ) {
    const cloneDir = path.join(workspaceDir, 'main')
    
    const cloneOptions: CloneOptions = {
      repository,
      targetDirectory: cloneDir,
      includeSubmodules: true,
      depth: 1 // Shallow clone for faster setup
    }

    await this.cloneRepository(cloneOptions)

    setup.repositoryClones.push({
      repository,
      localPath: cloneDir,
      isMain: true
    })

    // Analyze repository structure to detect if it has submodules
    await this.analyzeRepositoryStructure(cloneDir, setup)
  }

  /**
   * Create a new company structure (can be monorepo or multi-repo)
   */
  private async createNewCompanyStructure(
    setup: RepositorySetupOptions,
    workspaceDir: string,
    workingSetup: WorkingDirectorySetup,
    userEmail: string
  ) {
    const mainDir = path.join(workspaceDir, 'main')
    await fs.mkdir(mainDir, { recursive: true })

    // Initialize git repository
    await this.executeGitCommand(['init'], mainDir)
    await this.executeGitCommand(['config', 'user.email', userEmail], mainDir)
    
    // Create initial structure based on template
    await this.createInitialStructure(setup, mainDir)

    // For multi-repo setup, create additional repositories
    if (setup.structure === 'multi-repo' && setup.projectRepositories) {
      for (const projectRepo of setup.projectRepositories) {
        await this.createProjectRepository(projectRepo, workspaceDir, workingSetup)
      }
    }
  }

  /**
   * Fork a template repository
   */
  private async forkTemplate(
    setup: RepositorySetupOptions,
    workspaceDir: string,
    workingSetup: WorkingDirectorySetup,
    userEmail: string
  ) {
    // This would integrate with GitHub API to fork a template
    // For now, we'll create a basic structure
    await this.createNewCompanyStructure(setup, workspaceDir, workingSetup, userEmail)
  }

  /**
   * Clone a repository to a specific directory
   */
  async cloneRepository(options: CloneOptions): Promise<void> {
    const { repository, targetDirectory, branch, depth, includeSubmodules } = options

    // Ensure target directory parent exists
    await fs.mkdir(path.dirname(targetDirectory), { recursive: true })

    const args = ['clone']
    
    if (branch) {
      args.push('--branch', branch)
    }
    
    if (depth) {
      args.push('--depth', depth.toString())
    }
    
    if (includeSubmodules) {
      args.push('--recurse-submodules')
    }
    
    args.push(repository.clone_url, targetDirectory)

    await this.executeGitCommand(args, process.cwd())
  }

  /**
   * Analyze repository structure to detect projects and submodules
   */
  private async analyzeRepositoryStructure(repoDir: string, setup: WorkingDirectorySetup) {
    try {
      // Check for .gitmodules file
      const gitmodulesPath = path.join(repoDir, '.gitmodules')
      try {
        const gitmodules = await fs.readFile(gitmodulesPath, 'utf-8')
        // Parse submodules and add them to the setup
        console.log('Found submodules:', gitmodules)
      } catch {
        // No submodules
      }

      // Check for common project structures
      const entries = await fs.readdir(repoDir, { withFileTypes: true })
      const directories = entries.filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      
      // Look for common project indicators
      const projectIndicators = ['packages', 'apps', 'services', 'projects', 'modules']
      const potentialProjects = directories.filter(dir => 
        projectIndicators.some(indicator => dir.name.toLowerCase().includes(indicator))
      )

      console.log('Detected potential project structure:', potentialProjects.map(p => p.name))
    } catch (error) {
      console.error('Error analyzing repository structure:', error)
    }
  }

  /**
   * Create initial project structure based on template
   */
  private async createInitialStructure(setup: RepositorySetupOptions, mainDir: string) {
    const template = setup.template || 'full-stack'
    
    // Create basic structure
    const structure = {
      'full-stack': {
        'README.md': this.generateReadme(setup.companyName),
        'apps/': {},
        'packages/': {},
        'docs/': {},
        '.gitignore': this.generateGitignore(),
        'package.json': this.generatePackageJson(setup.companyName)
      },
      'web-app': {
        'README.md': this.generateReadme(setup.companyName),
        'src/': {},
        'public/': {},
        'docs/': {},
        '.gitignore': this.generateGitignore(),
        'package.json': this.generatePackageJson(setup.companyName)
      }
    }

    const templateStructure = structure[template] || structure['full-stack']
    await this.createDirectoryStructure(mainDir, templateStructure)
  }

  /**
   * Create directory structure from template
   */
  private async createDirectoryStructure(baseDir: string, structure: any, currentPath: string = '') {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(baseDir, currentPath, name)
      
      if (name.endsWith('/')) {
        // Directory
        await fs.mkdir(fullPath.slice(0, -1), { recursive: true })
        if (typeof content === 'object' && content !== null) {
          await this.createDirectoryStructure(baseDir, content, path.join(currentPath, name))
        }
      } else {
        // File
        await fs.writeFile(fullPath, content as string)
      }
    }
  }

  /**
   * Create a separate project repository
   */
  private async createProjectRepository(
    projectConfig: any,
    workspaceDir: string,
    setup: WorkingDirectorySetup
  ) {
    const projectDir = path.join(workspaceDir, projectConfig.name)
    await fs.mkdir(projectDir, { recursive: true })
    
    // Initialize as separate git repository
    await this.executeGitCommand(['init'], projectDir)
    
    // Create basic project structure
    await this.createInitialStructure({
      companyName: projectConfig.name,
      template: projectConfig.template || 'web-app'
    } as RepositorySetupOptions, projectDir)
  }

  /**
   * Execute git command
   */
  private async executeGitCommand(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('git', args, { cwd })
      let output = ''
      let error = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Git command failed: ${error}`))
        }
      })
    })
  }

  /**
   * Generate company ID from name
   */
  private generateCompanyId(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Generate README content
   */
  private generateReadme(companyName: string): string {
    return `# ${companyName}

Built with Maverick - AI-native business formation platform.

## Getting Started

This project was set up using Maverick's intelligent project scaffolding.

## Structure

- \`apps/\` - Applications and services
- \`packages/\` - Shared packages and libraries  
- \`docs/\` - Documentation

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development
npm run dev
\`\`\`

## Deployment

Configured for automated deployment through Maverick's CI/CD pipeline.
`
  }

  /**
   * Generate .gitignore content
   */
  private generateGitignore(): string {
    return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
/coverage
*.lcov

# Next.js
/.next/
/out/

# Production
/build
/dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/
.idea/

# OS
Thumbs.db
`
  }

  /**
   * Generate package.json content
   */
  private generatePackageJson(name: string): string {
    return JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      description: `${name} - Built with Maverick`,
      scripts: {
        dev: 'echo "Development server not configured yet"',
        build: 'echo "Build process not configured yet"',
        start: 'echo "Start process not configured yet"'
      },
      keywords: ['maverick', 'business-formation'],
      author: '',
      license: 'UNLICENSED'
    }, null, 2)
  }
}