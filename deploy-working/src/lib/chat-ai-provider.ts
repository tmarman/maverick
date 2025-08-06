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

export interface ModelMetadata {
  id: string
  name: string
  provider: string
  contextWindow: number
  inputCostPer1M: number  // Cost per million input tokens
  outputCostPer1M: number // Cost per million output tokens
  capabilities: string[]
  speed: 'fast' | 'medium' | 'slow'
  quality: 'basic' | 'good' | 'excellent'
  enabled: boolean
}

export interface UsageStats {
  inputTokens: number
  outputTokens: number
  totalCost: number
  conversationId?: string
  timestamp: Date
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
  provider: 'claude' | 'gemini' | 'openai' | 'ollama' | 'cline' | 'local' | 'openrouter'
  model?: string
  apiKey?: string
  baseUrl?: string // For local models or custom endpoints
  maxTokens?: number
  temperature?: number
  userId?: string
  costLimit?: number // Max cost per conversation
}

export abstract class ChatAIProvider {
  protected config: ChatProviderConfig
  
  constructor(config: ChatProviderConfig) {
    this.config = config
  }

  abstract streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void>

  abstract isAvailable(): Promise<boolean>
  
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
 * OpenRouter Provider - Access to 300+ models
 */
export class OpenRouterProvider extends ChatAIProvider {
  private usage: UsageStats = {
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    timestamp: new Date()
  }

  async streamChat(
    messages: ChatMessage[],
    context: ChatContext,
    onChunk: (chunk: ChatStreamChunk) => void
  ): Promise<void> {
    try {
      if (!this.config.apiKey) {
        onChunk({
          type: 'error',
          error: 'OpenRouter API key not configured. Please set up your API key in Settings → Integrations.'
        })
        return
      }

      const model = this.config.model || 'anthropic/claude-3.5-sonnet'
      const systemPrompt = this.buildSystemPrompt(context)
      
      // Prepare messages with system prompt
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content
        }))
      ]

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://maverick.ai',
          'X-Title': 'Maverick AI Business Platform'
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          max_tokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      if (!response.body) {
        throw new Error('No response body from OpenRouter')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6) // Remove 'data: ' prefix
          
          if (data === '[DONE]') {
            // Calculate usage and cost
            const modelData = getModelMetadata(model)
            if (modelData) {
              const inputTokens = this.estimateTokens(formattedMessages.map(m => m.content).join(' '))
              const outputTokens = this.estimateTokens(fullContent)
              const cost = this.calculateCost(inputTokens, outputTokens, modelData)
              
              this.usage = {
                inputTokens,
                outputTokens,
                totalCost: cost,
                conversationId: context.taskId,
                timestamp: new Date()
              }
            }

            // Extract and send actions
            const actions = this.extractActions(fullContent, context)
            for (const action of actions) {
              onChunk({ type: 'action', action })
            }

            onChunk({ type: 'done' })
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            
            if (content) {
              fullContent += content
              onChunk({ type: 'content', content })
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

    } catch (error) {
      onChunk({
        type: 'error',
        error: error instanceof Error ? error.message : 'OpenRouter connection failed'
      })
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.config.apiKey) return false
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  getName(): string {
    const model = this.config.model || 'anthropic/claude-3.5-sonnet'
    const modelName = model.split('/').pop() || model
    return `OpenRouter (${modelName})`
  }

  getCapabilities(): string[] {
    return [
      'Access to 300+ AI models',
      'Cost-effective model routing',
      'Multi-provider fallback',
      'Real-time usage tracking',
      'Code analysis and generation',
      'Task planning and execution'
    ]
  }

  getUsage(): UsageStats {
    return this.usage
  }

  private buildSystemPrompt(context: ChatContext): string {
    let prompt = `You are an AI assistant integrated with Maverick, an AI-native business formation and project management platform.

CONTEXT:
- Project: ${context.projectName || 'Unknown'}
- Working Directory: ${context.workingDirectory || '/tmp/repos/maverick/main'}
`

    if (context.branchName) {
      prompt += `- Current Branch: ${context.branchName}\n`
    }

    if (context.taskId) {
      prompt += `- Task Context: You are working on task ID: ${context.taskId}\n`
    }

    prompt += `
CAPABILITIES:
You can suggest actionable items such as:
- Creating new tasks or subtasks
- Running terminal commands (use \`\`\`bash code blocks)
- Creating or modifying files (use \`\`\`language code blocks with // filename.ext)
- Planning implementation approaches
- Debugging and troubleshooting

RESPONSE STYLE:
- Be conversational but practical
- Provide specific, actionable suggestions
- Use appropriate code blocks for commands and file creation
- Focus on helping with business formation, project management, and software development tasks
`

    return prompt
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for most models
    return Math.ceil(text.length / 4)
  }

  private calculateCost(inputTokens: number, outputTokens: number, model: ModelMetadata): number {
    const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M
    const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M
    return inputCost + outputCost
  }
}

/**
 * Model Metadata Registry
 */
const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  // Anthropic Models via OpenRouter
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    capabilities: ['code', 'analysis', 'reasoning', 'creative'],
    speed: 'fast',
    quality: 'excellent',
    enabled: true
  },
  'anthropic/claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    capabilities: ['code', 'analysis', 'fast-responses'],
    speed: 'fast',
    quality: 'good',
    enabled: true
  },
  // OpenAI Models
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    capabilities: ['code', 'analysis', 'reasoning', 'vision'],
    speed: 'medium',
    quality: 'excellent',
    enabled: true
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    capabilities: ['code', 'analysis', 'fast-responses'],
    speed: 'fast',
    quality: 'good',
    enabled: true
  },
  // Google Models
  'google/gemini-pro-1.5': {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'google',
    contextWindow: 2000000,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.0,
    capabilities: ['code', 'analysis', 'reasoning', 'large-context'],
    speed: 'medium',
    quality: 'excellent',
    enabled: true
  },
  'google/gemini-flash-1.5': {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    provider: 'google',
    contextWindow: 1000000,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.3,
    capabilities: ['code', 'analysis', 'fast-responses', 'large-context'],
    speed: 'fast',
    quality: 'good',
    enabled: true
  },
  // Meta Models
  'meta-llama/llama-3.1-70b-instruct': {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'meta',
    contextWindow: 131072,
    inputCostPer1M: 0.8,
    outputCostPer1M: 0.8,
    capabilities: ['code', 'analysis', 'reasoning', 'open-source'],
    speed: 'medium',
    quality: 'good',
    enabled: true
  },
  // Cohere Models
  'cohere/command-r-plus': {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    contextWindow: 128000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    capabilities: ['code', 'analysis', 'reasoning', 'rag'],
    speed: 'medium',
    quality: 'excellent',
    enabled: true
  }
}

export function getModelMetadata(modelId: string): ModelMetadata | null {
  return MODEL_REGISTRY[modelId] || null
}

export function getAllModels(): ModelMetadata[] {
  return Object.values(MODEL_REGISTRY)
}

export function getEnabledModels(): ModelMetadata[] {
  return Object.values(MODEL_REGISTRY).filter(model => model.enabled)
}

export function getBestModelForTask(
  task: 'code' | 'analysis' | 'creative' | 'fast' | 'cost-effective',
  maxCostPer1M?: number
): ModelMetadata | null {
  const models = getEnabledModels()
  
  let filteredModels = models.filter(model => 
    model.capabilities.includes(task === 'cost-effective' ? 'fast-responses' : task)
  )
  
  if (maxCostPer1M) {
    filteredModels = filteredModels.filter(model => 
      Math.max(model.inputCostPer1M, model.outputCostPer1M) <= maxCostPer1M
    )
  }
  
  if (filteredModels.length === 0) return null
  
  // Sort by quality and cost
  filteredModels.sort((a, b) => {
    if (task === 'cost-effective') {
      return (a.inputCostPer1M + a.outputCostPer1M) - (b.inputCostPer1M + b.outputCostPer1M)
    } else if (task === 'fast') {
      const speedOrder = { fast: 0, medium: 1, slow: 2 }
      return speedOrder[a.speed] - speedOrder[b.speed]
    } else {
      const qualityOrder = { excellent: 0, good: 1, basic: 2 }
      return qualityOrder[a.quality] - qualityOrder[b.quality]
    }
  })
  
  return filteredModels[0]
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
      case 'openrouter':
        return new OpenRouterProvider(config)
      case 'cline':
        return new CLINEProvider(config)
      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }

  static async getAvailableProviders(userId?: string): Promise<Array<{ name: string, provider: string, available: boolean, capabilities: string[] }>> {
    const providers = [
      { name: 'Claude', provider: 'claude', config: { provider: 'claude' as const, userId } },
      { name: 'OpenRouter', provider: 'openrouter', config: { provider: 'openrouter' as const, userId } },
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