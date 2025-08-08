// AI Provider Manager
import { 
  BaseAIProvider,
  AIProviderType,
  ChatRequest,
  ChatResponse,
  StreamingChatResponse,
  ToolCall,
  CLAUDE_CODE_TOOLS,
  ToolDefinition
} from './types'
import { ClaudeAPIProvider, createClaudeProvider } from './claude-provider'
import { OllamaProvider, createOllamaProvider } from './ollama-provider'
import { LMStudioProvider, createLMStudioProvider } from './lmstudio-provider'
import { executeToolCall } from './tool-executor'

export class AIProviderManager {
  private providers = new Map<string, BaseAIProvider>()
  private activeProviderId: string | null = null

  constructor() {
    // Initialize default providers (will be unavailable until configured)
  }

  // Provider Management
  async addClaudeProvider(apiKey: string, model?: string, providerId = 'claude-default'): Promise<void> {
    const provider = createClaudeProvider(apiKey, model)
    this.providers.set(providerId, provider)
  }

  async addOllamaProvider(endpoint?: string, model?: string, providerId = 'ollama-default'): Promise<void> {
    const provider = createOllamaProvider(endpoint, model)
    this.providers.set(providerId, provider)
  }

  async addLMStudioProvider(endpoint?: string, model?: string, providerId = 'lmstudio-default'): Promise<void> {
    const provider = createLMStudioProvider(endpoint, model)
    this.providers.set(providerId, provider)
  }

  async removeProvider(providerId: string): Promise<void> {
    this.providers.delete(providerId)
    if (this.activeProviderId === providerId) {
      this.activeProviderId = null
    }
  }

  setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId
      return true
    }
    return false
  }

  getActiveProvider(): BaseAIProvider | null {
    if (!this.activeProviderId) return null
    return this.providers.get(this.activeProviderId) || null
  }

  getProvider(providerId: string): BaseAIProvider | null {
    return this.providers.get(providerId) || null
  }

  getAllProviders(): { id: string; provider: BaseAIProvider }[] {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({ id, provider }))
  }

  async getAvailableProviders(): Promise<{ id: string; provider: BaseAIProvider; available: boolean }[]> {
    const results = await Promise.all(
      Array.from(this.providers.entries()).map(async ([id, provider]) => ({
        id,
        provider,
        available: await provider.isAvailable()
      }))
    )
    return results
  }

  // Chat Methods
  async chat(request: ChatRequest, providerId?: string): Promise<ChatResponse> {
    const provider = providerId ? this.getProvider(providerId) : this.getActiveProvider()
    if (!provider) {
      throw new Error('No provider specified or active')
    }

    // Add Claude Code tools if tool calls are supported
    if (provider.supportsToolCalls()) {
      request.tools = request.tools || CLAUDE_CODE_TOOLS
    }

    const response = await provider.chat(request)

    // Execute tool calls if present
    if (response.toolCalls && response.toolCalls.length > 0) {
      const executedToolCalls = await Promise.all(
        response.toolCalls.map(async (toolCall) => {
          try {
            const result = await executeToolCall(toolCall)
            return {
              ...toolCall,
              result,
              status: 'completed' as const
            }
          } catch (error) {
            return {
              ...toolCall,
              result: { error: error instanceof Error ? error.message : 'Unknown error' },
              status: 'error' as const
            }
          }
        })
      )

      response.toolCalls = executedToolCalls
    }

    return response
  }

  async streamChat(request: ChatRequest, providerId?: string): Promise<StreamingChatResponse> {
    const provider = providerId ? this.getProvider(providerId) : this.getActiveProvider()
    if (!provider) {
      throw new Error('No provider specified or active')
    }

    if (!provider.supportsStreaming()) {
      throw new Error(`Provider ${provider.getName()} does not support streaming`)
    }

    // Add Claude Code tools if tool calls are supported
    if (provider.supportsToolCalls()) {
      request.tools = request.tools || CLAUDE_CODE_TOOLS
    }

    const streamingResponse = await provider.streamChat(request)
    
    // Wrap the stream to handle tool execution
    const originalStream = streamingResponse.stream
    const wrappedStream = async function* () {
      for await (const chunk of originalStream) {
        // Execute tool calls as they arrive
        if (chunk.toolCalls && chunk.toolCalls.length > 0) {
          const executedToolCalls = await Promise.all(
            chunk.toolCalls.map(async (toolCall) => {
              try {
                const result = await executeToolCall(toolCall)
                return {
                  ...toolCall,
                  result,
                  status: 'completed' as const
                }
              } catch (error) {
                return {
                  ...toolCall,
                  result: { error: error instanceof Error ? error.message : 'Unknown error' },
                  status: 'error' as const
                }
              }
            })
          )
          chunk.toolCalls = executedToolCalls
        }
        yield chunk
      }
    }

    return {
      stream: wrappedStream(),
      abort: streamingResponse.abort
    }
  }

  // Model Management
  async listModelsForProvider(providerId: string): Promise<string[]> {
    const provider = this.getProvider(providerId)
    if (!provider) return []
    return provider.listModels()
  }

  async listAllAvailableModels(): Promise<{ providerId: string; models: string[] }[]> {
    const results = await Promise.all(
      Array.from(this.providers.entries()).map(async ([id, provider]) => ({
        providerId: id,
        models: await provider.isAvailable() ? await provider.listModels() : []
      }))
    )
    return results.filter(result => result.models.length > 0)
  }

  // Configuration
  async autoDetectProviders(): Promise<void> {
    // Try to detect Claude API via environment variable
    const claudeApiKey = process.env.ANTHROPIC_API_KEY
    if (claudeApiKey && !this.providers.has('claude-default')) {
      await this.addClaudeProvider(claudeApiKey)
    }

    // Try to detect Ollama
    if (!this.providers.has('ollama-default')) {
      await this.addOllamaProvider()
    }

    // Try to detect LM Studio
    if (!this.providers.has('lmstudio-default')) {
      await this.addLMStudioProvider()
    }

    // Set first available provider as active
    if (!this.activeProviderId) {
      const availableProviders = await this.getAvailableProviders()
      const firstAvailable = availableProviders.find(p => p.available)
      if (firstAvailable) {
        this.setActiveProvider(firstAvailable.id)
      }
    }
  }

  getProviderStats(): {
    total: number
    available: number
    activeProviderId: string | null
    providerTypes: Record<AIProviderType, number>
  } {
    const providerTypes: Record<AIProviderType, number> = {
      'claude-api': 0,
      'ollama': 0,
      'lmstudio': 0
    }

    for (const provider of Array.from(this.providers.values())) {
      providerTypes[provider.getType()]++
    }

    return {
      total: this.providers.size,
      available: 0, // Would need async call to determine
      activeProviderId: this.activeProviderId,
      providerTypes
    }
  }
}

// Global instance
export const aiProviderManager = new AIProviderManager()

// Auto-detect providers on import (in Node.js environment)
if (typeof window === 'undefined') {
  aiProviderManager.autoDetectProviders().catch(console.error)
}