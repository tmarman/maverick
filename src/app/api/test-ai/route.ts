import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, multiAIProvider } from '@/lib/ai-provider'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing AI Provider System...')
    
    // Check available providers
    const providers = await multiAIProvider.checkAvailableProviders()
    console.log('Available providers:', providers)

    const results = []

    // Test Claude Code if available
    const claudeProvider = providers.find(p => p.provider === 'claude-code' && p.available)
    if (claudeProvider) {
      try {
        console.log('Testing Claude Code...')
        const claudeResponse = await generateAIResponse(
          'What is 2+2? Please respond with just the number.',
          'You are a helpful math assistant.',
          'claude-code'
        )
        results.push({
          provider: 'claude-code',
          version: claudeProvider.version,
          status: 'success',
          response: claudeResponse.substring(0, 100) // Truncate for display
        })
        console.log('✅ Claude Code test passed')
      } catch (error) {
        results.push({
          provider: 'claude-code',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
        console.log('❌ Claude Code test failed:', error)
      }
    } else {
      results.push({
        provider: 'claude-code',
        status: 'unavailable'
      })
    }

    // Test Gemini if available
    const geminiProvider = providers.find(p => p.provider === 'gemini' && p.available)
    if (geminiProvider) {
      try {
        console.log('Testing Gemini...')
        const geminiResponse = await generateAIResponse(
          'What is 3+3? Please respond with just the number.',
          'You are a helpful math assistant.',
          'gemini'  
        )
        results.push({
          provider: 'gemini',
          version: geminiProvider.version,
          status: 'success',
          response: geminiResponse.substring(0, 100) // Truncate for display
        })
        console.log('✅ Gemini test passed')
      } catch (error) {
        results.push({
          provider: 'gemini',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
        console.log('❌ Gemini test failed:', error)
      }
    } else {
      results.push({
        provider: 'gemini',
        status: 'unavailable'
      })
    }

    // Test auto-selection
    try {
      console.log('Testing auto-selection...')
      const autoResponse = await generateAIResponse(
        'What is 4+4? Please respond with just the number.',
        'You are a helpful math assistant.',
        'auto'
      )
      results.push({
        provider: 'auto',
        status: 'success',
        response: autoResponse.substring(0, 100) // Truncate for display
      })
      console.log('✅ Auto-selection test passed')
    } catch (error) {
      results.push({
        provider: 'auto',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
      console.log('❌ Auto-selection test failed:', error)
    }

    return NextResponse.json({
      success: true,
      availableProviders: providers,
      testResults: results,
      message: 'AI provider system test completed'
    })

  } catch (error) {
    console.error('AI Provider test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'AI provider system test failed'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, provider = 'auto' } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await generateAIResponse(
      message,
      context || 'You are a helpful assistant.',
      provider
    )

    return NextResponse.json({
      success: true,
      provider,
      response,
      message: 'AI response generated successfully'
    })

  } catch (error) {
    console.error('AI Provider POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}