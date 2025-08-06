import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Maverick OpenAI-compatible API is running',
    endpoints: {
      models: '/api/v1/models',
      chat_completions: '/api/v1/chat/completions'
    },
    version: '1.0.0',
    description: 'AI-native business formation and development assistant'
  })
}

export async function POST() {
  // Test the chat completions endpoint with a simple message
  try {
    const testResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:5001'}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'maverick-default',
        messages: [
          {
            role: 'user',
            content: 'Hello! Can you help me understand what Maverick does?'
          }
        ],
        temperature: 0.7
      })
    })

    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status}`)
    }

    const result = await testResponse.json()
    
    return NextResponse.json({
      status: 'ok',
      message: 'Chat completions API test successful',
      test_result: {
        model_used: result.model,
        response_preview: result.choices[0]?.message?.content?.substring(0, 200) + '...',
        tokens_used: result.usage
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Chat completions API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}