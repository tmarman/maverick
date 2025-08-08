// AI Provider Types and Interfaces

export type AIProviderType = 'claude-api' | 'ollama' | 'lmstudio'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  parameters: any
  result?: any
  status: 'executing' | 'completed' | 'error'
  timestamp: string
}

export interface AIStreamChunk {
  content: string
  isComplete: boolean
  toolCalls?: ToolCall[]
  metadata?: {
    model?: string
    tokens?: number
    provider?: AIProviderType
  }
}

export interface AIProviderConfig {
  type: AIProviderType
  name: string
  description: string
  endpoint?: string
  apiKey?: string
  model: string
  isLocal: boolean
  supportsStreaming: boolean
  supportsToolCalls: boolean
  maxTokens?: number
  temperature?: number
}

export interface ChatRequest {
  messages: AIMessage[]
  stream?: boolean
  tools?: ToolDefinition[]
  maxTokens?: number
  temperature?: number
  model?: string
  systemPrompt?: string
}

export interface ChatResponse {
  content: string
  toolCalls?: ToolCall[]
  metadata?: {
    model: string
    tokens: number
    provider: AIProviderType
    duration: number
  }
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface StreamingChatResponse {
  stream: AsyncGenerator<AIStreamChunk, void, unknown>
  abort: () => void
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
  }

  abstract isAvailable(): Promise<boolean>
  abstract chat(request: ChatRequest): Promise<ChatResponse>
  abstract streamChat(request: ChatRequest): Promise<StreamingChatResponse>
  abstract listModels(): Promise<string[]>

  getConfig(): AIProviderConfig {
    return { ...this.config }
  }

  getName(): string {
    return this.config.name
  }

  getType(): AIProviderType {
    return this.config.type
  }

  supportsStreaming(): boolean {
    return this.config.supportsStreaming
  }

  supportsToolCalls(): boolean {
    return this.config.supportsToolCalls
  }
}

// Tool definitions for Claude Code-style functionality
export const CLAUDE_CODE_TOOLS: ToolDefinition[] = [
  {
    name: 'Read',
    description: 'Read a file from the filesystem',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to read'
        }
      },
      required: ['file_path']
    }
  },
  {
    name: 'Edit',
    description: 'Edit a file by replacing text',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to edit'
        },
        old_string: {
          type: 'string',
          description: 'The text to replace'
        },
        new_string: {
          type: 'string',
          description: 'The new text'
        }
      },
      required: ['file_path', 'old_string', 'new_string']
    }
  },
  {
    name: 'Write',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to write'
        },
        content: {
          type: 'string',
          description: 'The content to write'
        }
      },
      required: ['file_path', 'content']
    }
  },
  {
    name: 'Bash',
    description: 'Execute a bash command',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute'
        },
        description: {
          type: 'string',
          description: 'Description of what the command does'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'Glob',
    description: 'Search for files using glob patterns',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The glob pattern to search for'
        },
        path: {
          type: 'string',
          description: 'The directory to search in (optional)'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'Grep',
    description: 'Search for text in files using ripgrep',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The search pattern'
        },
        path: {
          type: 'string',
          description: 'File or directory to search in'
        },
        glob: {
          type: 'string',
          description: 'Glob pattern to filter files'
        }
      },
      required: ['pattern']
    }
  }
]