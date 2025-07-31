import { NextRequest, NextResponse } from 'next/server'
import { createLocalAI, getLocalAIStatus } from '@/lib/ollama'

export async function GET(request: NextRequest) {
  try {
    const status = await getLocalAIStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking local AI status:', error)
    return NextResponse.json(
      { error: 'Failed to check local AI status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, type, context, action, data } = body

    const ai = createLocalAI({
      preferredProvider: data?.provider || 'ollama',
      defaultModel: data?.model || 'llama3.1:8b'
    })

    // Handle new format from AIAssistant component
    if (message && type) {
      switch (type) {
        case 'health_check':
          if (message === 'ping') {
            const availability = await ai.checkAvailability()
            return NextResponse.json({ 
              success: true, 
              provider: availability.ollama ? 'ollama' : availability.lmstudio ? 'lmstudio' : null,
              available: availability.ollama || availability.lmstudio,
              models: availability.ollama ? availability.availableModels.ollama : availability.availableModels.lmstudio
            })
          }
          break

        case 'business_guidance':
          let systemPrompt = `You are an AI product and business assistant helping with ${context?.currentContext || 'general business questions'}. 
          
          Context: The user is working ${context?.businessId ? 'on their business' : 'on general business planning'}${context?.projectId ? ' on a specific project' : ''}${context?.documentId ? ' on a document' : ''}.`
          
          if (context?.currentContext === 'PRD creation and editing') {
            systemPrompt += `
            
You are specifically helping with Product Requirements Document (PRD) creation and editing. You should:
- Help refine product requirements and specifications
- Suggest user stories and acceptance criteria
- Identify edge cases and technical considerations
- Recommend metrics and success criteria
- Help prioritize features and requirements
- Suggest improvements to document structure and clarity

Current document content preview:
${context?.documentContent ? context.documentContent.substring(0, 1000) + (context.documentContent.length > 1000 ? '...' : '') : 'No content yet'}
            `
          }
          
          systemPrompt += `
          
          Provide helpful, actionable advice about business formation, strategy, development, and operations. Be encouraging and specific.`
          
          const chatResponse = await ai.generateChatResponse([
            { role: 'user', content: message }
          ], systemPrompt)
          
          return NextResponse.json({ 
            success: true, 
            response: chatResponse,
            provider: 'ollama'
          })

        default:
          return NextResponse.json({ error: 'Unknown message type' }, { status: 400 })
      }
    }

    // Handle legacy format
    switch (action) {
      case 'analyze-business':
        const analysis = await ai.analyzeBusinessIdea(data.businessIdea)
        return NextResponse.json({ success: true, data: analysis })

      case 'formation-advice':
        const advice = await ai.generateFormationAdvice(data.businessType, data.location)
        return NextResponse.json({ success: true, data: advice })

      case 'chat-response':
        const response = await ai.generateChatResponse(data.messages, data.context)
        return NextResponse.json({ success: true, data: { response } })

      case 'check-availability':
        const availability = await ai.checkAvailability()
        return NextResponse.json({ success: true, data: availability })

      default:
        return NextResponse.json(
          { error: 'Invalid action or message format' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Local AI API error:', error)
    
    // Provide helpful error messages
    let errorMessage = 'Local AI service error'
    if (error instanceof Error) {
      if (error.message.includes('No local AI services available')) {
        errorMessage = 'Local AI not available. Please ensure Ollama or LM Studio is running.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}