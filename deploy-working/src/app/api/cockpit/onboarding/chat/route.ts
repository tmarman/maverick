import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateClaudeCodeResponse } from '@/lib/claude-code-provider'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, phase } = await request.json()

    if (phase === 'discovery') {
      // Create a conversation context for project discovery
      const conversationHistory = messages.map((msg: any) => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n')

      const discoveryPrompt = `You are Maverick, an AI project architect helping someone define their first project. 

Previous conversation:
${conversationHistory}

Your goal is to:
1. Ask clarifying questions to understand their project vision
2. Help them think through scope, target audience, key features
3. Guide them toward a clear project definition
4. When you have enough information, indicate you're ready to create the project

Guidelines:
- Be conversational and encouraging
- Ask 1-2 focused questions at a time
- Help them think about: purpose, audience, key features, technical requirements
- When you feel confident about the project scope, end your response with a JSON block like this:

READY_TO_CREATE: {
  "name": "Project Name",
  "description": "Brief description",
  "type": "SOFTWARE|MARKETING|OPERATIONS|LEGAL",
  "keyFeatures": ["feature1", "feature2"],
  "targetAudience": "description"
}

Continue the conversation naturally. Don't reveal the JSON format to the user.`

      const response = await generateClaudeCodeResponse(
        discoveryPrompt,
        'Project Discovery Chat',
        `onboarding-${session.user.email}-${Date.now()}`
      )

      // Check if Claude thinks we're ready to create the project
      const readyMatch = response.match(/READY_TO_CREATE:\s*(\{[\s\S]*?\})/i)
      let readyToCreate = false
      let projectSuggestion = null

      if (readyMatch) {
        try {
          projectSuggestion = JSON.parse(readyMatch[1])
          readyToCreate = true
          
          // Remove the JSON from the response
          const cleanResponse = response.replace(/READY_TO_CREATE:[\s\S]*$/i, '').trim()
          
          return NextResponse.json({
            message: cleanResponse,
            readyToCreate,
            projectSuggestion
          })
        } catch (e) {
          console.error('Failed to parse project suggestion:', e)
        }
      }

      return NextResponse.json({
        message: response,
        readyToCreate: false
      })
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })

  } catch (error) {
    console.error('Error in onboarding chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}