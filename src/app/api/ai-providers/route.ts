import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-providers'

// GET - List all providers
export async function GET() {
  try {
    const providersWithStatus = await aiProviderManager.getAvailableProviders()
    const stats = aiProviderManager.getProviderStats()

    return NextResponse.json({
      providers: providersWithStatus.map(({ id, provider, available }) => ({
        id,
        name: provider.getName(),
        type: provider.getType(),
        status: available ? 'active' : 'inactive',
        models: [], // Models will be loaded separately for performance
        config: provider.getConfig(),
        isLocal: provider.getConfig().isLocal,
        supportsStreaming: provider.supportsStreaming(),
        supportsToolCalls: provider.supportsToolCalls()
      })),
      stats
    })
  } catch (error) {
    console.error('Failed to get AI providers:', error)
    return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 })
  }
}

// POST - Add a new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, config } = body

    let providerId: string

    switch (type) {
      case 'claude-api':
        if (!config.apiKey) {
          return NextResponse.json({ error: 'API key is required for Claude API' }, { status: 400 })
        }
        providerId = `claude-api-${Date.now()}`
        await aiProviderManager.addClaudeProvider(config.apiKey, config.model, providerId)
        break
        
      case 'ollama':
        providerId = `ollama-${Date.now()}`
        await aiProviderManager.addOllamaProvider(config.endpoint, config.model, providerId)
        break
        
      case 'lmstudio':
        providerId = `lmstudio-${Date.now()}`
        await aiProviderManager.addLMStudioProvider(config.endpoint, config.model, providerId)
        break
        
      default:
        return NextResponse.json({ error: 'Unsupported provider type' }, { status: 400 })
    }

    const provider = aiProviderManager.getProvider(providerId)
    if (!provider) {
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    // Test the provider immediately
    const isAvailable = await provider.isAvailable()
    const models = isAvailable ? await provider.listModels() : []

    return NextResponse.json({
      provider: {
        id: providerId,
        name: provider.getName(),
        type: provider.getType(),
        status: isAvailable ? 'active' : 'inactive',
        models,
        config: provider.getConfig(),
        isLocal: provider.getConfig().isLocal,
        supportsStreaming: provider.supportsStreaming(),
        supportsToolCalls: provider.supportsToolCalls()
      }
    })
  } catch (error) {
    console.error('Failed to add AI provider:', error)
    return NextResponse.json({ error: 'Failed to add provider' }, { status: 500 })
  }
}