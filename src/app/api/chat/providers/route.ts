import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChatProviderFactory } from '@/lib/chat-ai-provider'

// GET /api/chat/providers - Get available AI providers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get available providers
    const providers = await ChatProviderFactory.getAvailableProviders(session.user.id)
    
    return NextResponse.json({
      providers,
      defaultProvider: 'claude'
    })

  } catch (error) {
    console.error('Error getting chat providers:', error)
    return NextResponse.json(
      { error: 'Failed to get chat providers' },
      { status: 500 }
    )
  }
}