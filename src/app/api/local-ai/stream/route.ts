import { NextRequest } from 'next/server'
import { createLocalAI } from '@/lib/ollama'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model, provider } = body

    const ai = createLocalAI({
      preferredProvider: provider || 'ollama',
      defaultModel: model || 'llama3.1:8b'
    })

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          for await (const chunk of ai.generateStreamingResponse(prompt, model)) {
            const data = `data: ${JSON.stringify({ chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          
          // Send completion signal
          const doneData = `data: ${JSON.stringify({ done: true })}\n\n`
          controller.enqueue(encoder.encode(doneData))
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
          controller.enqueue(encoder.encode(errorData))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to start streaming' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}