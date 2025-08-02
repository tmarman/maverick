import { spawn, ChildProcess } from 'child_process'

interface ClaudeCodeChat {
  sessionId: string
  process: ChildProcess
  isReady: boolean
  lastActivity: Date
  messages: ChatMessage[]
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export class ClaudeCodeProvider {
  private sessions = new Map<string, ClaudeCodeChat>()
  private sessionTimeout = 30 * 60 * 1000 // 30 minutes

  /**
   * Create a long-running Claude Code session for chat
   */
  async createChatSession(projectId?: string): Promise<string> {
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const workingDir = projectId 
      ? `/tmp/maverick/projects/${projectId}`
      : `/tmp/maverick/chat/${sessionId}`

    // Ensure directory exists
    const fs = require('fs')
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true })
    }

    // Spawn Claude Code in conversation mode
    const claudeProcess = spawn('claude', [
      '--no-memory', // Let Maverick handle memory
      '--conversation', // Keep session alive for multiple exchanges
    ], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MAVERICK_SESSION_ID: sessionId,
        MAVERICK_PROJECT_ID: projectId || 'chat',
        MAVERICK_MODE: 'chat'
      }
    })

    const session: ClaudeCodeChat = {
      sessionId,
      process: claudeProcess,
      isReady: false,
      lastActivity: new Date(),
      messages: []
    }

    this.sessions.set(sessionId, session)

    // Set up process event handlers
    claudeProcess.stdout?.on('data', (data) => {
      this.updateActivity(sessionId)
    })

    claudeProcess.stderr?.on('data', (data) => {
      console.error(`Claude Code stderr [${sessionId}]:`, data.toString())
    })

    claudeProcess.on('close', (code) => {
      console.log(`Claude Code chat session closed [${sessionId}]: ${code}`)
      this.sessions.delete(sessionId)
    })

    // Initialize with system prompt
    const systemPrompt = this.getSystemPrompt(projectId)
    await this.sendMessage(sessionId, systemPrompt, 'system')

    session.isReady = true

    // Set up cleanup timer
    this.scheduleCleanup(sessionId)

    return sessionId
  }

  /**
   * Send a message to Claude Code and get response
   */
  async sendMessage(sessionId: string, message: string, role: 'user' | 'system' = 'user'): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session || session.process.killed) {
      throw new Error('Chat session not found or terminated')
    }

    this.updateActivity(sessionId)

    return new Promise((resolve, reject) => {
      let response = ''
      let timeout: NodeJS.Timeout

      // Set up response handler
      const onData = (data: Buffer) => {
        const chunk = data.toString()
        response += chunk
        
        // Claude Code typically ends responses with specific markers
        if (chunk.includes('\n\n') && response.trim().length > 0) {
          session.process.stdout?.off('data', onData)
          clearTimeout(timeout)
          
          // Clean up the response
          const cleanResponse = this.cleanResponse(response)
          
          // Store the exchange
          session.messages.push(
            { role, content: message, timestamp: new Date() },
            { role: 'assistant', content: cleanResponse, timestamp: new Date() }
          )
          
          resolve(cleanResponse)
        }
      }

      // Set up timeout
      timeout = setTimeout(() => {
        session.process.stdout?.off('data', onData)
        reject(new Error('Claude Code response timeout'))
      }, 30000) // 30 second timeout

      session.process.stdout?.on('data', onData)

      // Send the message
      const formattedMessage = role === 'system' 
        ? `System: ${message}\n\nPlease acknowledge and be ready for conversation.\n`
        : `${message}\n`
        
      session.process.stdin?.write(formattedMessage)
    })
  }

  /**
   * Generate chat response with context
   */
  async generateChatResponse(
    messages: ChatMessage[], 
    context?: string,
    projectId?: string
  ): Promise<string> {
    // Create or reuse session
    let sessionId = this.findActiveSession(projectId)
    if (!sessionId) {
      sessionId = await this.createChatSession(projectId)
    }

    // Format conversation history
    const conversationContext = messages.length > 1 
      ? this.formatConversationHistory(messages.slice(-5)) // Last 5 messages
      : ''

    const fullPrompt = `${context ? `Context: ${context}\n\n` : ''}${conversationContext}${messages[messages.length - 1].content}`

    return this.sendMessage(sessionId, fullPrompt, 'user')
  }

  /**
   * Get system prompt based on context
   */
  private getSystemPrompt(projectId?: string): string {
    const basePrompt = `You are an AI assistant integrated with Maverick, an AI-native founder platform. You help entrepreneurs with:

- Business strategy and planning
- Product requirements and specifications  
- Technical architecture decisions
- Code generation and development
- Market research and analysis

You are knowledgeable, helpful, and focused on actionable advice. Keep responses concise but comprehensive.`

    if (projectId) {
      return `${basePrompt}

You are currently working within project "${projectId}". You have access to the project's files and context. When relevant, reference the project's specific requirements and goals.`
    }

    return basePrompt
  }

  /**
   * Format conversation history for context
   */
  private formatConversationHistory(messages: ChatMessage[]): string {
    if (messages.length === 0) return ''
    
    const formatted = messages
      .slice(-4) // Last 4 messages for context
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')
    
    return `Previous conversation:\n${formatted}\n\nCurrent question:\n`
  }

  /**
   * Clean up Claude Code response
   */
  private cleanResponse(response: string): string {
    return response
      .trim()
      .replace(/^(Assistant:|Claude:)\s*/i, '') // Remove assistant prefixes
      .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
      .trim()
  }

  /**
   * Find active session for project
   */
  private findActiveSession(projectId?: string): string | null {
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.isReady && !session.process.killed) {
        // For now, reuse any active session
        // Could be more sophisticated with project matching
        return sessionId
      }
    }
    return null
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = new Date()
    }
  }

  /**
   * Schedule cleanup for inactive sessions
   */
  private scheduleCleanup(sessionId: string): void {
    setTimeout(() => {
      const session = this.sessions.get(sessionId)
      if (session) {
        const inactive = Date.now() - session.lastActivity.getTime()
        if (inactive > this.sessionTimeout) {
          this.terminateSession(sessionId)
        } else {
          // Schedule another cleanup check
          this.scheduleCleanup(sessionId)
        }
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
  }

  /**
   * Terminate a chat session
   */
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

  /**
   * Get session info
   */
  getSessionInfo(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    return {
      sessionId,
      isReady: session.isReady,
      messageCount: session.messages.length,
      lastActivity: session.lastActivity,
      active: !session.process.killed
    }
  }

  /**
   * List all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys()).filter(sessionId => {
      const session = this.sessions.get(sessionId)
      return session && session.isReady && !session.process.killed
    })
  }
}

// Singleton instance
export const claudeCodeProvider = new ClaudeCodeProvider()

// Utility function for API integration
export async function generateClaudeCodeResponse(
  message: string,
  context?: string,
  projectId?: string
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'user', content: message, timestamp: new Date() }
  ]
  
  return claudeCodeProvider.generateChatResponse(messages, context, projectId)
}