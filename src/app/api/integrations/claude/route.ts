import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claudeService } from '@/lib/claude-service'
import { z } from 'zod'

const claudeConnectionSchema = z.object({
  apiKey: z.string().min(1, 'API key is required').startsWith('sk-', 'API key must start with sk-'),
  email: z.string().email().optional(),
  subscriptionType: z.enum(['free', 'pro', 'max']).optional()
})

// GET /api/integrations/claude - Get Claude connection status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await claudeService.getConnection(session.user.id)
    
    if (!connection) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      email: connection.email,
      subscriptionType: connection.subscriptionType,
      createdAt: connection.createdAt,
      // Never return the actual API key
      hasApiKey: !!connection.accessToken
    })
  } catch (error) {
    console.error('Error getting Claude connection:', error)
    return NextResponse.json(
      { error: 'Failed to get Claude connection' },
      { status: 500 }
    )
  }
}

// POST /api/integrations/claude - Create or update Claude connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = claudeConnectionSchema.parse(body)

    // Test the API key before storing
    const testResult = await claudeService.testApiKey(validatedData.apiKey)
    if (!testResult.valid) {
      return NextResponse.json(
        { error: testResult.error || 'Invalid API key' },
        { status: 400 }
      )
    }

    // Store the connection
    const connection = await claudeService.storeConnection(session.user.id, {
      apiKey: validatedData.apiKey,
      email: validatedData.email,
      subscriptionType: validatedData.subscriptionType
    })

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        email: connection.email,
        subscriptionType: connection.subscriptionType,
        createdAt: connection.createdAt,
        hasApiKey: true
      }
    })
  } catch (error) {
    console.error('Error creating Claude connection:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create Claude connection' },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/claude - Remove Claude connection
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await claudeService.removeConnection(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing Claude connection:', error)
    return NextResponse.json(
      { error: 'Failed to remove Claude connection' },
      { status: 500 }
    )
  }
}