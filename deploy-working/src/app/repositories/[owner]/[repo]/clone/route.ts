import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubServiceForUser } from '@/lib/github-service'
import { githubWorktreeService } from '@/lib/github-worktree-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params
    const body = await request.json()
    const { 
      baseDirectory, 
      shallow = true, 
      includeSubmodules = false 
    } = body

    // Get GitHub service for user
    const githubService = await getGitHubServiceForUser(session.user.email)
    if (!githubService) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    // Get repository details
    const repository = await githubService.getRepository(owner, repo)

    // Determine base directory (use default if not provided)
    const workingDir = baseDirectory || `/tmp/maverick/repositories/${session.user.id}`

    // Clone the repository and set up worktrees
    const setup = await githubWorktreeService.cloneRepository({
      repository,
      baseDirectory: workingDir,
      shallow,
      includeSubmodules,
      // TODO: Get user's GitHub access token for private repos
      // accessToken: userGitHubToken
    })

    return NextResponse.json({
      success: true,
      setup,
      message: `Repository ${owner}/${repo} cloned successfully with worktree management`
    })

  } catch (error) {
    console.error('Error cloning repository:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clone repository' },
      { status: 500 }
    )
  }
}