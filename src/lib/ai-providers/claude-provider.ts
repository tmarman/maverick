// Claude API Provider
import { 
  BaseAIProvider, 
  AIProviderConfig, 
  ChatRequest, 
  ChatResponse, 
  StreamingChatResponse,
  AIStreamChunk,
  ToolCall,
  CLAUDE_CODE_TOOLS
} from './types'

export class ClaudeAPIProvider extends BaseAIProvider {
  private apiKey: string
  private baseURL = 'https://api.anthropic.com/v1'

  constructor(config: AIProviderConfig & { apiKey: string }) {
    super(config)
    this.apiKey = config.apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      return response.status !== 401 // Not unauthorized
    } catch {
      return false
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now()
    
    const body: any = {
      model: request.model || this.config.model || 'claude-3-sonnet-20240229',
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: request.temperature ?? this.config.temperature ?? 0.7
    }

    if (request.systemPrompt) {
      body.system = request.systemPrompt
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters
      }))
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const duration = Date.now() - startTime

    // Parse tool calls if present
    const toolCalls: ToolCall[] = []
    if (data.content) {
      for (const content of data.content) {
        if (content.type === 'tool_use') {
          toolCalls.push({
            id: content.id,
            name: content.name,
            parameters: content.input,
            status: 'completed',
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // Extract text content
    const textContent = data.content
      ?.filter((c: any) => c.type === 'text')
      ?.map((c: any) => c.text)
      ?.join('\n') || ''

    return {
      content: textContent,
      toolCalls,
      metadata: {
        model: data.model,
        tokens: data.usage?.output_tokens || 0,
        provider: 'claude-api',
        duration
      }
    }
  }

  async streamChat(request: ChatRequest): Promise<StreamingChatResponse> {
    const body: any = {
      model: request.model || this.config.model || 'claude-3-sonnet-20240229',
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      stream: true
    }

    if (request.systemPrompt) {
      body.system = request.systemPrompt
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters
      }))
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API streaming error: ${response.status} - ${error}`)
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
                
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  yield {
                    content: data.delta.text,
                    isComplete: false,
                    toolCalls: [],
                    metadata: {
                      provider: 'claude-api',
                      model: body.model
                    }
                  }
                } else if (data.type === 'content_block_start' && data.content_block?.type === 'tool_use') {
                  const toolCall: ToolCall = {
                    id: data.content_block.id,
                    name: data.content_block.name,
                    parameters: {},
                    status: 'executing',
                    timestamp: new Date().toISOString()
                  }
                  toolCalls.push(toolCall)
                } else if (data.type === 'message_stop') {
                  yield {
                    content: '',
                    isComplete: true,
                    toolCalls,
                    metadata: {
                      provider: 'claude-api',
                      model: body.model
                    }
                  }
                  break
                }
              } catch (e) {
                console.warn('Failed to parse streaming response:', line, e)
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
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022'
    ]
  }

  static createConfig(): AIProviderConfig {
    return {
      type: 'claude-api',
      name: 'Claude API',
      description: 'Anthropic Claude via direct API access',
      model: 'claude-3-5-sonnet-20240620',
      isLocal: false,
      supportsStreaming: true,
      supportsToolCalls: true,
      maxTokens: 4000,
      temperature: 0.7
    }
  }
}

export function createClaudeProvider(apiKey: string, model?: string): ClaudeAPIProvider {
  const config = ClaudeAPIProvider.createConfig()
  if (model) config.model = model
  
  return new ClaudeAPIProvider({ ...config, apiKey })
}