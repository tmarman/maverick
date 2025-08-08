// Ollama Provider
import { 
  BaseAIProvider, 
  AIProviderConfig, 
  ChatRequest, 
  ChatResponse, 
  StreamingChatResponse,
  AIStreamChunk,
  ToolCall
} from './types'

export class OllamaProvider extends BaseAIProvider {
  private endpoint: string

  constructor(config: AIProviderConfig) {
    super(config)
    this.endpoint = config.endpoint || 'http://localhost:11434'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now()

    const body = {
      model: request.model || this.config.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: false,
      options: {
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        num_predict: request.maxTokens || this.config.maxTokens || 4000
      }
    }

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const duration = Date.now() - startTime

    return {
      content: data.message?.content || '',
      toolCalls: [], // Ollama tool calls would need special handling
      metadata: {
        model: data.model || body.model,
        tokens: data.eval_count || 0,
        provider: 'ollama',
        duration
      }
    }
  }

  async streamChat(request: ChatRequest): Promise<StreamingChatResponse> {
    const body = {
      model: request.model || this.config.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
      options: {
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        num_predict: request.maxTokens || this.config.maxTokens || 4000
      }
    }

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama streaming error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()
    let aborted = false

    const stream = async function* (): AsyncGenerator<AIStreamChunk, void, unknown> {
      let buffer = ''

      try {
        while (!aborted) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                
                if (data.message?.content) {
                  yield {
                    content: data.message.content,
                    isComplete: data.done || false,
                    toolCalls: [],
                    metadata: {
                      provider: 'ollama',
                      model: data.model || body.model,
                      tokens: data.eval_count
                    }
                  }
                }

                if (data.done) {
                  break
                }
              } catch (e) {
                console.warn('Failed to parse Ollama streaming response:', line, e)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    return {
      stream: stream(),
      abort: () => {
        aborted = true
        reader.releaseLock()
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.models?.map((model: any) => model.name) || []
    } catch {
      return []
    }
  }

  static createConfig(endpoint = 'http://localhost:11434', model = 'llama3.1'): AIProviderConfig {
    return {
      type: 'ollama',
      name: 'Ollama',
      description: 'Local models via Ollama',
      endpoint,
      model,
      isLocal: true,
      supportsStreaming: true,
      supportsToolCalls: false, // Ollama tool calling needs special implementation
      maxTokens: 4000,
      temperature: 0.7
    }
  }
}

export function createOllamaProvider(endpoint?: string, model?: string): OllamaProvider {
  const config = OllamaProvider.createConfig(endpoint, model)
  return new OllamaProvider(config)
}