import { spawn, ChildProcess } from 'child_process'
import { randomUUID } from 'crypto'
import * as path from 'path'
import * as fs from 'fs/promises'

export interface TerminalSession {
  id: string
  userId: string
  projectId?: string
  workingDirectory: string
  process?: ChildProcess
  createdAt: Date
  lastActivity: Date
  isActive: boolean
}

export interface TerminalMessage {
  type: 'input' | 'output' | 'error' | 'system' | 'exit'
  data: string
  timestamp: Date
  sessionId: string
}

export class ClaudeTerminalManager {
  private sessions = new Map<string, TerminalSession>()
  private baseWorkingDir = '/tmp/maverick/terminals'
  private sessionHistories = new Map<string, TerminalMessage[]>()
  
  constructor() {
    this.ensureBaseDirectory()
    // Clean up inactive sessions every 30 minutes
    setInterval(this.cleanupInactiveSessions.bind(this), 30 * 60 * 1000)
  }

  private async ensureBaseDirectory() {
    try {
      await fs.mkdir(this.baseWorkingDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create base working directory:', error)
    }
  }

  /**
   * Create a new Claude Code terminal session
   */
  async createSession(userId: string, projectId?: string): Promise<string> {
    const sessionId = randomUUID()
    
    // Determine working directory
    let workingDirectory: string
    if (projectId) {
      if (projectId === 'maverick') {
        // For Maverick project, use the actual codebase
        workingDirectory = process.cwd()
      } else {
        // For other projects, use project-specific directory
        workingDirectory = path.join(process.cwd(), 'projects', projectId)
      }
    } else {
      // Default to user-specific terminal workspace
      workingDirectory = path.join(this.baseWorkingDir, userId, sessionId)
    }

    // Ensure working directory exists
    await fs.mkdir(workingDirectory, { recursive: true })

    const session: TerminalSession = {
      id: sessionId,
      userId,
      projectId,
      workingDirectory,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    }

    this.sessions.set(sessionId, session)
    this.sessionHistories.set(sessionId, [])

    console.log(`🔧 Created terminal session ${sessionId} for user ${userId}`, {
      projectId,
      workingDirectory,
      timestamp: new Date().toISOString()
    })

    // Send welcome message
    this.addMessage(sessionId, {
      type: 'system',
      data: `🚀 Maverick Claude Code Terminal initialized\\n` +
            `Session: ${sessionId}\\n` +
            `Working Directory: ${workingDirectory}\\n` +
            `Project: ${projectId || 'Default'}\\n\\n` +
            `You can now interact with Claude Code directly!\\n` +
            `Type your message and press Enter.\\n\\n`,
      timestamp: new Date(),
      sessionId
    })

    return sessionId
  }

  /**
   * Start a Claude Code interactive session
   */
  async startClaudeProcess(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (session.process) {
      console.log(`Claude process already running for session ${sessionId}`)
      return true
    }

    try {
      console.log(`🔮 Starting Claude Code process for session ${sessionId}`, {
        workingDirectory: session.workingDirectory,
        timestamp: new Date().toISOString()
      })

      // Start Claude Code in interactive mode
      const process = spawn('claude', [], {
        cwd: session.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Ensure Claude Code can find node
          PATH: '/Users/tim/.nvm/versions/node/v22.17.0/bin:' + process.env.PATH,
          // Force interactive mode
          FORCE_COLOR: '1',
          TERM: 'xterm-256color'
        },
        shell: false
      })

      session.process = process
      session.lastActivity = new Date()

      // Handle process output
      process.stdout?.on('data', (data) => {
        const output = data.toString()
        this.addMessage(sessionId, {
          type: 'output',
          data: output,
          timestamp: new Date(),
          sessionId
        })
        session.lastActivity = new Date()
      })

      process.stderr?.on('data', (data) => {
        const error = data.toString()
        this.addMessage(sessionId, {
          type: 'error',
          data: error,
          timestamp: new Date(),
          sessionId
        })
        session.lastActivity = new Date()
      })

      process.on('close', (code) => {
        console.log(`🏁 Claude process closed for session ${sessionId} with code ${code}`)
        this.addMessage(sessionId, {
          type: 'system',
          data: `\\nClaude Code process exited with code ${code}\\n`,
          timestamp: new Date(),
          sessionId
        })
        session.process = undefined
        session.isActive = false
      })

      process.on('error', (error) => {
        console.error(`💥 Claude process error for session ${sessionId}:`, error)
        this.addMessage(sessionId, {
          type: 'error',
          data: `Process error: ${error.message}\\n`,
          timestamp: new Date(),
          sessionId
        })
        session.process = undefined
        session.isActive = false
      })

      console.log(`✅ Claude Code process started for session ${sessionId}`, {
        pid: process.pid,
        timestamp: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error(`Failed to start Claude process for session ${sessionId}:`, error)
      this.addMessage(sessionId, {
        type: 'error',
        data: `Failed to start Claude Code: ${error instanceof Error ? error.message : String(error)}\\n`,
        timestamp: new Date(),
        sessionId
      })
      return false
    }
  }

  /**
   * Send input to Claude Code process
   */
  async sendInput(sessionId: string, input: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Start Claude process if not already running
    if (!session.process) {
      const started = await this.startClaudeProcess(sessionId)
      if (!started) {
        return false
      }
    }

    if (!session.process || !session.process.stdin) {
      console.error(`No active Claude process for session ${sessionId}`)
      return false
    }

    try {
      // Log the input
      this.addMessage(sessionId, {
        type: 'input',
        data: input,
        timestamp: new Date(),
        sessionId
      })

      // Send to Claude process
      session.process.stdin.write(input + '\\n')
      session.lastActivity = new Date()

      return true
    } catch (error) {
      console.error(`Failed to send input to session ${sessionId}:`, error)
      this.addMessage(sessionId, {
        type: 'error',
        data: `Failed to send input: ${error instanceof Error ? error.message : String(error)}\\n`,
        timestamp: new Date(),
        sessionId
      })
      return false
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get session history
   */
  getSessionHistory(sessionId: string): TerminalMessage[] {
    return this.sessionHistories.get(sessionId) || []
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId)
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    console.log(`🛑 Closing terminal session ${sessionId}`)

    // Kill the Claude process if running
    if (session.process) {
      try {
        session.process.kill('SIGTERM')
        // Force kill after 5 seconds if not terminated
        setTimeout(() => {
          if (session.process && !session.process.killed) {
            session.process.kill('SIGKILL')
          }
        }, 5000)
      } catch (error) {
        console.error(`Error killing process for session ${sessionId}:`, error)
      }
    }

    // Save session history to file
    await this.saveSessionHistory(sessionId)

    // Remove from memory
    this.sessions.delete(sessionId)
    this.sessionHistories.delete(sessionId)

    return true
  }

  /**
   * Save session history to file
   */
  private async saveSessionHistory(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    const history = this.sessionHistories.get(sessionId)
    
    if (!session || !history || history.length === 0) {
      return
    }

    try {
      const historyDir = path.join(this.baseWorkingDir, 'history')
      await fs.mkdir(historyDir, { recursive: true })
      
      const historyFile = path.join(historyDir, `${sessionId}.json`)
      const historyData = {
        session: {
          id: session.id,
          userId: session.userId,
          projectId: session.projectId,
          workingDirectory: session.workingDirectory,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        },
        messages: history
      }
      
      await fs.writeFile(historyFile, JSON.stringify(historyData, null, 2))
      console.log(`💾 Saved session history for ${sessionId}`)
    } catch (error) {
      console.error(`Failed to save session history for ${sessionId}:`, error)
    }
  }

  /**
   * Add message to session history
   */
  private addMessage(sessionId: string, message: TerminalMessage): void {
    const history = this.sessionHistories.get(sessionId)
    if (history) {
      history.push(message)
      // Keep only last 1000 messages to prevent memory issues
      if (history.length > 1000) {
        history.splice(0, history.length - 1000)
      }
    }
  }

  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = new Date()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivity.getTime()
      if (inactiveTime > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive session ${sessionId}`)
        this.closeSession(sessionId)
      }
    }
  }
}

// Singleton instance
export const claudeTerminalManager = new ClaudeTerminalManager()