import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/ai-provider'
import { validateAPIKey, checkRateLimit } from '@/lib/openai-auth'

// OpenAI-compatible chat completions API for Goose integration
export async function POST(request: NextRequest) {
  try {
    // Optional API key validation (comment out for open access during development)
    const authResult = await validateAPIKey(request)
    if (!authResult.valid) {
      console.warn('API key validation failed:', authResult.error)
      // For now, we'll allow access without valid keys for Goose integration
      // Uncomment below to enforce authentication:
      // return NextResponse.json({
      //   error: {
      //     message: authResult.error || 'Invalid API key',
      //     type: 'authentication_error',
      //     code: 'invalid_api_key'
      //   }
      // }, { status: 401 })
    }

    // Simple rate limiting
    const clientIP = request.ip || 'unknown'
    if (!checkRateLimit(clientIP, 50, 60000)) { // 50 requests per minute
      return NextResponse.json({
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded'
        }
      }, { status: 429 })
    }

    const body = await request.json()
    
    // Extract OpenAI-format request
    const {
      model = 'maverick-default',
      messages = [],
      temperature = 0.7,
      max_tokens,
      stream = false,
      // Maverick-specific extensions
      project_id,
      include_business_context = true
    } = body

    // Validate required fields
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        error: {
          message: 'Messages array is required and cannot be empty',
          type: 'invalid_request_error',
          code: 'missing_messages'
        }
      }, { status: 400 })
    }

    // Build context from messages
    const lastMessage = messages[messages.length - 1]
    const conversationHistory = messages.slice(0, -1).map((msg: any) => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n\n')

    // Enhanced system context for business-aware development
    const systemContext = buildMaverickSystemContext(include_business_context, project_id, conversationHistory)

    // Use our multi-AI provider system
    const response = await generateAIResponse(
      lastMessage.content,
      systemContext,
      'auto', // Let Maverick choose the best provider
      project_id
    )

    // OpenAI-compatible response format
    const completion = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: estimateTokens(systemContext + lastMessage.content),
        completion_tokens: estimateTokens(response),
        total_tokens: estimateTokens(systemContext + lastMessage.content + response)
      }
    }

    // Handle streaming (basic implementation)
    if (stream) {
      return new Response(
        `data: ${JSON.stringify(completion)}\n\ndata: [DONE]\n\n`,
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      )
    }

    return NextResponse.json(completion)

  } catch (error) {
    console.error('Maverick OpenAI API error:', error)
    
    return NextResponse.json({
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        type: 'server_error',
        code: 'internal_error'
      }
    }, { status: 500 })
  }
}

// GET endpoint for model information
export async function GET() {
  return NextResponse.json({
    object: 'list',
    data: [
      {
        id: 'maverick-default',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'maverick',
        description: 'Maverick AI-native business formation and development assistant'
      },
      {
        id: 'maverick-business',
        object: 'model', 
        created: Math.floor(Date.now() / 1000),
        owned_by: 'maverick',
        description: 'Maverick business strategy and formation specialist'
      },
      {
        id: 'maverick-dev',
        object: 'model',
        created: Math.floor(Date.now() / 1000), 
        owned_by: 'maverick',
        description: 'Maverick development and technical implementation assistant'
      }
    ]
  })
}

function buildMaverickSystemContext(includeBusiness: boolean, projectId?: string, conversationHistory?: string): string {
  let context = `You are Maverick, an AI-native founder platform assistant specialized in business formation and development. You have deep knowledge of:

## Core Expertise:
- Business formation and legal structure guidance (LLC, Corp, S-Corp)
- Square payment processing integration and best practices
- GitHub repository management and development workflows  
- AI-powered development using Claude Code and Gemini CLI
- Startup strategy, market analysis, and product development
- Technical architecture for business applications

## Integration Context:
- You have access to Square payment APIs and business formation tools
- You can analyze GitHub repositories and provide development guidance
- You understand both business strategy and technical implementation
- You can bridge the gap between business requirements and code

## Response Style:
- Provide actionable, business-focused development advice
- Consider legal, financial, and operational implications
- Suggest Square integrations where relevant for payments/business needs
- Reference GitHub best practices for development workflows
- Balance technical depth with business practicality`

  if (includeBusiness) {
    context += `

## Business Formation Context:
- Help founders choose the right legal structure based on their goals
- Guide through business formation requirements by state
- Suggest appropriate Square services for different business types
- Provide insights on scaling from MVP to full business operations
- Consider tax implications and operational requirements`
  }

  if (projectId) {
    context += `

## Current Project Context:
- You are working within project: ${projectId}
- Consider this project's specific requirements and goals
- Align recommendations with the project's business model
- Suggest integrations that fit this project's scope and stage`
  }

  if (conversationHistory) {
    context += `

## Previous Conversation:
${conversationHistory}

Please continue this conversation with context awareness.`
  }

  return context
}

// Simple token estimation (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4)
}