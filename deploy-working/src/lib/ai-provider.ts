import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { claudeService } from './claude-service'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export type AIProvider = 'claude-code' | 'claude-api' | 'gemini' | 'auto'

export interface AIProviderConfig {
  provider: AIProvider
  model?: string
  workingDirectory?: string
  additionalArgs?: string[]
  userId?: string // For Claude API key lookups
}

export class MultiAIProvider {
  private baseWorkingDir: string

  constructor(baseWorkingDir: string = '/tmp/maverick/workspaces') {
    this.baseWorkingDir = baseWorkingDir
  }

  /**
   * Get the proper working directory for a project
   */
  private getProjectWorkingDirectory(projectId?: string): string {
    if (projectId) {
      // For real projects, use the actual project directory in the codebase
      // This gives Claude Code access to the actual code and project context
      const currentWorkingDir = process.cwd()
      const projectPath = path.join(currentWorkingDir, 'projects', projectId)
      
      // If this is a known project, use the main codebase directory for Claude Code
      // This allows Claude to see and work with the actual application code
      if (projectId === 'maverick') {
        return currentWorkingDir // Use the main maverick codebase directory
      }
      
      return projectPath
    }
    
    // Fallback to temporary directory for non-project contexts
    return path.join(this.baseWorkingDir, 'default')
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
    const requestId = Math.random().toString(36).substr(2, 9)
    console.log(`🎯 [${requestId}] AI Request started:`, {
      provider: config.provider,
      projectId,
      messageLength: message.length,
      contextLength: context.length,
      timestamp: new Date().toISOString()
    })
    
    const workDir = config.workingDirectory || this.getProjectWorkingDirectory(projectId)

    console.log(`📁 [${requestId}] Working directory:`, workDir)

    // Ensure working directory exists
    await fs.mkdir(workDir, { recursive: true })
    console.log(`✅ [${requestId}] Working directory ensured`)

    // Build the full prompt with context
    const fullPrompt = `${context}\n\nUser Request: ${message}`
    console.log(`📝 [${requestId}] Full prompt prepared:`, {
      length: fullPrompt.length,
      preview: fullPrompt.slice(0, 200) + '...'
    })

    // Choose provider automatically if needed
    const provider = config.provider === 'auto' ? await this.selectBestProvider(config.userId) : config.provider
    console.log(`🤖 [${requestId}] Selected provider:`, provider)

    try {
      let result: string
      switch (provider) {
        case 'claude-code':
          console.log(`🔮 [${requestId}] Executing Claude Code...`)
          result = await this.executeClaudeCode(fullPrompt, workDir, config.additionalArgs)
          break
        case 'claude-api':
          console.log(`🔑 [${requestId}] Executing Claude API...`)
          result = await this.executeClaudeAPI(fullPrompt, config.model, config.userId)
          break
        case 'gemini':
          console.log(`💎 [${requestId}] Executing Gemini...`)
          result = await this.executeGemini(fullPrompt, workDir, config.model, config.additionalArgs)
          break
        default:
          throw new Error(`Unsupported AI provider: ${provider}`)
      }
      
      console.log(`🎉 [${requestId}] AI Response successful:`, {
        provider,
        resultLength: result.length,
        preview: result.slice(0, 200) + '...'
      })
      return result
    } catch (error) {
      console.error(`❌ [${requestId}] ${provider} execution error:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Fallback to alternative provider if auto mode
      if (config.provider === 'auto') {
        const fallbackProvider = provider === 'claude-code' ? 'gemini' : 'claude-code'
        console.log(`🔄 [${requestId}] Falling back to ${fallbackProvider}`)
        try {
          return await this.generateResponse(message, context, { ...config, provider: fallbackProvider }, projectId)
        } catch (fallbackError) {
          console.error(`💥 [${requestId}] Fallback provider ${fallbackProvider} also failed:`, fallbackError)
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
    const chatId = Math.random().toString(36).substr(2, 9)
    console.log(`💬 [${chatId}] Chat Request started:`, {
      provider: config.provider,
      projectId,
      messagesCount: messages.length,
      contextLength: context.length,
      timestamp: new Date().toISOString()
    })
    
    const workDir = config.workingDirectory || this.getProjectWorkingDirectory(projectId)

    console.log(`📁 [${chatId}] Chat working directory:`, workDir)

    // Ensure working directory exists
    await fs.mkdir(workDir, { recursive: true })
    console.log(`✅ [${chatId}] Chat working directory ensured`)

    // Format conversation history
    const conversationHistory = this.formatConversationHistory(messages.slice(-5)) // Last 5 messages
    const latestMessage = messages[messages.length - 1]
    
    console.log(`📜 [${chatId}] Chat context prepared:`, {
      historyLength: conversationHistory.length,
      latestMessageLength: latestMessage.content.length,
      lastMessagesUsed: Math.min(5, messages.length)
    })

    // Build full prompt with context and history
    const systemPrompt = this.getSystemPrompt(projectId)
    const fullPrompt = [
      systemPrompt,
      context ? `\nProject Context: ${context}` : '',
      conversationHistory ? `\nConversation History:\n${conversationHistory}` : '',
      `\nCurrent User Request: ${latestMessage.content}`,
      '\nPlease provide a helpful response:'
    ].filter(Boolean).join('\n')
    
    console.log(`📝 [${chatId}] Chat prompt prepared:`, {
      length: fullPrompt.length,
      preview: fullPrompt.slice(0, 300) + '...'
    })

    // Choose provider automatically if needed
    const provider = config.provider === 'auto' ? await this.selectBestProvider(config.userId) : config.provider
    console.log(`🤖 [${chatId}] Chat provider selected:`, provider)

    try {
      let result: string
      switch (provider) {
        case 'claude-code':
          console.log(`🔮 [${chatId}] Executing Claude Code for chat...`)
          result = await this.executeClaudeCode(fullPrompt, workDir, config.additionalArgs)
          break
        case 'claude-api':
          console.log(`🔑 [${chatId}] Executing Claude API for chat...`)
          result = await this.executeClaudeAPI(fullPrompt, config.model, config.userId)
          break
        case 'gemini':
          console.log(`💎 [${chatId}] Executing Gemini for chat...`)
          result = await this.executeGemini(fullPrompt, workDir, config.model, config.additionalArgs)
          break
        default:
          throw new Error(`Unsupported AI provider: ${provider}`)
      }
      
      console.log(`🎉 [${chatId}] Chat Response successful:`, {
        provider,
        resultLength: result.length,
        preview: result.slice(0, 200) + '...'
      })
      return result
    } catch (error) {
      console.error(`❌ [${chatId}] ${provider} chat error:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Fallback to alternative provider if auto mode
      if (config.provider === 'auto') {
        const fallbackProvider = provider === 'claude-code' ? 'gemini' : 'claude-code'
        console.log(`🔄 [${chatId}] Falling back to ${fallbackProvider} for chat`)
        try {
          return await this.generateChatResponse(messages, context, { ...config, provider: fallbackProvider }, projectId)
        } catch (fallbackError) {
          console.error(`💥 [${chatId}] Fallback provider ${fallbackProvider} also failed:`, fallbackError)
        }
      }
      
      throw new Error(`Failed to get chat response from ${provider}`)
    }
  }

  /**
   * Execute Claude Code command
   */
  private async executeClaudeCode(prompt: string, workingDir: string, additionalArgs?: string[]): Promise<string> {
    // Add verbose flag and other helpful options
    const args = ['--verbose', '-p', prompt, ...(additionalArgs || [])]
    console.log('🤖 Claude Code Execution:', {
      workingDir,
      promptLength: prompt.length,
      args: args.slice(0, 3), // Don't log full prompt for security
      additionalArgs: additionalArgs || [],
      verboseMode: true
    })
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
   * Execute Claude API call directly
   */
  private async executeClaudeAPI(prompt: string, model?: string, userId?: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID required for Claude API calls')
    }

    const apiKey = await claudeService.getApiKey(userId)
    if (!apiKey) {
      throw new Error('No Claude API key found for user. Please connect your Claude API key in settings.')
    }

    const requestModel = model || 'claude-3-haiku-20240307' // Default to Haiku for speed
    
    console.log('🔑 Claude API Request:', {
      model: requestModel,
      promptLength: prompt.length,
      hasApiKey: !!apiKey
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: requestModel,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Claude API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text
    } else {
      console.error('Unexpected Claude API response format:', data)
      throw new Error('Unexpected response format from Claude API')
    }
  }

  /**
   * Execute a command with specified arguments
   */
  private async executeCommand(command: string, args: string[], workingDir: string): Promise<string> {
    const startTime = Date.now()
    const executionId = Math.random().toString(36).substr(2, 9)
    const timeoutMs = 60000 // 1 minute timeout - fail faster for better UX
    
    console.log(`🚀 [${executionId}] Starting ${command} execution:`, {
      command,
      argsCount: args.length,
      workingDir,
      timeoutMs,
      timestamp: new Date().toISOString()
    })
    
    return new Promise((resolve, reject) => {
      // Try using shell mode to avoid stdio issues
      const childProcess = spawn('/bin/bash', ['-c', `${command} ${args.map(arg => `'${arg.replace(/'/g, "'\"'\"'")}'`).join(' ')}`], {
        cwd: workingDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PATH: '/Users/tim/.nvm/versions/node/v22.17.0/bin:' + process.env.PATH
        },
        shell: false,
        detached: false
      })

      let output = ''
      let error = ''
      let stdoutChunks: string[] = []
      let stderrChunks: string[] = []
      let isResolved = false
      
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          const duration = Date.now() - startTime
          console.error(`⏰ [${executionId}] Process timeout after ${duration}ms:`, {
            timeoutMs,
            outputReceived: output.length,
            errorReceived: error.length,
            lastOutput: output.slice(-200)
          })
          
          // Kill the process
          try {
            childProcess.kill('SIGTERM')
            setTimeout(() => {
              if (!childProcess.killed) {
                console.log(`💥 [${executionId}] Force killing process`)
                childProcess.kill('SIGKILL')
              }
            }, 5000)
          } catch (killError) {
            console.error(`💥 [${executionId}] Error killing process:`, killError)
          }
          
          reject(new Error(`${command} process timed out after ${timeoutMs}ms`))
        }
      }, timeoutMs)
      
      // Add periodic heartbeat logging
      const heartbeatInterval = setInterval(() => {
        if (!isResolved) {
          const duration = Date.now() - startTime
          console.log(`📟 [${executionId}] Process heartbeat:`, {
            duration: `${duration}ms`,
            outputLength: output.length,
            lastChunk: stdoutChunks.length > 0 ? stdoutChunks[stdoutChunks.length - 1].slice(0, 100) : 'none'
          })
        }
      }, 10000) // Every 10 seconds

      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString()
        output += chunk
        stdoutChunks.push(chunk)
        const duration = Date.now() - startTime
        console.log(`📤 [${executionId}] stdout chunk (${duration}ms):`, {
          length: chunk.length,
          preview: chunk.slice(0, 200) + (chunk.length > 200 ? '...' : ''),
          totalOutput: output.length
        })
      })

      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString()
        error += chunk
        stderrChunks.push(chunk)
        const duration = Date.now() - startTime
        console.log(`⚠️ [${executionId}] stderr chunk (${duration}ms):`, {
          length: chunk.length,
          preview: chunk.slice(0, 200) + (chunk.length > 200 ? '...' : ''),
          totalError: error.length
        })
      })

      childProcess.on('close', (code) => {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeoutHandle)
          clearInterval(heartbeatInterval)
          
          const duration = Date.now() - startTime
          console.log(`🏁 [${executionId}] ${command} process completed:`, {
            exitCode: code,
            duration: `${duration}ms`,
            outputLength: output.length,
            errorLength: error.length,
            stdoutChunks: stdoutChunks.length,
            stderrChunks: stderrChunks.length
          })
          
          if (code === 0) {
            console.log(`✅ [${executionId}] Success - output preview:`, {
              length: output.length,
              preview: output.slice(0, 500) + (output.length > 500 ? '...' : ''),
              hasContent: output.trim().length > 0
            })
            resolve(output.trim())
          } else {
            const errorMsg = `${command} process exited with code ${code}: ${error}`
            console.error(`❌ [${executionId}] Failed:`, {
              exitCode: code,
              errorMessage: error.slice(0, 1000),
              outputReceived: output.slice(0, 500),
              duration: `${duration}ms`
            })
            reject(new Error(errorMsg))
          }
        }
      })

      childProcess.on('error', (err) => {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeoutHandle)
          clearInterval(heartbeatInterval)
          
          const duration = Date.now() - startTime
          const errorMsg = `Failed to start ${command}: ${err.message}`
          console.error(`💥 [${executionId}] Process spawn error:`, {
            error: err.message,
            duration: `${duration}ms`,
            command,
            workingDir
          })
          reject(new Error(errorMsg))
        }
      })
      
      // Log process start
      console.log(`🔄 [${executionId}] Process spawned:`, {
        pid: childProcess.pid,
        command,
        workingDir,
        timeout: `${timeoutMs}ms`
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
  private async selectBestProvider(userId?: string): Promise<AIProvider> {
    const available = await this.checkAvailableProviders()
    
    // Prefer Claude API if user has API key (fastest and most reliable)
    if (userId) {
      const hasApiKey = await claudeService.hasConnection(userId)
      if (hasApiKey) return 'claude-api'
    }
    
    // Fall back to Claude Code if available
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
  model?: string,
  userId?: string
): Promise<string> {
  const config: AIProviderConfig = { provider, model, userId }
  return multiAIProvider.generateResponse(message, context, config, projectId)
}

export async function generateAIChatResponse(
  messages: ChatMessage[],
  context: string,
  provider: AIProvider = 'auto',
  projectId?: string,
  model?: string,
  userId?: string
): Promise<string> {
  const config: AIProviderConfig = { provider, model, userId }
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