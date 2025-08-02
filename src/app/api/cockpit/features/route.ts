import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database-service'
import { generateClaudeCodeResponse } from '@/lib/claude-code-provider'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, feature, generateSpecs } = await request.json()

    if (!productId || !feature) {
      return NextResponse.json(
        { error: 'Product ID and feature data are required' },
        { status: 400 }
      )
    }

    // Store feature in database
    const createdFeature = await db.createFeature({
      ...feature,
      userId: session.user.email,
      productId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // If generateSpecs is true, use Claude Code to generate initial specs and conversation starter
    if (generateSpecs) {
      const context = `You are helping create initial specifications for a new feature in Maverick, an AI-native founder platform.

Feature Details:
- Title: ${feature.title}
- Description: ${feature.description || 'No description provided'}
- Functional Area: ${feature.functionalArea}
- Priority: ${feature.priority}

Your task: Generate an initial conversation starter that will help the user think through this feature systematically. Ask 2-3 key questions that will help clarify requirements, suggest a basic approach, and invite them to dive deeper.

Be encouraging, specific, and focus on actionable next steps. This is the first message in what will become an ongoing conversation about building this feature.`

      try {
        const initialResponse = await generateClaudeCodeResponse(
          'Generate an initial conversation starter for this new feature',
          context,
          `feature-${feature.id}`
        )

        // Add the initial Claude message to chat history
        const initialMessage = {
          id: 'initial-1',
          role: 'assistant' as const,
          content: initialResponse,
          timestamp: new Date()
        }

        // Add the initial message to the created feature
        const existingChatHistory = createdFeature.chatHistory
        const chatHistory = Array.isArray(existingChatHistory) 
          ? existingChatHistory 
          : (typeof existingChatHistory === 'string' ? JSON.parse(existingChatHistory) : [])
        chatHistory.push(initialMessage)
        
        // Update feature in database with initial chat
        await db.updateFeature(createdFeature.id, {
          chatHistory
        })

      } catch (error) {
        console.error('Failed to generate initial specs with Claude Code:', error)
        // Fallback to a generic starter message
        const fallbackMessage = {
          id: 'initial-1',
          role: 'assistant' as const,
          content: `Great! I'm excited to help you build "${feature.title}". Let's start by diving into the requirements and breaking this down into actionable steps.\n\nA few questions to get us started:\n1. Who are the primary users of this feature?\n2. What's the main problem this solves?\n3. Are there any existing systems or features this needs to integrate with?\n\nOnce we clarify these details, I can help you create detailed specs, suggest technical approaches, and break this into implementation tasks.`,
          timestamp: new Date()
        }
        
        const existingFallbackHistory = createdFeature.chatHistory
        const fallbackChatHistory = Array.isArray(existingFallbackHistory) 
          ? existingFallbackHistory 
          : (typeof existingFallbackHistory === 'string' ? JSON.parse(existingFallbackHistory) : [])
        fallbackChatHistory.push(fallbackMessage)
        
        await db.updateFeature(createdFeature.id, {
          chatHistory: fallbackChatHistory
        })
      }
    }

    return NextResponse.json({ 
      feature: createdFeature,
      message: 'Feature created successfully'
    })

  } catch (error) {
    console.error('Feature creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const features = await db.getFeaturesByProduct(productId, session.user.email)

    return NextResponse.json({ features })

  } catch (error) {
    console.error('Features fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}