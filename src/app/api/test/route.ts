// Example API route demonstrating Next.js backend capabilities

export async function GET() {
  return Response.json({
    message: 'Maverick API is running!',
    backend: 'Next.js with Node.js',
    capabilities: [
      'Database connections (SQL Server, PostgreSQL, etc.)',
      'External API calls (Square, legal services, state filing)',
      'File system access for document generation', 
      'Email/SMS sending',
      'Temporal workflow orchestration',
      'Real-time webhooks',
      'Authentication & authorization'
    ],
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Example: This is where we'd start a company formation workflow
    // await temporalClient.workflow.start(companyFormationWorkflow, {...})
    
    return Response.json({
      message: 'Company formation initiated',
      workflowId: `company-formation-${Date.now()}`,
      data: body,
      status: 'success'
    })
  } catch (error) {
    return Response.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }
}