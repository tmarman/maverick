// Chat storage API for Goose integration

export async function POST(request: Request) {
  try {
    const { conversationId, message, workflowId } = await request.json()
    
    // 1. Store message metadata in SQL
    const chatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      role: message.role,
      messageType: message.type || 'text',
      tokenCount: message.content.length / 4, // Rough estimate
      workflowId, // Link to company formation
      createdAt: new Date(),
      blobReference: `chats/${conversationId}/${Date.now()}.json`
    }
    
    // In real implementation: await prisma.chatMessage.create({ data: chatMessage })
    
    // 2. Store full message content in blob storage
    // await blobClient.upload(chatMessage.blobReference, JSON.stringify(message))
    
    // 3. Update conversation metadata
    // await prisma.conversation.update({
    //   where: { id: conversationId },
    //   data: { 
    //     messageCount: { increment: 1 },
    //     updatedAt: new Date()
    //   }
    // })
    
    return Response.json({
      success: true,
      messageId: chatMessage.id,
      stored: {
        metadata: 'SQL Server',
        content: 'Azure Blob Storage',
        cache: 'Redis (if active)'
      }
    })
    
  } catch (error) {
    console.error('Chat storage error:', error)
    return Response.json(
      { error: 'Failed to store chat message' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const workflowId = searchParams.get('workflowId')
  
  if (conversationId) {
    // Retrieve full conversation
    // 1. Get metadata from SQL
    // 2. Fetch content from blob storage
    // 3. Combine and return
    
    return Response.json({
      conversationId,
      messages: [
        // Mock data - would come from blob storage
        {
          role: 'user',
          content: 'I want to start a coffee shop called Brew & Bytes',
          timestamp: '2024-01-15T10:00:00Z'
        },
        {
          role: 'assistant', 
          content: 'Great! I\'ll help you start Brew & Bytes with Square integration...',
          timestamp: '2024-01-15T10:00:05Z',
          toolCalls: [
            { name: 'start_company_formation', status: 'completed' }
          ]
        }
      ],
      metadata: {
        totalMessages: 12,
        totalTokens: 2450,
        linkedWorkflow: workflowId,
        status: 'active'
      }
    })
  }
  
  return Response.json({ error: 'conversationId required' }, { status: 400 })
}