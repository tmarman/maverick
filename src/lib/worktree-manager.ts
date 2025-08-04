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

export class WorktreeManager {
  private sessions = new Map<string, WorktreeSession>()
  private baseRepoPath: string
  private worktreeRoot: string

  constructor(baseRepoPath?: string) {
    // Use the dedicated agent workspace repository
    this.baseRepoPath = baseRepoPath || path.join(process.cwd(), 'repositories', 'maverick-agent-workspace')
    this.worktreeRoot = path.join(process.cwd(), 'repositories', 'worktrees')
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