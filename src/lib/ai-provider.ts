import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export type AIProvider = 'claude-code' | 'gemini' | 'auto'

export interface AIProviderConfig {
  provider: AIProvider
  model?: string
  workingDirectory?: string
  additionalArgs?: string[]
}

export class MultiAIProvider {
  private baseWorkingDir: string

  constructor(baseWorkingDir: string = '/tmp/maverick/workspaces') {
    this.baseWorkingDir = baseWorkingDir
  }

  /**
   * Generate a response using the specified AI provider
   */
  async generateResponse(
    message: string,
    context: string,
    config: AIProviderConfig,
    projectId?: string
  ): Promise<string> {
    const workDir = config.workingDirectory || (projectId 
      ? path.join(this.baseWorkingDir, projectId)
      : path.join(this.baseWorkingDir, 'default'))

    // Ensure working directory exists
    await fs.mkdir(workDir, { recursive: true })

    // Build the full prompt with context
    const fullPrompt = `${context}\n\nUser Request: ${message}`

    // Choose provider automatically if needed
    const provider = config.provider === 'auto' ? await this.selectBestProvider() : config.provider

    try {
      switch (provider) {
        case 'claude-code':
          return await this.executeClaudeCode(fullPrompt, workDir, config.additionalArgs)
        case 'gemini':
          return await this.executeGemini(fullPrompt, workDir, config.model, config.additionalArgs)
        default:
          throw new Error(`Unsupported AI provider: ${provider}`)
      }
    } catch (error) {
      console.error(`${provider} execution error:`, error)
      
      // Fallback to alternative provider if auto mode
      if (config.provider === 'auto') {
        const fallbackProvider = provider === 'claude-code' ? 'gemini' : 'claude-code'
        console.log(`Falling back to ${fallbackProvider}`)
        try {
          return await this.generateResponse(message, context, { ...config, provider: fallbackProvider }, projectId)
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError)
        }
      }
      
      throw new Error(`Failed to get response from ${provider}`)
    }
  }

  /**
   * Generate chat response with conversation history
   */
  async generateChatResponse(
    messages: ChatMessage[], 
    context: string,
    config: AIProviderConfig,
    projectId?: string
  ): Promise<string> {
    const workDir = config.workingDirectory || (projectId 
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

    // Choose provider automatically if needed
    const provider = config.provider === 'auto' ? await this.selectBestProvider() : config.provider

    try {
      switch (provider) {
        case 'claude-code':
          return await this.executeClaudeCode(fullPrompt, workDir, config.additionalArgs)
        case 'gemini':
          return await this.executeGemini(fullPrompt, workDir, config.model, config.additionalArgs)
        default:
          throw new Error(`Unsupported AI provider: ${provider}`)
      }
    } catch (error) {
      console.error(`${provider} chat error:`, error)
      
      // Fallback to alternative provider if auto mode
      if (config.provider === 'auto') {
        const fallbackProvider = provider === 'claude-code' ? 'gemini' : 'claude-code'
        console.log(`Falling back to ${fallbackProvider} for chat`)
        try {
          return await this.generateChatResponse(messages, context, { ...config, provider: fallbackProvider }, projectId)
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError)
        }
      }
      
      throw new Error(`Failed to get chat response from ${provider}`)
    }
  }

  /**
   * Execute Claude Code command
   */
  private async executeClaudeCode(prompt: string, workingDir: string, additionalArgs?: string[]): Promise<string> {
    const args = ['--print', '--output-format', 'text', ...(additionalArgs || []), prompt]
    return this.executeCommand('claude', args, workingDir)
  }

  /**
   * Execute Gemini CLI command
   */
  private async executeGemini(prompt: string, workingDir: string, model?: string, additionalArgs?: string[]): Promise<string> {
    const args = ['--prompt', prompt]
    
    if (model) {
      args.unshift('--model', model)
    }
    
    if (additionalArgs) {
      args.unshift(...additionalArgs)
    }
    
    return this.executeCommand('gemini', args, workingDir)
  }

  /**
   * Execute a command with specified arguments
   */
  private async executeCommand(command: string, args: string[], workingDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
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
          resolve(output.trim())
        } else {
          reject(new Error(`${command} process exited with code ${code}: ${error}`))
        }
      })

      childProcess.on('error', (err) => {
        reject(new Error(`Failed to start ${command}: ${err.message}`))
      })
    })
  }

  /**
   * Check which AI providers are available
   */
  async checkAvailableProviders(): Promise<{ provider: AIProvider; available: boolean; version?: string }[]> {
    const providers = ['claude-code', 'gemini'] as const
    const results = []

    for (const provider of providers) {
      try {
        const command = provider === 'claude-code' ? 'claude' : 'gemini'
        const version = await this.executeCommand(command, ['--version'], process.cwd())
        results.push({ provider, available: true, version: version.trim() })
      } catch (error) {
        results.push({ provider, available: false })
      }
    }

    return results
  }

  /**
   * Select the best available provider
   */
  private async selectBestProvider(): Promise<AIProvider> {
    const available = await this.checkAvailableProviders()
    
    // Prefer Claude Code if available
    const claudeCode = available.find(p => p.provider === 'claude-code' && p.available)
    if (claudeCode) return 'claude-code'
    
    // Fall back to Gemini
    const gemini = available.find(p => p.provider === 'gemini' && p.available)
    if (gemini) return 'gemini'
    
    throw new Error('No AI providers are available')
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
export const multiAIProvider = new MultiAIProvider()

// Utility functions for backward compatibility and easy usage
export async function generateAIResponse(
  message: string,
  context: string,
  provider: AIProvider = 'auto',
  projectId?: string,
  model?: string
): Promise<string> {
  const config: AIProviderConfig = { provider, model }
  return multiAIProvider.generateResponse(message, context, config, projectId)
}

export async function generateAIChatResponse(
  messages: ChatMessage[],
  context: string,
  provider: AIProvider = 'auto',
  projectId?: string,
  model?: string
): Promise<string> {
  const config: AIProviderConfig = { provider, model }
  return multiAIProvider.generateChatResponse(messages, context, config, projectId)
}

// Legacy function for Claude Code compatibility
export async function generateClaudeCodeResponse(
  message: string,
  context?: string,
  projectId?: string
): Promise<string> {
  return generateAIResponse(message, context || '', 'claude-code', projectId)
}