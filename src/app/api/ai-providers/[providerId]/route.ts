import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-providers'

// DELETE - Remove a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params
    
    // Don't allow deleting the default CLI provider
    if (providerId === 'claude-cli-default') {
      return NextResponse.json({ error: 'Cannot delete default CLI provider' }, { status: 400 })
    }

    await aiProviderManager.removeProvider(providerId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete AI provider:', error)
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
  }
}

// PATCH - Update provider configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params
    const body = await request.json()
    
    // For now, we'll need to recreate the provider with new config
    // In a real implementation, providers would have update methods
    const provider = aiProviderManager.getProvider(providerId)
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // This is a simplified update - in practice you'd want more granular updates
    return NextResponse.json({ 
      message: 'Provider updates not yet implemented',
      provider: {
        id: providerId,
        name: provider.getName(),
        config: provider.getConfig()
      }
    })
  } catch (error) {
    console.error('Failed to update AI provider:', error)
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
  }
}