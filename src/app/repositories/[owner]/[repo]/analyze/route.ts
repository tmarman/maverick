import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubServiceForUser } from '@/lib/github-service'

interface RouteParams {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params

    // Get GitHub service for user
    const githubService = await getGitHubServiceForUser(session.user.email)
    if (!githubService) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    // Analyze the repository
    const analysis = await githubService.analyzeRepository(owner, repo)

    return NextResponse.json({
      analysis,
      cloneCommand: githubService.getCloneCommand(analysis.repository, false),
      sshCloneCommand: githubService.getCloneCommand(analysis.repository, true),
    })

  } catch (error) {
    console.error('Error analyzing GitHub repository:', error)
    
    if (error instanceof Error && error.message.includes('Not Found')) {
      return NextResponse.json(
        { error: 'Repository not found or access denied' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    )
  }
}