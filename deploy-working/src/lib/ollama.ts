// Ollama/LM Studio Local AI Integration Service
// Supports both Ollama and LM Studio APIs for local AI demonstrations

interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

interface LMStudioResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class LocalAIService {
  private ollamaUrl: string
  private lmStudioUrl: string
  private preferredProvider: 'ollama' | 'lmstudio'
  private defaultModel: string

  constructor(options: {
    ollamaUrl?: string
    lmStudioUrl?: string
    preferredProvider?: 'ollama' | 'lmstudio'
    defaultModel?: string
  } = {}) {
    this.ollamaUrl = options.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434'
    this.lmStudioUrl = options.lmStudioUrl || process.env.LM_STUDIO_URL || 'http://localhost:1234'
    this.preferredProvider = options.preferredProvider || 'ollama'
    this.defaultModel = options.defaultModel || 'llama3.1:8b'
  }

  // Check if local AI services are available
  async checkAvailability(): Promise<{
    ollama: boolean
    lmstudio: boolean
    availableModels: {
      ollama: string[]
      lmstudio: string[]
    }
  }> {
    const [ollamaAvailable, lmstudioAvailable] = await Promise.all([
      this.checkOllamaAvailability(),
      this.checkLMStudioAvailability()
    ])

    const availableModels = {
      ollama: ollamaAvailable ? await this.getOllamaModels() : [],
      lmstudio: lmstudioAvailable ? await this.getLMStudioModels() : []
    }

    return {
      ollama: ollamaAvailable,
      lmstudio: lmstudioAvailable,
      availableModels
    }
  }

  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  private async checkLMStudioAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${this.lmStudioUrl}/v1/models`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  private async getOllamaModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`)
      const data = await response.json()
      return data.models?.map((model: any) => model.name) || []
    } catch {
      return []
    }
  }

  private async getLMStudioModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.lmStudioUrl}/v1/models`)
      const data = await response.json()
      return data.data?.map((model: any) => model.id) || []
    } catch {
      return []
    }
  }

  // Generate business analysis using local AI
  async analyzeBusinessIdea(businessIdea: string): Promise<{
    marketSize: string
    competition: string
    targetDemographic: string
    profitMargins: string
    breakEvenTime: string
    revenueProjection: string
    recommendations: string[]
  }> {
    const prompt = `Analyze this business idea and provide a comprehensive market analysis:

Business Idea: ${businessIdea}

Please provide a JSON response with the following structure:
{
  "marketSize": "market size information",
  "competition": "competition level and analysis",
  "targetDemographic": "target customer demographics",
  "profitMargins": "expected profit margins",
  "breakEvenTime": "estimated break-even timeline",
  "revenueProjection": "revenue projection for first year",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Focus on realistic, actionable insights for a small business startup.`

    const response = await this.generateResponse(prompt)
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.warn('Failed to parse structured response, using fallback')
    }

    // Fallback to default analysis
    return {
      marketSize: "Market analysis pending - analyzing local competition and demand patterns",
      competition: "Moderate competition - conducting detailed competitor analysis",
      targetDemographic: "Young professionals, students, remote workers",
      profitMargins: "15-25% (typical for service-based businesses)",
      breakEvenTime: "8-12 months with proper execution",
      revenueProjection: "$120K-$200K estimated first-year revenue",
      recommendations: [
        "Focus on unique value proposition",
        "Build strong local community presence", 
        "Implement digital-first customer experience"
      ]
    }
  }

  // Generate business formation advice
  async generateFormationAdvice(businessType: string, location: string): Promise<{
    recommendedStructure: string
    requiredDocuments: string[]
    estimatedCosts: string
    timeline: string
    nextSteps: string[]
  }> {
    const prompt = `Provide business formation advice for a ${businessType} business in ${location}.

Please provide a JSON response with:
{
  "recommendedStructure": "LLC or Corporation recommendation with reasoning",
  "requiredDocuments": ["document 1", "document 2", "document 3"],
  "estimatedCosts": "total estimated formation costs",
  "timeline": "expected formation timeline",
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Focus on practical, actionable advice for a small business owner.`

    const response = await this.generateResponse(prompt)
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.warn('Failed to parse formation advice, using fallback')
    }

    return {
      recommendedStructure: "LLC (Limited Liability Company) - Recommended for most small businesses due to tax flexibility and liability protection",
      requiredDocuments: [
        "Articles of Organization", 
        "Operating Agreement", 
        "EIN Application (Form SS-4)",
        "Business License Application"
      ],
      estimatedCosts: "$200-$800 (including state fees and registered agent)",
      timeline: "2-4 weeks for complete formation",
      nextSteps: [
        "Choose and verify business name availability",
        "Prepare and file Articles of Organization",
        "Obtain Federal EIN from IRS",
        "Set up business banking account"
      ]
    }
  }

  // Generate conversational response for chat demos
  async generateChatResponse(messages: ChatMessage[], context?: string): Promise<string> {
    const systemMessage = context || `You are Goose, an AI business formation assistant integrated with Maverick. You help entrepreneurs create complete businesses from idea to revenue. You are enthusiastic, knowledgeable, and action-oriented. 

Key capabilities:
- Business idea analysis and validation
- Legal formation assistance (LLC, Corporation)
- Square payment integration setup
- Custom app generation through Claude Code
- End-to-end business deployment

Always be helpful, specific, and ready to take action. When users express interest, offer to start the business formation process immediately.`

    const conversationPrompt = [
      { role: 'system', content: systemMessage },
      ...messages
    ]

    return await this.generateResponse(
      conversationPrompt.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
    )
  }

  // Core response generation method
  private async generateResponse(prompt: string, model?: string): Promise<string> {
    const availability = await this.checkAvailability()
    
    // Try preferred provider first
    if (this.preferredProvider === 'ollama' && availability.ollama) {
      return await this.generateOllamaResponse(prompt, model)
    } else if (this.preferredProvider === 'lmstudio' && availability.lmstudio) {
      return await this.generateLMStudioResponse(prompt, model)
    }
    
    // Fallback to any available provider
    if (availability.ollama) {
      return await this.generateOllamaResponse(prompt, model)
    } else if (availability.lmstudio) {
      return await this.generateLMStudioResponse(prompt, model)
    }
    
    throw new Error('No local AI services available. Please ensure Ollama or LM Studio is running.')
  }

  private async generateOllamaResponse(prompt: string, model?: string): Promise<string> {
    const modelToUse = model || this.defaultModel

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data: OllamaResponse = await response.json()
    return data.response
  }

  private async generateLMStudioResponse(prompt: string, model?: string): Promise<string> {
    const response = await fetch(`${this.lmStudioUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'local-model',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`)
    }

    const data: LMStudioResponse = await response.json()
    return data.choices[0]?.message?.content || 'No response generated'
  }

  // Streaming response for real-time chat (Ollama only)
  async *generateStreamingResponse(prompt: string, model?: string): AsyncGenerator<string, void, unknown> {
    const availability = await this.checkAvailability()
    
    if (!availability.ollama) {
      throw new Error('Streaming requires Ollama. Please ensure Ollama is running.')
    }

    const modelToUse = model || this.defaultModel

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama streaming API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line)
            if (data.response) {
              yield data.response
            }
            if (data.done) {
              return
            }
          } catch (error) {
            // Skip invalid JSON lines
            continue
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

// Factory function for easy instantiation
export function createLocalAI(options?: {
  ollamaUrl?: string
  lmStudioUrl?: string
  preferredProvider?: 'ollama' | 'lmstudio'
  defaultModel?: string
}): LocalAIService {
  return new LocalAIService(options)
}

// Utility function for demo purposes
export async function getLocalAIStatus(): Promise<{
  available: boolean
  provider: string | null
  models: string[]
  recommendations: string[]
}> {
  const ai = createLocalAI()
  const availability = await ai.checkAvailability()
  
  const available = availability.ollama || availability.lmstudio
  const provider = availability.ollama ? 'ollama' : availability.lmstudio ? 'lmstudio' : null
  const models = availability.ollama 
    ? availability.availableModels.ollama 
    : availability.availableModels.lmstudio

  const recommendations = []
  
  if (!available) {
    recommendations.push('Install Ollama (https://ollama.ai) or LM Studio (https://lmstudio.ai)')
    recommendations.push('Run "ollama pull llama3.1:8b" to download a recommended model')
  } else if (models.length === 0) {
    recommendations.push('Download a model: ollama pull llama3.1:8b')
  } else {
    recommendations.push(`✅ Ready to use with ${models.length} model(s)`)
  }

  return {
    available,
    provider,
    models,
    recommendations
  }
}