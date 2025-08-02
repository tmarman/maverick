import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateClaudeCodeResponse } from '@/lib/claude-code-provider'
import { db } from '@/lib/database-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectData, userInput, conversationHistory } = await request.json()

    // Check if user wants to create the project
    const createTriggers = ['create the project', 'generate the project', 'make the project', 'build it', 'let\'s do it', 'proceed', 'yes create', 'go ahead']
    const shouldCreate = createTriggers.some(trigger => 
      userInput.toLowerCase().includes(trigger)
    )

    if (shouldCreate) {
      // Get user's first company (business)
      const companies = await db.getUserCompanies(session.user.email)
      if (companies.length === 0) {
        return NextResponse.json({ error: 'No business found for user' }, { status: 400 })
      }

      const businessId = companies[0].id

      // Create the project in the database
      const project = await db.createProject({
        name: projectData.name,
        description: projectData.description,
        type: projectData.type || 'SOFTWARE',
        businessId
      })

      // Generate comprehensive documents using Claude Code
      const documentsPrompt = `You are an expert project architect. Generate comprehensive project documentation for the following project:

**Project:** ${projectData.name}
**Description:** ${projectData.description}
**Type:** ${projectData.type}
**Key Features:** ${projectData.keyFeatures?.join(', ') || 'To be determined'}
**Target Audience:** ${projectData.targetAudience || 'To be determined'}

**Conversation Context:**
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n\n')}

Generate the following documents as separate sections:

## specifications.md
Create a comprehensive project specification document including:
- Project overview and objectives
- Scope and deliverables
- Success criteria
- Timeline and milestones
- Assumptions and constraints

## requirements.md
Create detailed requirements including:
- Functional requirements (what it should do)
- Non-functional requirements (performance, security, usability)
- User stories and acceptance criteria
- Integration requirements
- Data requirements

## design.md
Create design guidelines including:
- User experience (UX) principles
- User interface (UI) design guidelines
- Information architecture
- Visual design elements
- Responsive design considerations
- Accessibility requirements

## architecture.md
Create technical architecture documentation including:
- System architecture overview
- Technology stack recommendations
- Database design considerations
- API design principles
- Security architecture
- Deployment strategy
- Development workflow

Make each document comprehensive but practical. Focus on actionable information that a development team can use to build the project.`

      try {
        const documentationResponse = await generateClaudeCodeResponse(
          documentsPrompt,
          `Project Documentation for ${projectData.name}`,
          `project-docs-${project.id}`
        )

        // For now, we'll store the generated docs as a single field
        // In a real implementation, you might want to parse and store each document separately
        // or create a document management system

        // Store the generated documentation (would implement if method exists)
        try {
          // For now, just store in the project record
          console.log('Generated documentation for project:', project.id)
          // await db.updateProject?.(project.id, { specifications: documentationResponse })
        } catch (error) {
          console.error('Failed to store documentation:', error)
        }

        return NextResponse.json({
          project: {
            id: project.id,
            name: project.name,
            description: project.description
          },
          documentation: documentationResponse
        })

      } catch (docError) {
        console.error('Failed to generate documentation:', docError)
        
        // Still return the project even if docs failed
        return NextResponse.json({
          project: {
            id: project.id,
            name: project.name,
            description: project.description
          },
          message: `Project "${projectData.name}" created successfully! I encountered an issue generating the full documentation, but you can still start working on your project.`
        })
      }

    } else {
      // User wants to refine the project further
      const conversationContext = conversationHistory.map((msg: any) => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n')

      const refinementPrompt = `You are Maverick, helping refine a project definition. 

Current project data:
- Name: ${projectData.name}
- Description: ${projectData.description}
- Type: ${projectData.type}
- Key Features: ${projectData.keyFeatures?.join(', ') || 'To be determined'}
- Target Audience: ${projectData.targetAudience || 'To be determined'}

Previous conversation:
${conversationContext}

Latest user input: ${userInput}

The user wants to refine or has questions about the project. Help them clarify details, adjust scope, or make improvements. Be encouraging and guide them toward a final decision when they're ready.

When they're ready to proceed, suggest they say "create the project" or "let's build it".`

      const response = await generateClaudeCodeResponse(
        refinementPrompt,
        'Project Refinement Chat',
        `refinement-${session.user.email}-${Date.now()}`
      )

      return NextResponse.json({
        message: response
      })
    }

  } catch (error) {
    console.error('Error in project generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate project' },
      { status: 500 }
    )
  }
}