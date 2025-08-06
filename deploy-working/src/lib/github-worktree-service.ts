import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { GitHubRepository } from '@/types/github-integration'

export interface WorktreeSetup {
  repositoryId: string
  repositoryName: string
  baseDirectory: string
  mainBranch: string
  worktrees: WorktreeInfo[]
}

export interface WorktreeInfo {
  name: string
  branch: string
  path: string
  purpose: 'feature' | 'hotfix' | 'main' | 'develop'
  status: 'active' | 'stale' | 'merged'
  createdAt: Date
  lastActivity?: Date
}

export interface CloneOptions {
  repository: GitHubRepository
  baseDirectory: string
  shallow?: boolean
  includeSubmodules?: boolean
  accessToken?: string
}

export interface WorktreeCreateOptions {
  branch: string
  baseBranch?: string
  purpose: 'feature' | 'hotfix' | 'main' | 'develop'
  createBranch?: boolean
}

export class GitHubWorktreeService {
  private baseWorkingDir: string

  constructor(baseWorkingDir: string = '/tmp/maverick/repositories') {
    this.baseWorkingDir = baseWorkingDir
  }

  /**
   * Clone a repository and set up the main worktree
   */
  async cloneRepository(options: CloneOptions): Promise<WorktreeSetup> {
    const { repository, baseDirectory, shallow = true, includeSubmodules = false, accessToken } = options
    
    const repoDir = path.join(baseDirectory, repository.name)
    const bareRepoDir = path.join(repoDir, '.git-bare')
    const mainWorktreeDir = path.join(repoDir, 'main')

    // Ensure base directory exists
    await fs.mkdir(repoDir, { recursive: true })

    // Clone as bare repository for worktree management
    const cloneUrl = this.buildCloneUrl(repository, accessToken)
    const cloneArgs = [
      'clone',
      '--bare',
      ...(shallow ? ['--depth', '1'] : []),
      ...(includeSubmodules ? ['--recurse-submodules'] : []),
      cloneUrl,
      bareRepoDir
    ]

    await this.executeGitCommand(cloneArgs, repoDir)

    // Get default branch
    const defaultBranch = await this.getDefaultBranch(bareRepoDir)

    // Create main worktree
    await this.executeGitCommand([
      'worktree', 'add',
      mainWorktreeDir,
      defaultBranch
    ], bareRepoDir)

    // Initialize worktree setup
    const setup: WorktreeSetup = {
      repositoryId: repository.id.toString(),
      repositoryName: repository.name,
      baseDirectory: repoDir,
      mainBranch: defaultBranch,
      worktrees: [
        {
          name: 'main',
          branch: defaultBranch,
          path: mainWorktreeDir,
          purpose: 'main',
          status: 'active',
          createdAt: new Date()
        }
      ]
    }

    // Save setup metadata
    await this.saveWorktreeSetup(setup)

    return setup
  }

  /**
   * Create a new worktree for feature development
   */
  async createFeatureWorktree(
    repositoryPath: string,
    featureName: string,
    options: WorktreeCreateOptions
  ): Promise<WorktreeInfo> {
    const setup = await this.loadWorktreeSetup(repositoryPath)
    const bareRepoDir = path.join(setup.baseDirectory, '.git-bare')
    
    // Sanitize feature name for directory/branch usage
    const safeName = this.sanitizeName(featureName)
    const branchName = options.branch || `feature/${safeName}`
    const worktreePath = path.join(setup.baseDirectory, `feature-${safeName}`)

    // Ensure we're up to date with remote
    await this.executeGitCommand(['fetch', 'origin'], bareRepoDir)

    // Create new branch if requested
    if (options.createBranch) {
      const baseBranch = options.baseBranch || setup.mainBranch
      await this.executeGitCommand([
        'branch',
        branchName,
        `origin/${baseBranch}`
      ], bareRepoDir)
    }

    // Create the worktree
    await this.executeGitCommand([
      'worktree', 'add',
      worktreePath,
      branchName
    ], bareRepoDir)

    // Create worktree info
    const worktreeInfo: WorktreeInfo = {
      name: `feature-${safeName}`,
      branch: branchName,
      path: worktreePath,
      purpose: options.purpose,
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date()
    }

    // Update setup
    setup.worktrees.push(worktreeInfo)
    await this.saveWorktreeSetup(setup)

    return worktreeInfo
  }

  /**
   * List all worktrees for a repository
   */
  async listWorktrees(repositoryPath: string): Promise<WorktreeInfo[]> {
    try {
      const setup = await this.loadWorktreeSetup(repositoryPath)
      
      // Verify worktrees still exist and update status
      const updatedWorktrees: WorktreeInfo[] = []
      
      for (const worktree of setup.worktrees) {
        try {
          await fs.access(worktree.path)
          // Check if there are uncommitted changes
          const status = await this.getWorktreeStatus(worktree.path)
          worktree.lastActivity = new Date()
          updatedWorktrees.push(worktree)
        } catch (error) {
          // Worktree directory doesn't exist, mark as stale
          worktree.status = 'stale'
          updatedWorktrees.push(worktree)
        }
      }

      setup.worktrees = updatedWorktrees
      await this.saveWorktreeSetup(setup)
      
      return updatedWorktrees
    } catch (error) {
      console.error('Error listing worktrees:', error)
      return []
    }
  }

  /**
   * Remove a worktree
   */
  async removeWorktree(repositoryPath: string, worktreeName: string, force = false): Promise<boolean> {
    try {
      const setup = await this.loadWorktreeSetup(repositoryPath)
      const worktree = setup.worktrees.find(w => w.name === worktreeName)
      
      if (!worktree) {
        throw new Error(`Worktree ${worktreeName} not found`)
      }

      if (worktree.purpose === 'main') {
        throw new Error('Cannot remove main worktree')
      }

      const bareRepoDir = path.join(setup.baseDirectory, '.git-bare')

      // Remove the worktree
      const removeArgs = ['worktree', 'remove']
      if (force) removeArgs.push('--force')
      removeArgs.push(worktree.path)

      await this.executeGitCommand(removeArgs, bareRepoDir)

      // Update setup
      setup.worktrees = setup.worktrees.filter(w => w.name !== worktreeName)
      await this.saveWorktreeSetup(setup)

      return true
    } catch (error) {
      console.error('Error removing worktree:', error)
      return false
    }
  }

  /**
   * Get the status of a worktree (uncommitted changes, etc.)
   */
  async getWorktreeStatus(worktreePath: string): Promise<{
    clean: boolean
    uncommittedChanges: number
    untrackedFiles: number
    branch: string
  }> {
    try {
      // Get current branch
      const branchOutput = await this.executeGitCommand(['branch', '--show-current'], worktreePath)
      const branch = branchOutput.trim()

      // Get status --porcelain for parsing
      const statusOutput = await this.executeGitCommand(['status', '--porcelain'], worktreePath)
      const statusLines = statusOutput.trim().split('\n').filter(line => line.length > 0)
      
      const uncommittedChanges = statusLines.filter(line => !line.startsWith('??')).length
      const untrackedFiles = statusLines.filter(line => line.startsWith('??')).length

      return {
        clean: statusLines.length === 0,
        uncommittedChanges,
        untrackedFiles,
        branch
      }
    } catch (error) {
      console.error('Error getting worktree status:', error)
      return {
        clean: false,
        uncommittedChanges: 0,
        untrackedFiles: 0,
        branch: 'unknown'
      }
    }
  }

  /**
   * Switch to a different worktree (for AI agents to work in)
   */
  async getWorktreeForFeature(repositoryPath: string, featureName: string): Promise<string | null> {
    const setup = await this.loadWorktreeSetup(repositoryPath)
    const safeName = this.sanitizeName(featureName)
    const worktree = setup.worktrees.find(w => w.name === `feature-${safeName}`)
    
    return worktree?.path || null
  }

  /**
   * Execute git command with error handling
   */
  private async executeGitCommand(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('git', args, { 
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0' // Disable interactive prompts
        }
      })

      let output = ''
      let error = ''

      childProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      childProcess.stderr.on('data', (data) => {
        error += data.toString()
      })

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Git command failed (${code}): ${error}`))
        }
      })

      childProcess.on('error', (err) => {
        reject(new Error(`Failed to start git: ${err.message}`))
      })
    })
  }

  /**
   * Get the default branch of a repository
   */
  private async getDefaultBranch(bareRepoDir: string): Promise<string> {
    try {
      const output = await this.executeGitCommand(['symbolic-ref', 'refs/remotes/origin/HEAD'], bareRepoDir)
      return output.trim().replace('refs/remotes/origin/', '')
    } catch {
      // Fallback to common default branches
      try {
        await this.executeGitCommand(['show-ref', '--verify', '--quiet', 'refs/remotes/origin/main'], bareRepoDir)
        return 'main'
      } catch {
        return 'master' // Final fallback
      }
    }
  }

  /**
   * Build clone URL with authentication if provided
   */
  private buildCloneUrl(repository: GitHubRepository, accessToken?: string): string {
    if (accessToken) {
      const url = new URL(repository.clone_url)
      url.username = accessToken
      url.password = 'x-oauth-basic'
      return url.toString()
    }
    return repository.clone_url
  }

  /**
   * Sanitize name for use in file paths and branch names
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Save worktree setup metadata
   */
  private async saveWorktreeSetup(setup: WorktreeSetup): Promise<void> {
    const metadataPath = path.join(setup.baseDirectory, '.maverick-worktrees.json')
    await fs.writeFile(metadataPath, JSON.stringify(setup, null, 2))
  }

  /**
   * Load worktree setup metadata
   */
  private async loadWorktreeSetup(repositoryPath: string): Promise<WorktreeSetup> {
    const metadataPath = path.join(repositoryPath, '.maverick-worktrees.json')
    const data = await fs.readFile(metadataPath, 'utf-8')
    const setup = JSON.parse(data) as WorktreeSetup
    
    // Convert date strings back to Date objects
    setup.worktrees = setup.worktrees.map(w => ({
      ...w,
      createdAt: new Date(w.createdAt),
      lastActivity: w.lastActivity ? new Date(w.lastActivity) : undefined
    }))
    
    return setup
  }

  /**
   * Clean up stale worktrees
   */
  async cleanupStaleWorktrees(repositoryPath: string): Promise<number> {
    const setup = await this.loadWorktreeSetup(repositoryPath)
    const bareRepoDir = path.join(setup.baseDirectory, '.git-bare')
    
    let cleanedCount = 0
    
    for (const worktree of setup.worktrees) {
      if (worktree.status === 'stale' && worktree.purpose !== 'main') {
        try {
          await this.executeGitCommand([
            'worktree', 'remove', '--force', worktree.path
          ], bareRepoDir)
          cleanedCount++
        } catch (error) {
          console.warn(`Failed to cleanup worktree ${worktree.name}:`, error)
        }
      }
    }

    // Update setup to remove cleaned worktrees
    setup.worktrees = setup.worktrees.filter(w => w.status !== 'stale' || w.purpose === 'main')
    await this.saveWorktreeSetup(setup)
    
    return cleanedCount
  }
}

// Singleton instance
export const githubWorktreeService = new GitHubWorktreeService()