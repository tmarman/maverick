import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export class ClaudeCodeProvider {
  private baseWorkingDir: string

  constructor(baseWorkingDir: string = '/tmp/maverick/workspaces') {
    this.baseWorkingDir = baseWorkingDir
  }

  /**
   * Generate a response using Claude Code for a specific project context
   */
  async generateResponse(
    message: string,
    context: string,
    projectId?: string,
    workingDirectory?: string
  ): Promise<string> {
    const workDir = workingDirectory || (projectId 
      ? path.join(this.baseWorkingDir, projectId)
      : path.join(this.baseWorkingDir, 'default'))

    // Ensure working directory exists
    await fs.mkdir(workDir, { recursive: true })

    // Build the full prompt with context
    const fullPrompt = `${context}\n\nUser Request: ${message}`

    try {
      // Use Claude Code with --print for single response
      const response = await this.executeClaude([
        '--print',
        '--output-format', 'text',
        fullPrompt
      ], workDir)

      return response.trim()
    } catch (error) {
      console.error('Claude Code execution error:', error)
      throw new Error('Failed to get response from Claude Code')
    }
  }

  /**
   * Generate chat response with conversation history
   */
  async generateChatResponse(
    messages: ChatMessage[], 
    context?: string,
    projectId?: string,
    workingDirectory?: string
  ): Promise<string> {
    const workDir = workingDirectory || (projectId 
      ? path.join(this.baseWorkingDir, projectId)
      : path.join(this.baseWorkingDir, 'default'))

    // Ensure working directory exists
    await fs.mkdir(workDir, { recursive: true })

    // Format conversation history
    const conversationHistory = this.formatConversationHistory(messages.slice(-5)) // Last 5 messages
    const latestMessage = messages[messages.length - 1]

    // Build full prompt with context and history
    const systemPrompt = this.getSystemPrompt(projectId)
    const fullPrompt = [
      systemPrompt,
      context ? `\nProject Context: ${context}` : '',
      conversationHistory ? `\nConversation History:\n${conversationHistory}` : '',
      `\nCurrent User Request: ${latestMessage.content}`,
      '\nPlease provide a helpful response:'
    ].filter(Boolean).join('\n')

    try {
      const response = await this.executeClaude([
        '--print',
        '--output-format', 'text',
        fullPrompt
      ], workDir)

      return response.trim()
    } catch (error) {
      console.error('Claude Code chat error:', error)
      throw new Error('Failed to get chat response from Claude Code')
    }
  }

  /**
   * Execute Claude Code command with specific arguments
   */
  private async executeClaude(args: string[], workingDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('claude', args, {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Add any specific environment variables for Claude Code
        }
      })

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
          reject(new Error(`Claude Code process exited with code ${code}: ${error}`))
        }
      })

      process.on('error', (err) => {
        reject(new Error(`Failed to start Claude Code: ${err.message}`))
      })
    })
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
    
    return formatted
  }
}

// Singleton instance
export const claudeCodeProvider = new ClaudeCodeProvider()

// Utility function for API integration - updated to match current usage
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

// Additional utility for single responses
export async function generateSingleResponse(
  message: string,
  context: string,
  projectId?: string,
  workingDirectory?: string
): Promise<string> {
  return claudeCodeProvider.generateResponse(message, context, projectId, workingDirectory)
}