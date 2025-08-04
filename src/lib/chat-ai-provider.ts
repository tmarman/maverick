/**
 * Generic AI Provider Interface for Chat System
 * 
 * Supports multiple AI providers (Claude, Gemini, Ollama, OpenAI, etc)
 * and can be extended for local models and CLINE integration
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface ChatStreamChunk {
  type: 'content' | 'action' | 'done' | 'error'
  content?: string
  action?: ChatAction
  error?: string
}

export interface ChatAction {
  id: string
  type: 'create_task' | 'update_task' | 'run_command' | 'create_file' | 'commit_changes'
  title: string
  description?: string
  data?: Record<string, any>
}

export interface ChatContext {
  workingDirectory?: string
  projectName?: string
  branchName?: string
  taskId?: string
  codebaseContext?: string
  recentFiles?: string[]
}

export interface ChatProviderConfig {
  provider: 'claude' | 'gemini' | 'openai' | 'ollama' | 'cline' | 'local'
  model?: string
  apiKey?: string
  baseUrl?: string // For local models or custom endpoints
  maxTokens?: number
  temperature?: number
  userId?: string
}

export abstract class ChatAIProvider {
  protected config: ChatProviderConfig
  
  constructor(config: ChatProviderConfig) {
    this.config = config
  }

  abstract async streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void>

  abstract async isAvailable(): Promise<boolean>
  
  abstract getName(): string
  
  abstract getCapabilities(): string[]

  /**
   * Extract actionable items from AI response
   */
  protected extractActions(content: string, context: ChatContext): ChatAction[] {
    const actions: ChatAction[] = []
    
    // Look for task creation patterns
    if (content.toLowerCase().includes('create') && (content.toLowerCase().includes('task') || content.toLowerCase().includes('todo'))) {
      actions.push({
        id: Date.now().toString(),
        type: 'create_task',
        title: 'Create new task',
        description: 'Create a new task based on the conversation',
        data: { suggestedContent: content, context }
      })
    }

    // Look for command execution patterns
    const commandPattern = /```(?:bash|shell|cmd|terminal)\n([^`]+)```/g
    let match
    while ((match = commandPattern.exec(content)) !== null) {
      const command = match[1].trim()
      actions.push({
        id: Date.now().toString() + Math.random(),
        type: 'run_command',
        title: `Run: ${command.split('\n')[0]}`,
        description: `Execute command in ${context.workingDirectory || 'working directory'}`,
        data: { command, workingDirectory: context.workingDirectory, context }
      })
    }

    // Look for file creation patterns
    const filePattern = /```(\w+)?\n\/\/ (.*?\.(?:ts|js|tsx|jsx|py|java|go|rs))\n([^`]+)```/g
    while ((match = filePattern.exec(content)) !== null) {
      const fileName = match[2]
      const fileContent = match[3]
      actions.push({
        id: Date.now().toString() + Math.random(),
        type: 'create_file',
        title: `Create ${fileName}`,
        description: 'Create file based on the discussion',
        data: { fileName, content: fileContent, context }
      })
    }

    return actions
  }
}

/**
 * Claude API Provider
 */
export class ClaudeProvider extends ChatAIProvider {
  async streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void> {
    try {
      if (!this.config.apiKey) {
        onChunk({
          type: 'error',
          error: 'Claude API key not configured. Please set up your API key in Settings → Integrations.'
        })
        return
      }

      const systemPrompt = this.buildSystemPrompt(context)
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: this.config.maxTokens || 2000,
          messages: messages.filter(m => m.role !== 'system'),
          system: systemPrompt
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text || ''
      
      // Stream the response word by word
      const words = content.split(' ')
      for (let i = 0; i < words.length; i++) {
        const chunk = i === 0 ? words[i] : ' ' + words[i]
        onChunk({ type: 'content', content: chunk })
        await new Promise(resolve => setTimeout(resolve, 30))
      }

      // Extract and send actions
      const actions = this.extractActions(content, context)
      for (const action of actions) {
        onChunk({ type: 'action', action })
      }

      onChunk({ type: 'done' })

    } catch (error) {
      onChunk({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  getName(): string {
    return 'Claude'
  }

  getCapabilities(): string[] {
    return [
      'Code analysis and generation',
      'Task planning and breakdown',
      'File creation and modification',
      'Command execution suggestions',
      'Debugging assistance',
      'Documentation generation'
    ]
  }

  private buildSystemPrompt(context: ChatContext): string {
    let prompt = `You are Claude, an AI assistant helping with software development in the Maverick project management system.

CONTEXT:
- Project: ${context.projectName || 'Unknown'}
- Working Directory: ${context.workingDirectory || '/tmp/repos/maverick/main'}
`

    if (context.branchName) {
      prompt += `- Current Branch: ${context.branchName}\n`
    }

    if (context.taskId) {
      prompt += `- Task Context: You are working on a specific task (ID: ${context.taskId})\n`
    }

    prompt += `
CAPABILITIES:
You can suggest and execute actions like:
- Creating new tasks or subtasks
- Running terminal commands (use \`\`\`bash code blocks)
- Creating or modifying files (use \`\`\`language code blocks with // filename.ext)
- Planning implementation approaches
- Debugging and troubleshooting

Be conversational, practical, and provide actionable suggestions.
When you want to create files or run commands, use the appropriate code block format.
`

    return prompt
  }
}

/**
 * Gemini Provider (placeholder for future implementation)
 */
export class GeminiProvider extends ChatAIProvider {
  async streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void> {
    onChunk({
      type: 'error',
      error: 'Gemini provider not yet implemented'
    })
  }

  async isAvailable(): Promise<boolean> {
    return false
  }

  getName(): string {
    return 'Gemini'
  }

  getCapabilities(): string[] {
    return ['Coming soon']
  }
}

/**
 * Ollama Provider (for local models)
 */
export class OllamaProvider extends ChatAIProvider {
  async streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void> {
    try {
      const baseUrl = this.config.baseUrl || 'http://localhost:11434'
      const model = this.config.model || 'llama2'

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true
        })
      })

      if (!response.body) {
        throw new Error('No response body from Ollama')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              onChunk({ type: 'content', content: data.message.content })
            }
            if (data.done) {
              onChunk({ type: 'done' })
              return
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

    } catch (error) {
      onChunk({
        type: 'error',
        error: error instanceof Error ? error.message : 'Ollama connection failed'
      })
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const baseUrl = this.config.baseUrl || 'http://localhost:11434'
      const response = await fetch(`${baseUrl}/api/version`)
      return response.ok
    } catch {
      return false
    }
  }

  getName(): string {
    return `Ollama (${this.config.model || 'llama2'})`
  }

  getCapabilities(): string[] {
    return [
      'Local model execution',
      'Privacy-focused processing',
      'Code assistance',
      'General conversation'
    ]
  }
}

/**
 * CLINE Provider (future integration)
 */
export class CLINEProvider extends ChatAIProvider {
  async streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void> {
    onChunk({
      type: 'content',
      content: 'CLINE integration coming soon! This will provide advanced local code editing capabilities.'
    })
    onChunk({ type: 'done' })
  }

  async isAvailable(): Promise<boolean> {
    return false // Not implemented yet
  }

  getName(): string {
    return 'CLINE (Local Code Editor)'
  }

  getCapabilities(): string[] {
    return [
      'Advanced code editing',
      'Local model support',
      'IDE integration',
      'Project-wide refactoring'
    ]
  }
}

/**
 * Provider Factory
 */
export class ChatProviderFactory {
  static async createProvider(config: ChatProviderConfig): Promise<ChatAIProvider> {
    switch (config.provider) {
      case 'claude':
        return new ClaudeProvider(config)
      case 'gemini':
        return new GeminiProvider(config)
      case 'ollama':
        return new OllamaProvider(config)
      case 'cline':
        return new CLINEProvider(config)
      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }

  static async getAvailableProviders(userId?: string): Promise<Array<{ name: string, provider: string, available: boolean, capabilities: string[] }>> {
    const providers = [
      { name: 'Claude', provider: 'claude', config: { provider: 'claude' as const, userId } },
      { name: 'Gemini', provider: 'gemini', config: { provider: 'gemini' as const } },
      { name: 'Ollama', provider: 'ollama', config: { provider: 'ollama' as const } },
      { name: 'CLINE', provider: 'cline', config: { provider: 'cline' as const } }
    ]

    const results = await Promise.all(
      providers.map(async ({ name, provider, config }) => {
        try {
          const instance = await ChatProviderFactory.createProvider(config)
          const available = await instance.isAvailable()
          return {
            name,
            provider,
            available,
            capabilities: instance.getCapabilities()
          }
        } catch {
          return {
            name,
            provider,
            available: false,
            capabilities: []
          }
        }
      })
    )

    return results
  }
}