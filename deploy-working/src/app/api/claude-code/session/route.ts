import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { spawn, ChildProcess } from 'child_process'
import { WebSocketServer } from 'ws'

interface ClaudeCodeSession {
  id: string
  process: ChildProcess
  userId: string
  projectId?: string
  workingDir: string
  createdAt: Date
}

class ClaudeCodeManager {
  private sessions = new Map<string, ClaudeCodeSession>()
  private wss: WebSocketServer | null = null

  initializeWebSocket(server: any) {
    if (this.wss) return
    
    this.wss = new WebSocketServer({ server, path: '/api/claude-code/ws' })
    
    this.wss.on('connection', async (ws, request) => {
      const url = new URL(request.url!, `http://${request.headers.host}`)
      const sessionId = url.searchParams.get('sessionId')
      const token = url.searchParams.get('token')
      
      if (!sessionId || !this.sessions.has(sessionId)) {
        ws.close(1008, 'Invalid session')
        return
      }
      
      const session = this.sessions.get(sessionId)!
      
      // Set up bidirectional communication
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          
          if (message.type === 'input') {
            // Send user input to Claude Code process
            session.process.stdin?.write(message.data + '\n')
          } else if (message.type === 'interrupt') {
            // Send interrupt signal (Ctrl+C)
            session.process.kill('SIGINT')
          }
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      })
      
      // Forward Claude Code output to WebSocket
      session.process.stdout?.on('data', (data) => {
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString()
        }))
      })
      
      session.process.stderr?.on('data', (data) => {
        ws.send(JSON.stringify({
          type: 'error',
          data: data.toString()
        }))
      })
      
      session.process.on('close', (code) => {
        ws.send(JSON.stringify({
          type: 'close',
          code
        }))
        this.sessions.delete(sessionId)
        ws.close()
      })
      
      ws.on('close', () => {
        // Clean up process if WebSocket closes
        if (session.process && !session.process.killed) {
          session.process.kill('SIGTERM')
        }
        this.sessions.delete(sessionId)
      })
    })
  }

  async createSession(userId: string, options: {
    projectId?: string
    workingDir?: string
    initialPrompt?: string
  }): Promise<string> {
    const sessionId = `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const workingDir = options.workingDir || process.cwd()
    
    // Spawn Claude Code process
    const claudeProcess = spawn('claude', ['--no-memory'], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Add any Maverick-specific environment variables
        MAVERICK_PROJECT_ID: options.projectId,
        MAVERICK_USER_ID: userId
      }
    })
    
    const session: ClaudeCodeSession = {
      id: sessionId,
      process: claudeProcess,
      userId,
      projectId: options.projectId,
      workingDir,
      createdAt: new Date()
    }
    
    this.sessions.set(sessionId, session)
    
    // Send initial prompt if provided
    if (options.initialPrompt) {
      claudeProcess.stdin?.write(options.initialPrompt + '\n')
    }
    
    // Auto-cleanup after 30 minutes of inactivity
    setTimeout(() => {
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId)!
        if (!session.process.killed) {
          session.process.kill('SIGTERM')
        }
        this.sessions.delete(sessionId)
      }
    }, 30 * 60 * 1000)
    
    return sessionId
  }

  getSession(sessionId: string): ClaudeCodeSession | undefined {
    return this.sessions.get(sessionId)
  }

  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (session) {
      if (!session.process.killed) {
        session.process.kill('SIGTERM')
      }
      this.sessions.delete(sessionId)
      return true
    }
    return false
  }

  getUserSessions(userId: string): ClaudeCodeSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId)
  }
}

const claudeCodeManager = new ClaudeCodeManager()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId, projectId, workingDir, initialPrompt } = body

    switch (action) {
      case 'create':
        const newSessionId = await claudeCodeManager.createSession(session.user.id, {
          projectId,
          workingDir,
          initialPrompt
        })
        
        return Response.json({
          success: true,
          sessionId: newSessionId,
          wsUrl: `/api/claude-code/ws?sessionId=${newSessionId}`
        })

      case 'terminate':
        if (!sessionId) {
          return Response.json({ error: 'Session ID required' }, { status: 400 })
        }
        
        const terminated = claudeCodeManager.terminateSession(sessionId)
        return Response.json({ success: terminated })

      case 'list':
        const userSessions = claudeCodeManager.getUserSessions(session.user.id)
        return Response.json({
          success: true,
          sessions: userSessions.map(s => ({
            id: s.id,
            projectId: s.projectId,
            workingDir: s.workingDir,
            createdAt: s.createdAt
          }))
        })

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Claude Code session error:', error)
    return Response.json(
      { error: 'Failed to manage Claude Code session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (sessionId) {
      const claudeSession = claudeCodeManager.getSession(sessionId)
      if (!claudeSession || claudeSession.userId !== session.user.id) {
        return Response.json({ error: 'Session not found' }, { status: 404 })
      }

      return Response.json({
        success: true,
        session: {
          id: claudeSession.id,
          projectId: claudeSession.projectId,
          workingDir: claudeSession.workingDir,
          createdAt: claudeSession.createdAt,
          active: !claudeSession.process.killed
        }
      })
    }

    // List all user sessions
    const userSessions = claudeCodeManager.getUserSessions(session.user.id)
    return Response.json({
      success: true,
      sessions: userSessions.map(s => ({
        id: s.id,
        projectId: s.projectId,
        workingDir: s.workingDir,
        createdAt: s.createdAt,
        active: !s.process.killed
      }))
    })
  } catch (error) {
    console.error('Claude Code session GET error:', error)
    return Response.json(
      { error: 'Failed to get Claude Code sessions' },
      { status: 500 }
    )
  }
}

// Export the manager for WebSocket setup
// claudeCodeManager instance is only used internally in this route