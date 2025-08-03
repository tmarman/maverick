import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database-service'
import { generateClaudeCodeResponse } from '@/lib/claude-code-provider'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { githubUrl, businessId, projectId } = await request.json()

    if (!githubUrl || !businessId || !projectId) {
      return NextResponse.json(
        { error: 'GitHub URL, business ID, and project ID are required' },
        { status: 400 }
      )
    }

    // Validate that user has access to this business/project
    const user = await db.getUserCompanies(session.user.email)
    const business = user.find(b => b.id === businessId)
    const project = business?.products.find((p: any) => p.id === projectId)
    
    if (!business || !project) {
      return NextResponse.json(
        { error: 'Access denied to this business or project' },
        { status: 403 }
      )
    }

    // Extract repo information
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!repoMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format' },
        { status: 400 }
      )
    }
    
    const [, owner, repo] = repoMatch
    const repoName = repo.replace(/\.git$/, '')

    // Use Claude Code to analyze the repository structure
    const analysisPrompt = `Analyze this GitHub repository: ${githubUrl}

Please examine the codebase and identify distinct features/components that could be managed as separate development items. For each feature you identify, provide:

1. **Title**: A clear, concise name for the feature
2. **Description**: What this feature does and its business value
3. **Functional Area**: Classify as Software, Legal, Operations, or Marketing
4. **Priority**: Estimate as low, medium, high, or urgent based on core functionality
5. **Status**: Estimate current completion status (planned, in_progress, in_review, done, blocked)
6. **Estimated Effort**: Rough estimate (1d, 1w, 2w, 1m, etc.)
7. **Key Files/Components**: Main files or directories involved
8. **Dependencies**: Other features this depends on or affects

Focus on:
- Core application features (auth, data management, UI components, APIs)
- Infrastructure and deployment components
- Testing and quality assurance features
- Documentation and developer experience
- Integration features with external services

Format your response as a JSON array of features. Aim for 5-15 distinct features that represent meaningful chunks of work.

Example format:
[
  {
    "title": "User Authentication System",
    "description": "Complete user authentication with signup, login, password reset, and session management",
    "functionalArea": "Software",
    "priority": "high",
    "status": "done",
    "estimatedEffort": "2w",
    "keyFiles": ["src/auth/", "middleware/auth.ts", "pages/api/auth/"],
    "dependencies": ["Database Schema", "User Management UI"]
  }
]`

    console.log('Analyzing repository:', githubUrl)
    
    try {
      const analysisResult = await generateClaudeCodeResponse(
        analysisPrompt,
        `Repository Analysis for ${owner}/${repoName}`,
        `repo-analysis-${businessId}-${projectId}`
      )

      // Parse the Claude response to extract features
      let features = []
      try {
        // Try to extract JSON from the response
        const jsonMatch = analysisResult.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          features = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON array found in response')
        }
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', parseError)
        // Fallback: create a single feature with the analysis
        features = [{
          title: `${repoName} Analysis`,
          description: `Repository analysis and feature extraction for ${owner}/${repoName}`,
          functionalArea: 'Software',
          priority: 'medium',
          status: 'in_progress',
          estimatedEffort: 'TBD',
          keyFiles: [],
          dependencies: []
        }]
      }

      // Create features in the database
      const createdFeatures: any[] = []
      
      for (const featureData of features) {
        try {
          const feature = {
            id: `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: featureData.title || 'Untitled Feature',
            description: featureData.description || 'Auto-generated from repository analysis',
            status: (featureData.status || 'planned') as 'planned' | 'in_progress' | 'in_review' | 'done' | 'blocked',
            priority: (featureData.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
            functionalArea: (featureData.functionalArea || 'Software') as 'Software' | 'Legal' | 'Operations' | 'Marketing',
            chatHistory: [{
              id: 'auto-analysis-1',
              role: 'assistant' as const,
              content: `This feature was automatically identified from your repository analysis of ${githubUrl}.

**Analysis Details:**
${featureData.description}

**Key Components:**
${featureData.keyFiles?.join(', ') || 'Not specified'}

**Dependencies:**
${featureData.dependencies?.join(', ') || 'None identified'}

**Estimated Effort:** ${featureData.estimatedEffort || 'To be determined'}

I can help you refine this feature, break it down into tasks, generate implementation code, or create detailed specifications. What would you like to work on first?`,
              timestamp: new Date()
            }],
            estimatedEffort: featureData.estimatedEffort || 'TBD',
            assignee: 'Claude',
            userId: session.user.email,
            productId: projectId,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          // TODO: Replace with WorkItem creation
          // const createdFeature = await db.createFeature(feature)
          // createdFeatures.push(createdFeature)
          console.log('Feature creation disabled - use WorkItem API instead')
          
        } catch (error) {
          console.error('Failed to create feature:', featureData.title, error)
        }
      }

      return NextResponse.json({
        message: 'Repository analysis completed successfully',
        repositoryUrl: githubUrl,
        featuresCreated: createdFeatures.length,
        features: createdFeatures,
        analysisDetails: {
          owner,
          repo: repoName,
          totalFeaturesIdentified: features.length,
          analysisTimestamp: new Date().toISOString()
        }
      })

    } catch (claudeError) {
      console.error('Claude Code analysis failed:', claudeError)
      
      // Fallback: create a basic "Repository Integration" feature
      const fallbackFeature = {
        id: `feature-${Date.now()}-fallback`,
        title: `${repoName} Integration`,
        description: `Integration and analysis of the ${owner}/${repoName} repository`,
        status: 'in_progress' as const,
        priority: 'high' as const,
        functionalArea: 'Software' as const,
        chatHistory: [{
          id: 'fallback-1',
          role: 'assistant' as const,
          content: `I've connected your repository ${githubUrl} to this project, but encountered an issue with automated analysis.

Let's work together to identify and organize the features in your codebase. Here are some questions to get started:

1. What are the main functional areas of your application?
2. Are there any major features or components you'd like to prioritize?
3. What development tasks are you currently working on?

I can help analyze specific parts of your codebase, generate documentation, or create implementation plans for new features.`,
          timestamp: new Date()
        }],
        estimatedEffort: 'TBD',
        assignee: 'Claude',
        userId: session.user.email,
        productId: projectId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // TODO: Replace with WorkItem creation
      // const createdFeature = await db.createFeature(fallbackFeature)
      const createdFeature = { ...fallbackFeature, id: 'fallback-feature' }

      return NextResponse.json({
        message: 'Repository connected with basic analysis',
        repositoryUrl: githubUrl,
        featuresCreated: 1,
        features: [createdFeature],
        analysisDetails: {
          owner,
          repo: repoName,
          fallback: true,
          reason: 'Automated analysis failed, created integration feature'
        }
      })
    }

  } catch (error) {
    console.error('Repository initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize repository' },
      { status: 500 }
    )
  }
}