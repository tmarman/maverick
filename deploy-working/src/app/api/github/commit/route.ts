import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { gitHubIntegration } from '@/lib/github-integration'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, files, message, createRepo, projectName } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const workingDir = path.join(process.cwd(), 'generated')
    
    try {
      if (createRepo && projectName) {
        // Full deployment with new repository
        const result = await gitHubIntegration.deployGeneratedCode({
          projectId,
          projectName,
          message: message || 'Generated code from Maverick PRD',
          files: files || [],
          workingDir,
          createRepo: true,
          isPrivate: true
        })

        return NextResponse.json({
          success: true,
          commitHash: result.commitHash,
          repoUrl: result.repoUrl,
          message: 'Code committed and repository created successfully'
        })
      } else {
        // Just commit to existing repository
        const commitHash = await gitHubIntegration.commitGeneratedCode({
          projectId,
          message: message || 'Generated code from Maverick PRD',
          files: files || [],
          workingDir
        })

        // Try to push to remote
        const projectDir = path.join(workingDir, projectId)
        try {
          await gitHubIntegration.pushToRemote(projectDir)
        } catch (pushError) {
          console.warn('Could not push to remote:', pushError)
        }

        return NextResponse.json({
          success: true,
          commitHash,
          message: 'Code committed successfully'
        })
      }
    } catch (error) {
      console.error('GitHub integration error:', error)
      
      // Provide specific error messages
      let errorMessage = 'Failed to commit code to GitHub'
      if (error instanceof Error) {
        if (error.message.includes('GitHub CLI')) {
          errorMessage = 'GitHub CLI not configured. Please run "gh auth login" first.'
        } else if (error.message.includes('No remote origin')) {
          errorMessage = 'No GitHub repository configured for this project.'
        } else {
          errorMessage = error.message
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 })
    }
  } catch (error) {
    console.error('GitHub commit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'check-git':
        try {
          const username = await gitHubIntegration.getGitHubUsername()
          return NextResponse.json({
            success: true,
            configured: true,
            username
          })
        } catch (error) {
          return NextResponse.json({
            success: true,
            configured: false,
            error: 'GitHub CLI not configured'
          })
        }

      case 'list-repos':
        try {
          // This would require additional GitHub API calls
          // For now, just return success
          return NextResponse.json({
            success: true,
            repositories: []
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to list repositories'
          }, { status: 500 })
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('GitHub status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}