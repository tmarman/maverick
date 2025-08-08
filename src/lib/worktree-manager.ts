import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

export interface WorktreeSession {
  id: string
  taskId: string
  branch: string
  path: string
  baseBranch: string
  createdAt: Date
  status: 'active' | 'completed' | 'failed' | 'merged' | 'abandoned'
  agentType?: string
  progress?: WorktreeProgress
}

export interface WorktreeProgress {
  currentStep: number
  totalSteps: number
  stepDescription: string
  filesChanged: string[]
  testsStatus: 'pending' | 'running' | 'passed' | 'failed'
  lastActivity: Date
}

export interface WorktreeCommand {
  command: string
  args: string[]
  cwd?: string
  timeout?: number
}

export interface BranchValidation {
  isValid: boolean
  errors: string[]
  suggestions: string[]
  normalizedName?: string
}

export interface WorktreeInfo {
  project: string
  branch: string
  path: string
  isActive: boolean
  lastModified: Date
  status: 'clean' | 'modified' | 'staged' | 'untracked'
}

export class WorktreeManager {
  private sessions = new Map<string, WorktreeSession>()
  private baseRepoPath: string
  private worktreeRoot: string

  constructor(baseRepoPath?: string) {
    // Use hierarchical structure: tmp/repos/
    this.baseRepoPath = baseRepoPath || process.cwd()
    this.worktreeRoot = path.join(process.cwd(), 'tmp', 'repos')
  }

  /**
   * Initialize the worktree management system
   */
  async initialize(): Promise<void> {
    // Ensure worktree root directory exists
    await fs.mkdir(this.worktreeRoot, { recursive: true })
    
    // Clean up any stale worktrees from previous runs
    await this.cleanupStaleWorktrees()
    
    console.log(`🌳 Worktree Manager initialized at ${this.worktreeRoot}`)
  }

  // === NEW HIERARCHICAL WORKTREE METHODS ===

  /**
   * Validate and normalize branch name according to our conventions
   */
  validateBranchName(branchName: string): BranchValidation {
    const errors: string[] = []
    const suggestions: string[] = []

    // Valid prefixes (including smart worktree team names)
    const validPrefixes = [
      'main', 'feat', 'fix', 'refactor', 'docs', 'test', 'chore',
      // Smart worktree team-based names
      'frontend-ui-improvements',
      'backend-api-enhancements', 
      'auth-security-features',
      'database-optimizations',
      'infrastructure-devops',
      'marketing-content-updates',
      'testing-quality-assurance'
    ]
    
    // Basic validation
    if (!branchName || branchName.trim().length === 0) {
      errors.push('Branch name cannot be empty')
      return { isValid: false, errors, suggestions }
    }

    // Normalize: lowercase, replace spaces/underscores with hyphens
    let normalized = branchName.toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')

    // Check prefix (exact match for smart worktree names, or prefix match for traditional names)
    const hasValidPrefix = validPrefixes.some(prefix => {
      // Exact match for smart worktree team names
      if (prefix.includes('-') && prefix.length > 10) {
        return normalized === prefix
      }
      // Traditional prefix matching for feat-, fix-, etc.
      return normalized === prefix || normalized.startsWith(prefix + '-')
    })

    if (!hasValidPrefix && normalized !== 'main') {
      // Try to suggest a prefix
      if (normalized.includes('bug') || normalized.includes('error') || normalized.includes('fix')) {
        suggestions.push(`Consider: fix-${normalized}`)
      } else if (normalized.includes('doc') || normalized.includes('readme')) {
        suggestions.push(`Consider: docs-${normalized}`)
      } else if (normalized.includes('test') || normalized.includes('spec')) {
        suggestions.push(`Consider: test-${normalized}`)
      } else {
        suggestions.push(`Consider: feat-${normalized}`)
      }
      errors.push(`Branch name should start with one of: ${validPrefixes.join(', ')}`)
    }

    // Length validation (max 50 chars total)
    if (normalized.length > 50) {
      errors.push('Branch name too long (max 50 characters)')
      suggestions.push('Try using fewer or shorter words')
    }

    // Word count (2-5 words including prefix)
    const words = normalized.split('-')
    if (words.length > 5) {
      errors.push('Branch name too verbose (max 4 words after prefix)')
      suggestions.push('Try to be more concise')
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
      normalizedName: normalized
    }
  }

  /**
   * Get the project directory path
   */
  getProjectPath(project: string): string {
    return path.join(this.worktreeRoot, project)
  }

  /**
   * Get the worktree path for a specific branch
   */
  getWorktreePath(project: string, branch: string): string {
    return path.join(this.getProjectPath(project), branch)
  }

  /**
   * Check if a project exists (main repo at project/main/.git)
   */
  async projectExists(project: string): Promise<boolean> {
    try {
      const mainRepoPath = this.getWorktreePath(project, 'main')
      const gitPath = path.join(mainRepoPath, '.git')
      
      // Check if main repo exists 
      const stat = await fs.stat(gitPath)
      if (!stat.isDirectory()) return false
      
      // Verify it's a valid git repository by checking for HEAD file
      const headPath = path.join(gitPath, 'HEAD')
      await fs.access(headPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * List all worktrees for a project
   */
  async listProjectWorktrees(project: string): Promise<WorktreeInfo[]> {
    if (!await this.projectExists(project)) {
      throw new Error(`Project ${project} does not exist`)
    }

    const mainRepoPath = this.getWorktreePath(project, 'main')
    
    try {
      // Use git worktree list to get worktree info (run from main repo)
      const output = await this.runGitCommand(['worktree', 'list', '--porcelain'], mainRepoPath)

      const worktrees: WorktreeInfo[] = []
      const lines = output.split('\n')
      let currentWorktree: Partial<WorktreeInfo> = {}

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          const worktreePath = line.substring(9)
          const branch = path.basename(worktreePath)
          currentWorktree = {
            project,
            branch,
            path: worktreePath,
            isActive: false
          }
        } else if (line.startsWith('branch ')) {
          // Sometimes branch info is provided separately
          if (currentWorktree.branch === undefined) {
            currentWorktree.branch = line.substring(7)
          }
        } else if (line === '' && currentWorktree.path) {
          // End of worktree info, add to list
          try {
            const stat = await fs.stat(currentWorktree.path!)
            currentWorktree.lastModified = stat.mtime
            currentWorktree.status = 'clean' // TODO: Get actual git status
            worktrees.push(currentWorktree as WorktreeInfo)
          } catch {
            // Worktree path doesn't exist, skip
          }
          currentWorktree = {}
        }
      }

      return worktrees
    } catch (error) {
      throw new Error(`Failed to list worktrees: ${error}`)
    }
  }

  /**
   * Create a new hierarchical worktree
   */
  async createHierarchicalWorktree(project: string, branch: string, baseBranch: string = 'main'): Promise<string> {
    const validation = this.validateBranchName(branch)
    if (!validation.isValid) {
      throw new Error(`Invalid branch name: ${validation.errors.join(', ')}`)
    }

    const normalizedBranch = validation.normalizedName!
    const mainRepoPath = this.getWorktreePath(project, 'main')
    const worktreePath = this.getWorktreePath(project, normalizedBranch)

    // For main branch, we don't create a worktree, it IS the main repo
    if (normalizedBranch === 'main') {
      return mainRepoPath
    }

    // Ensure project exists
    if (!await this.projectExists(project)) {
      throw new Error(`Project ${project} does not exist. Clone it first.`)
    }

    // Check if worktree already exists
    try {
      await fs.access(worktreePath)
      throw new Error(`Worktree ${normalizedBranch} already exists`)
    } catch {
      // Good, it doesn't exist
    }

    try {
      // Create the worktree with a new branch based on baseBranch (run from main repo)
      // This avoids the conflict of trying to checkout a branch that's already checked out
      await this.runGitCommand(['worktree', 'add', '-b', normalizedBranch, worktreePath, baseBranch], mainRepoPath)

      // Initialize .maverick structure if it doesn't exist
      const maverickPath = path.join(worktreePath, '.maverick')
      try {
        await fs.access(maverickPath)
      } catch {
        // .maverick doesn't exist, create basic structure
        await fs.mkdir(path.join(maverickPath, 'work-items'), { recursive: true })
        await fs.mkdir(path.join(maverickPath, 'ai-logs'), { recursive: true })
        await fs.mkdir(path.join(maverickPath, 'agents'), { recursive: true })
        
        // Create basic project.json
        const projectConfig = {
          version: "1.0",
          scope: {
            type: "feature",
            name: `${project} - ${normalizedBranch}`,
            description: `Feature branch for ${normalizedBranch}`,
            branch: normalizedBranch,
            baseBranch: baseBranch
          },
          createdAt: new Date().toISOString()
        }
        
        await fs.writeFile(
          path.join(maverickPath, 'project.json'),
          JSON.stringify(projectConfig, null, 2)
        )
      }

      console.log(`🌳 Created worktree: ${worktreePath}`)
      return worktreePath
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error}`)
    }
  }

  /**
   * Remove a hierarchical worktree
   */
  async removeHierarchicalWorktree(project: string, branch: string, force: boolean = false): Promise<void> {
    const bareRepoPath = path.join(this.getProjectPath(project), '.git')
    const worktreePath = this.getWorktreePath(project, branch)
    
    if (!await this.projectExists(project)) {
      throw new Error(`Project ${project} does not exist`)
    }

    try {
      const forceFlag = force ? '--force' : ''
      await this.runGitCommand(['worktree', 'remove', forceFlag, worktreePath].filter(Boolean), bareRepoPath)
      console.log(`🧹 Removed worktree: ${project}/${branch}`)
    } catch (error) {
      throw new Error(`Failed to remove worktree: ${error}`)
    }
  }

  /**
   * Clone a repository and set up hierarchical structure
   * Structure: /tmp/repos/project/main/ (main repo) + /tmp/repos/project/feature-branches/ (worktrees)
   */
  async cloneProjectHierarchical(repoUrl: string, project: string): Promise<string> {
    const mainRepoPath = this.getWorktreePath(project, 'main')
    
    // Ensure base directory exists
    await fs.mkdir(this.worktreeRoot, { recursive: true })
    
    // Check if project already exists
    if (await this.projectExists(project)) {
      console.log(`📁 Project ${project} already exists, skipping clone`)
      return mainRepoPath
    }

    try {
      // Clone directly to main directory
      await execAsync(`git clone ${repoUrl} ${mainRepoPath}`)
      
      console.log(`📂 Cloned project to main: ${mainRepoPath}`)
      
      return mainRepoPath
    } catch (error) {
      throw new Error(`Failed to clone project: ${error}`)
    }
  }

  /**
   * Activate a branch by creating a worktree for active development
   * Branches without worktrees exist as inactive branch references only
   */
  async activateBranch(project: string, branch: string, baseBranch: string = 'main'): Promise<string> {
    const bareRepoPath = path.join(this.getProjectPath(project), '.git')
    const worktreePath = this.getWorktreePath(project, branch)

    if (!await this.projectExists(project)) {
      throw new Error(`Project ${project} does not exist`)
    }

    // Check if worktree already exists (branch already active)
    try {
      await fs.access(worktreePath)
      console.log(`🌳 Branch ${branch} is already active`)
      return worktreePath
    } catch {
      // Good, doesn't exist - we can create it
    }

    try {
      // Check if branch exists as a reference
      const branchExists = await this.branchExists(project, branch)
      
      if (branchExists) {
        // Create worktree from existing branch
        await this.runGitCommand(['worktree', 'add', worktreePath, branch], bareRepoPath)
        console.log(`🌳 Activated existing branch: ${branch}`)
      } else {
        // Create new branch with worktree
        await this.runGitCommand(['worktree', 'add', '-b', branch, worktreePath, baseBranch], bareRepoPath)
        console.log(`🌳 Created and activated new branch: ${branch}`)
      }

      return worktreePath
    } catch (error) {
      throw new Error(`Failed to activate branch ${branch}: ${error}`)
    }
  }

  /**
   * Deactivate a branch by removing its worktree (keeping the branch reference)
   * This saves disk space while preserving the branch for future reactivation
   */
  async deactivateBranch(project: string, branch: string, force: boolean = false): Promise<void> {
    if (branch === 'main') {
      throw new Error('Cannot deactivate main branch')
    }

    const bareRepoPath = path.join(this.getProjectPath(project), '.git')
    const worktreePath = this.getWorktreePath(project, branch)

    if (!await this.projectExists(project)) {
      throw new Error(`Project ${project} does not exist`)
    }

    try {
      // Check if worktree exists
      await fs.access(worktreePath)
      
      // Remove worktree but keep branch reference
      const forceFlag = force ? '--force' : ''
      await this.runGitCommand(['worktree', 'remove', forceFlag, worktreePath].filter(Boolean), bareRepoPath)
      
      console.log(`💤 Deactivated branch: ${branch} (branch reference preserved)`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('no such file')) {
        console.log(`⚠️  Branch ${branch} is already inactive`)
        return
      }
      throw new Error(`Failed to deactivate branch ${branch}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if a branch exists as a git reference
   */
  async branchExists(project: string, branch: string): Promise<boolean> {
    const bareRepoPath = path.join(this.getProjectPath(project), '.git')
    
    try {
      await this.runGitCommand(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], bareRepoPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get all branches (active and inactive)
   */
  async getAllBranches(project: string): Promise<{
    active: Array<{ branch: string; path: string; lastModified: Date }>
    inactive: Array<{ branch: string; lastCommit: string; lastCommitDate: Date }>
  }> {
    if (!await this.projectExists(project)) {
      throw new Error(`Project ${project} does not exist`)
    }

    const bareRepoPath = path.join(this.getProjectPath(project), '.git')
    
    try {
      // Get all worktrees (active branches)
      const activeWorktrees = await this.listProjectWorktrees(project)
      const active = activeWorktrees.map(wt => ({
        branch: wt.branch,
        path: wt.path,
        lastModified: wt.lastModified
      }))

      // Get all branch references
      const branchOutput = await this.runGitCommand(['branch', '-r', '--format=%(refname:short)|%(objectname:short)|%(committerdate:iso)'], bareRepoPath)
      const allBranches = branchOutput.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [ref, commit, date] = line.split('|')
          return {
            branch: ref.replace('origin/', ''),
            lastCommit: commit,
            lastCommitDate: new Date(date)
          }
        })

      // Find inactive branches (have reference but no worktree)
      const activeBranchNames = new Set(active.map(a => a.branch))
      const inactive = allBranches.filter(branch => !activeBranchNames.has(branch.branch))

      return { active, inactive }
    } catch (error) {
      throw new Error(`Failed to get branch information: ${error}`)
    }
  }

  /**
   * Create a new isolated worktree for an agent task
   */
  async createWorktree(
    taskId: string, 
    agentType: string = 'feature-builder',
    baseBranch: string = 'main'
  ): Promise<WorktreeSession> {
    const sessionId = randomUUID()
    const branchName = `agent/${taskId}-${Date.now()}`
    const worktreePath = path.join(this.worktreeRoot, sessionId)

    try {
      // Create the worktree with a new branch
      await this.runGitCommand([
        'worktree', 'add', 
        '-b', branchName,
        worktreePath,
        baseBranch
      ])

      const session: WorktreeSession = {
        id: sessionId,
        taskId,
        branch: branchName,
        path: worktreePath,
        baseBranch,
        createdAt: new Date(),
        status: 'active',
        agentType,
        progress: {
          currentStep: 0,
          totalSteps: 0,
          stepDescription: 'Initializing...',
          filesChanged: [],
          testsStatus: 'pending',
          lastActivity: new Date()
        }
      }

      this.sessions.set(sessionId, session)

      console.log(`🚀 Created worktree for task ${taskId}:`)
      console.log(`   Branch: ${branchName}`)
      console.log(`   Path: ${worktreePath}`)

      return session
    } catch (error) {
      console.error(`❌ Failed to create worktree for task ${taskId}:`, error)
      throw new Error(`Worktree creation failed: ${error}`)
    }
  }

  /**
   * Execute a command within a specific worktree
   */
  async executeInWorktree(
    sessionId: string, 
    command: WorktreeCommand
  ): Promise<{ stdout: string; stderr: string; success: boolean }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Worktree session ${sessionId} not found`)
    }

    const cwd = command.cwd || session.path
    const timeout = command.timeout || 300000 // 5 minutes default

    try {
      console.log(`🔧 Executing in worktree ${sessionId}: ${command.command} ${command.args.join(' ')}`)
      
      const { stdout, stderr } = await execAsync(
        [command.command, ...command.args].join(' '),
        { 
          cwd, 
          timeout,
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        }
      )

      // Update session activity
      if (session.progress) {
        session.progress.lastActivity = new Date()
      }

      return { stdout, stderr, success: true }
    } catch (error: any) {
      console.error(`❌ Command failed in worktree ${sessionId}:`, error.message)
      return { 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message, 
        success: false 
      }
    }
  }

  /**
   * Run development server in worktree (for testing/demo)
   */
  async startDevServer(sessionId: string): Promise<{ port: number; url: string; process: any }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Worktree session ${sessionId} not found`)
    }

    // Find an available port (starting from 3001 to avoid conflicts)
    const port = await this.findAvailablePort(3001)
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      cwd: session.path,
      env: { 
        ...process.env, 
        PORT: port.toString(),
        NODE_ENV: 'development'
      },
      stdio: 'pipe'
    })

    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dev server start timeout')), 30000)
      
      devProcess.stdout?.on('data', (data) => {
        if (data.toString().includes('Ready on') || data.toString().includes('Local:')) {
          clearTimeout(timeout)
          resolve(true)
        }
      })

      devProcess.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })

    console.log(`🌐 Dev server started for worktree ${sessionId} on port ${port}`)

    return {
      port,
      url: `http://localhost:${port}`,
      process: devProcess
    }
  }

  /**
   * Get current status of all files changed in worktree
   */
  async getWorktreeStatus(sessionId: string): Promise<{
    filesChanged: string[]
    uncommittedChanges: string[]
    branch: string
    commits: number
  }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Worktree session ${sessionId} not found`)
    }

    try {
      // Get git status
      const { stdout: statusOutput } = await execAsync('git status --porcelain', { 
        cwd: session.path 
      })

      // Get commits ahead of base branch
      const { stdout: commitCount } = await execAsync(
        `git rev-list --count ${session.baseBranch}..HEAD`, 
        { cwd: session.path }
      )

      // Get list of changed files (committed and uncommitted)
      const { stdout: diffOutput } = await execAsync(
        `git diff --name-only ${session.baseBranch}...HEAD`, 
        { cwd: session.path }
      )

      const uncommittedChanges = statusOutput
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.substring(3))

      const filesChanged = diffOutput
        .split('\n')
        .filter(line => line.trim())

      return {
        filesChanged: Array.from(new Set([...filesChanged, ...uncommittedChanges])),
        uncommittedChanges,
        branch: session.branch,
        commits: parseInt(commitCount.trim()) || 0
      }
    } catch (error) {
      console.error(`Error getting worktree status for ${sessionId}:`, error)
      return {
        filesChanged: [],
        uncommittedChanges: [],
        branch: session.branch,
        commits: 0
      }
    }
  }

  /**
   * Create a pull request from the worktree branch
   */
  async createPullRequest(
    sessionId: string,
    title: string,
    description: string,
    screenshots?: string[],
    demoVideo?: string
  ): Promise<{ prUrl: string; prNumber: number }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Worktree session ${sessionId} not found`)
    }

    try {
      // Push the branch to remote
      await this.runGitCommand(['push', 'origin', session.branch], session.path)

      // Build PR description with demo assets
      let prDescription = description
      
      if (screenshots && screenshots.length > 0) {
        prDescription += '\n\n## Screenshots\n'
        screenshots.forEach((screenshot, index) => {
          prDescription += `\n![Screenshot ${index + 1}](${screenshot})`
        })
      }

      if (demoVideo) {
        prDescription += `\n\n## Demo Video\n\n[![Demo Video](${demoVideo})](${demoVideo})`
      }

      prDescription += '\n\n🤖 Created with Maverick AI Agent System'

      // Create PR using GitHub CLI
      const { stdout } = await execAsync(
        `gh pr create --title "${title}" --body "${prDescription}" --head ${session.branch}`,
        { cwd: session.path }
      )

      // Extract PR URL and number from output
      const prUrl = stdout.trim()
      const prNumber = parseInt(prUrl.split('/').pop() || '0')

      session.status = 'completed'
      
      console.log(`🎉 Created PR #${prNumber}: ${prUrl}`)

      return { prUrl, prNumber }
    } catch (error) {
      console.error(`Failed to create PR for worktree ${sessionId}:`, error)
      throw error
    }
  }

  /**
   * Clean up a worktree session
   */
  async cleanupWorktree(sessionId: string, deleteFiles: boolean = true): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.log(`⚠️  Worktree session ${sessionId} not found for cleanup`)
      return
    }

    try {
      // Remove the worktree
      await this.runGitCommand(['worktree', 'remove', session.path, '--force'])
      
      // Delete the branch if it wasn't merged
      if (session.status !== 'merged') {
        try {
          await this.runGitCommand(['branch', '-D', session.branch])
        } catch (error) {
          console.log(`⚠️  Could not delete branch ${session.branch}:`, error)
        }
      }

      // Remove from sessions
      this.sessions.delete(sessionId)

      console.log(`🧹 Cleaned up worktree session ${sessionId}`)
    } catch (error) {
      console.error(`Failed to cleanup worktree ${sessionId}:`, error)
    }
  }

  /**
   * Get all active worktree sessions
   */
  getActiveSessions(): WorktreeSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active')
  }

  /**
   * Update progress for a worktree session
   */
  updateProgress(
    sessionId: string, 
    progress: Partial<WorktreeProgress>
  ): void {
    const session = this.sessions.get(sessionId)
    if (session && session.progress) {
      session.progress = { ...session.progress, ...progress, lastActivity: new Date() }
    }
  }

  // Private helper methods

  private async runGitCommand(args: string[], cwd?: string): Promise<string> {
    const workingDir = cwd || this.baseRepoPath
    const { stdout } = await execAsync(`git ${args.join(' ')}`, { cwd: workingDir })
    return stdout.trim()
  }

  private async cleanupStaleWorktrees(): Promise<void> {
    try {
      // List all worktrees
      const stdout = await this.runGitCommand(['worktree', 'list', '--porcelain'])
      
      // Parse worktree list and remove any in our agent directory
      const lines = stdout.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('worktree ') && lines[i].includes('.maverick-agents')) {
          const worktreePath = lines[i].replace('worktree ', '')
          try {
            await this.runGitCommand(['worktree', 'remove', worktreePath, '--force'])
            console.log(`🧹 Cleaned up stale worktree: ${worktreePath}`)
          } catch (error) {
            console.log(`⚠️  Could not clean stale worktree ${worktreePath}:`, error)
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Could not clean stale worktrees:', error)
    }
  }

  private async findAvailablePort(startPort: number): Promise<number> {
    const net = require('net')
    
    return new Promise((resolve) => {
      const server = net.createServer()
      server.listen(startPort, () => {
        const port = server.address()?.port
        server.close(() => resolve(port || startPort))
      })
      server.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1))
      })
    })
  }
}

// Export singleton instance
export const worktreeManager = new WorktreeManager(process.cwd())