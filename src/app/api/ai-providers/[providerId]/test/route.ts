import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-providers'

// POST - Test a provider connection and capabilities
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params
    
    const provider = aiProviderManager.getProvider(providerId)
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    console.log(`🧪 Testing provider: ${provider.getName()}`)

    // Test availability
    const isAvailable = await provider.isAvailable()
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        error: 'Provider is not available',
        details: `Failed to connect to ${provider.getName()}. Check your configuration.`
      })
    }

    // Test model listing
    const models = await provider.listModels()
    
    // Test basic chat functionality (if available)
    let chatTest = null
    try {
      if (models.length > 0) {
        const testResponse = await provider.chat({
          messages: [{
            role: 'user',
            content: 'Hello! Please respond with just "Test successful" to confirm you are working.',
            timestamp: new Date().toISOString()
          }],
          maxTokens: 20,
          temperature: 0
        })
        
        chatTest = {
          success: true,
          response: testResponse.content,
          metadata: testResponse.metadata
        }
      }
    } catch (chatError) {
      chatTest = {
        success: false,
        error: chatError instanceof Error ? chatError.message : 'Chat test failed'
      }
    }

    return NextResponse.json({
      success: true,
      provider: {
        id: providerId,
        name: provider.getName(),
        type: provider.getType()
      },
      tests: {
        connection: { success: isAvailable },
        models: { 
          success: models.length > 0, 
          count: models.length,
          models: models.slice(0, 5) // Return first 5 for display
        },
        chat: chatTest,
        capabilities: {
          streaming: provider.supportsStreaming(),
          toolCalls: provider.supportsToolCalls(),
          local: provider.getConfig().isLocal
        }
      },
      models // Full model list for updating the provider
    })
  } catch (error) {
    console.error('Failed to test provider:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}