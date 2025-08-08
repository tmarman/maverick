// LM Studio Provider
import { 
  BaseAIProvider, 
  AIProviderConfig, 
  ChatRequest, 
  ChatResponse, 
  StreamingChatResponse,
  AIStreamChunk,
  ToolCall
} from './types'

export class LMStudioProvider extends BaseAIProvider {
  private endpoint: string

  constructor(config: AIProviderConfig) {
    super(config)
    this.endpoint = config.endpoint || 'http://localhost:1234'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/v1/models`)
      return response.ok
    } catch {
      return false
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now()

    const body: any = {
      model: request.model || this.config.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      stream: false
    }

    // Add tools if supported and provided
    if (request.tools && request.tools.length > 0 && this.supportsToolCalls()) {
      body.tools = request.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }))
    }

    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LM Studio error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const duration = Date.now() - startTime

    // Parse tool calls if present (OpenAI format)
    const toolCalls: ToolCall[] = []
    const choice = data.choices?.[0]
    if (choice?.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          parameters: JSON.parse(toolCall.function.arguments || '{}'),
          status: 'completed',
          timestamp: new Date().toISOString()
        })
      }
    }

    return {
      content: choice?.message?.content || '',
      toolCalls,
      metadata: {
        model: data.model || body.model,
        tokens: data.usage?.completion_tokens || 0,
        provider: 'lmstudio',
        duration
      }
    }
  }

  async streamChat(request: ChatRequest): Promise<StreamingChatResponse> {
    const body: any = {
      model: request.model || this.config.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      stream: true,
      stream_options: {
        include_usage: true
      }
    }

    // Add tools if supported and provided
    if (request.tools && request.tools.length > 0 && this.supportsToolCalls()) {
      body.tools = request.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }))
    }

    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LM Studio streaming error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()
    let aborted = false

    const stream = async function* (): AsyncGenerator<AIStreamChunk, void, unknown> {
      let buffer = ''
      const toolCalls: ToolCall[] = []

      try {
        while (!aborted) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.slice(6))
                const choice = data.choices?.[0]
                
                if (choice?.delta?.content) {
                  yield {
                    content: choice.delta.content,
                    isComplete: false,
                    toolCalls: [],
                    metadata: {
                      provider: 'lmstudio',
                      model: data.model || body.model
                    }
                  }
                } else if (choice?.delta?.tool_calls) {
                  // Handle streaming tool calls
                  for (const toolCallDelta of choice.delta.tool_calls) {
                    if (toolCallDelta.function?.name) {
                      const toolCall: ToolCall = {
                        id: toolCallDelta.id,
                        name: toolCallDelta.function.name,
                        parameters: JSON.parse(toolCallDelta.function.arguments || '{}'),
                        status: 'executing',
                        timestamp: new Date().toISOString()
                      }
                      toolCalls.push(toolCall)
                    }
                  }
                } else if (choice?.finish_reason) {
                  yield {
                    content: '',
                    isComplete: true,
                    toolCalls,
                    metadata: {
                      provider: 'lmstudio',
                      model: data.model || body.model,
                      tokens: data.usage?.completion_tokens
                    }
                  }
                  break
                }
              } catch (e) {
                console.warn('Failed to parse LM Studio streaming response:', line, e)
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
      const response = await fetch(`${this.endpoint}/v1/models`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.data?.map((model: any) => model.id) || []
    } catch {
      return []
    }
  }

  static createConfig(endpoint = 'http://localhost:1234', model?: string): AIProviderConfig {
    return {
      type: 'lmstudio',
      name: 'LM Studio',
      description: 'Local models via LM Studio',
      endpoint,
      model: model || 'local-model', // LM Studio uses whatever model is loaded
      isLocal: true,
      supportsStreaming: true,
      supportsToolCalls: true, // LM Studio supports OpenAI-compatible tool calling
      maxTokens: 4000,
      temperature: 0.7
    }
  }
}

export function createLMStudioProvider(endpoint?: string, model?: string): LMStudioProvider {
  const config = LMStudioProvider.createConfig(endpoint, model)
  return new LMStudioProvider(config)
}