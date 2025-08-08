/**
 * Claude Code Browser Session Manager
 * Brings Claude Code CLI functionality directly into the browser
 */

import { spawn, ChildProcess } from 'child_process'
import { WebSocket } from 'ws'
import { EventEmitter } from 'events'

export interface ClaudeCodeSession {
  sessionId: string
  userId: string
  projectName: string
  claudeProcess?: ChildProcess
  status: 'initializing' | 'active' | 'paused' | 'terminated'
  workingDirectory: string
  lastActivity: Date
  conversationHistory: Message[]
  toolCallHistory: ToolCall[]
  contextSummary?: string
}

export interface Message {
  id: string
  role: 'human' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  agentRole?: string
}

export interface ToolCall {
  id: string
  name: string
  parameters: any
  result?: any
  status: 'executing' | 'completed' | 'error'
  timestamp: string
  duration?: number
}

export interface StreamingResponse {
  type: 'content' | 'tool_call' | 'tool_result' | 'session_update'
  content?: string
  toolCall?: ToolCall
  sessionUpdate?: Partial<ClaudeCodeSession>
}

export class ClaudeCodeSessionManager extends EventEmitter {
  private sessions = new Map<string, ClaudeCodeSession>()
  private readonly maxSessions = 10
  private readonly sessionTimeout = 30 * 60 * 1000 // 30 minutes

  /**
   * Create or resume a Claude Code session for browser use
   */
  async createSession(
    userId: string, 
    projectName: string,
    workingDirectory: string
  ): Promise<ClaudeCodeSession> {
    const sessionId = `${userId}-${projectName}-${Date.now()}`
    
    const session: ClaudeCodeSession = {
      sessionId,
      userId,
      projectName,
      status: 'initializing',
      workingDirectory,
      lastActivity: new Date(),
      conversationHistory: [],
      toolCallHistory: []
    }

    // Spawn Claude Code CLI process
    try {
      const claudeProcess = spawn('claude', [], {
        cwd: workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CLAUDE_SESSION_ID: sessionId,
          CLAUDE_USER: userId,
          CLAUDE_PROJECT: projectName
        }
      })

      session.claudeProcess = claudeProcess
      session.status = 'active'

      // Set up process event handlers
      this.setupProcessHandlers(session)
      
      // Store session
      this.sessions.set(sessionId, session)
      
      // Set up cleanup
      setTimeout(() => this.cleanupInactiveSessions(), this.sessionTimeout)

      console.log(`🚀 Created Claude Code session: ${sessionId}`)
      return session

    } catch (error) {
      session.status = 'terminated'
      throw new Error(`Failed to create Claude Code session: ${error}`)
    }
  }

  /**
   * Send message to Claude Code CLI and stream response
   */
  async sendMessage(
    sessionId: string, 
    message: string
  ): Promise<AsyncGenerator<StreamingResponse>> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.claudeProcess) {
      throw new Error(`Session ${sessionId} not found or not active`)
    }

    session.lastActivity = new Date()

    // Create async generator for streaming response
    return this.streamClaudeResponse(session, message)
  }

  /**
   * Stream Claude Code CLI response in real-time
   */
  private async* streamClaudeResponse(
    session: ClaudeCodeSession, 
    message: string
  ): AsyncGenerator<StreamingResponse> {
    const process = session.claudeProcess!
    
    // Send message to Claude Code CLI
    process.stdin?.write(message + '\n')

    let buffer = ''
    let currentToolCall: ToolCall | null = null

    // Set up data listeners
    const dataHandler = (data: Buffer) => {
      buffer += data.toString()
      
      // Process buffer for complete responses
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        const response = this.parseClaudeCodeOutput(line, currentToolCall)
        if (response) {
          if (response.type === 'tool_call') {
            currentToolCall = response.toolCall!
          }
          this.emit('streaming_response', response)
        }
      }
    }

    process.stdout?.on('data', dataHandler)

    // Wait for response completion
    return new Promise<AsyncGenerator<StreamingResponse>>((resolve) => {
      // This is a simplified version - in reality we'd need more sophisticated
      // parsing of Claude Code CLI output format
      resolve(this.createResponseGenerator(session))
    })
  }

  /**
   * Parse Claude Code CLI output into structured responses
   */
  private parseClaudeCodeOutput(
    output: string, 
    currentToolCall?: ToolCall | null
  ): StreamingResponse | null {
    try {
      // Parse different types of Claude Code output
      
      // Tool call detection
      if (output.includes('calling tool:')) {
        const toolName = this.extractToolName(output)
        const toolCall: ToolCall = {
          id: `tool-${Date.now()}`,
          name: toolName,
          parameters: {},
          status: 'executing',
          timestamp: new Date().toISOString()
        }
        
        return {
          type: 'tool_call',
          toolCall
        }
      }

      // Tool result detection
      if (output.includes('tool result:') && currentToolCall) {
        const result = this.extractToolResult(output)
        currentToolCall.result = result
        currentToolCall.status = 'completed'
        
        return {
          type: 'tool_result',
          toolCall: currentToolCall
        }
      }

      // Regular content
      if (output.trim() && !this.isSystemMessage(output)) {
        return {
          type: 'content',
          content: output
        }
      }

      return null

    } catch (error) {
      console.error('Error parsing Claude Code output:', error)
      return null
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ClaudeCodeSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Pause session (keep alive but inactive)
   */
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'paused'
      session.lastActivity = new Date()
    }
  }

  /**
   * Resume paused session
   */
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session && session.status === 'paused') {
      session.status = 'active'
      session.lastActivity = new Date()
    }
  }

  /**
   * Terminate session and cleanup resources
   */
  terminateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'terminated'
      
      // Kill Claude Code process
      if (session.claudeProcess) {
        session.claudeProcess.kill('SIGTERM')
      }
      
      // Remove from active sessions
      this.sessions.delete(sessionId)
      
      console.log(`🔌 Terminated Claude Code session: ${sessionId}`)
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): ClaudeCodeSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
  }

  /**
   * Compact conversation history when it gets too long
   */
  async compactSessionHistory(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || session.conversationHistory.length < 50) return

    // Use AI to summarize older conversation
    const oldMessages = session.conversationHistory.slice(0, -20) // Keep last 20
    const summary = await this.summarizeConversation(oldMessages)
    
    session.contextSummary = summary
    session.conversationHistory = session.conversationHistory.slice(-20)
    
    console.log(`📝 Compacted session history for ${sessionId}`)
  }

  // Private helper methods
  private setupProcessHandlers(session: ClaudeCodeSession): void {
    const process = session.claudeProcess!
    
    process.on('error', (error) => {
      console.error(`Claude Code process error for ${session.sessionId}:`, error)
      session.status = 'terminated'
    })
    
    process.on('exit', (code) => {
      console.log(`Claude Code process exited for ${session.sessionId} with code:`, code)
      session.status = 'terminated'
    })
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now()
    const cutoff = now - this.sessionTimeout
    
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.lastActivity.getTime() < cutoff) {
        console.log(`🧹 Cleaning up inactive session: ${sessionId}`)
        this.terminateSession(sessionId)
      }
    }
  }

  private extractToolName(output: string): string {
    // Parse tool name from Claude Code output
    const match = output.match(/calling tool: (\w+)/)
    return match ? match[1] : 'unknown'
  }

  private extractToolResult(output: string): any {
    // Parse tool result from Claude Code output
    try {
      const jsonMatch = output.match(/tool result: (.*)/)
      return jsonMatch ? JSON.parse(jsonMatch[1]) : output
    } catch {
      return output
    }
  }

  private isSystemMessage(output: string): boolean {
    // Detect system messages vs actual content
    return output.includes('system:') || output.includes('debug:')
  }

  private async* createResponseGenerator(
    session: ClaudeCodeSession
  ): AsyncGenerator<StreamingResponse> {
    // Simplified generator - would need more sophisticated implementation
    yield {
      type: 'content',
      content: 'Streaming response from Claude Code CLI...'
    }
  }

  private async summarizeConversation(messages: Message[]): Promise<string> {
    // Use AI to create conversation summary
    // This would call out to an AI service to summarize the conversation
    return `Summary of ${messages.length} previous messages...`
  }
}

// Singleton instance
export const claudeCodeSessionManager = new ClaudeCodeSessionManager()