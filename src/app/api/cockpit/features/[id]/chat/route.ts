import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database-service'
import { generateClaudeCodeResponse } from '@/lib/claude-code-provider'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()
    const featureId = params.id

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get current feature data (fallback to demo data if DB unavailable)
    let feature
    try {
      feature = await db.getFeature(featureId, session.user.email)
    } catch (error) {
      console.error('Database unavailable, using fallback feature data')
      // Create a fallback feature object from the ID for demo purposes
      feature = {
        id: featureId,
        title: 'Demo Feature',
        description: 'Demo feature for testing',
        functionalArea: 'Software',
        priority: 'medium',
        status: 'planned',
        chatHistory: []
      }
    }

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    // Build context for Claude Code
    const context = `You are helping build a feature in Maverick, an AI-native founder platform.

Feature Details:
- Title: ${feature.title}
- Description: ${feature.description}
- Functional Area: ${feature.functionalArea}
- Priority: ${feature.priority}
- Status: ${feature.status}

Your role: Help break down this feature into actionable tasks, provide technical guidance, suggest implementation approaches, generate code when needed, and assist with requirements and specifications.

Focus on being practical, specific, and development-focused in your responses. This is part of a product management cockpit where founders build their businesses systematically.`

    // Use the existing Claude Code provider with long-running sessions
    const claudeResponse = await generateClaudeCodeResponse(
      message,
      context,
      `feature-${featureId}` // Use feature-specific project ID for session management
    )

    // Create new message objects
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }

    const assistantMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant' as const,
      content: claudeResponse,
      timestamp: new Date()
    }

    // Update chat history
    const updatedChatHistory = [
      ...(feature.chatHistory || []),
      userMessage,
      assistantMessage
    ]

    // Try to update feature in database, but continue with fallback if unavailable
    try {
      await db.updateFeature(featureId, {
        chatHistory: updatedChatHistory,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Database update failed, continuing with in-memory state')
    }

    return NextResponse.json({
      chatHistory: updatedChatHistory,
      message: 'Chat updated successfully'
    })

  } catch (error) {
    console.error('Feature chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const featureId = params.id
    
    // Try to get feature from database, fallback to demo data
    let feature
    try {
      feature = await db.getFeature(featureId, session.user.email)
    } catch (error) {
      console.error('Database unavailable, using fallback feature data')
      feature = {
        id: featureId,
        title: 'Demo Feature',
        description: 'Demo feature for testing',
        functionalArea: 'Software',
        priority: 'medium',
        status: 'planned',
        chatHistory: []
      }
    }

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      chatHistory: feature.chatHistory || [],
      feature
    })

  } catch (error) {
    console.error('Feature chat fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}