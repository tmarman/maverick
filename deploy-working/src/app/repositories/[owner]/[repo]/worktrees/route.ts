import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { githubWorktreeService } from '@/lib/github-worktree-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params
    const repositoryPath = `/tmp/maverick/repositories/${session.user.id}/${repo}`

    // List all worktrees
    const worktrees = await githubWorktreeService.listWorktrees(repositoryPath)

    return NextResponse.json({
      success: true,
      repository: `${owner}/${repo}`,
      worktrees,
      total: worktrees.length
    })

  } catch (error) {
    console.error('Error listing worktrees:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list worktrees' },
      { status: 500 }
    )
  }
}

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
      featureName,
      branch,
      baseBranch = 'main',
      purpose = 'feature',
      createBranch = true
    } = body

    if (!featureName) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 })
    }

    const repositoryPath = `/tmp/maverick/repositories/${session.user.id}/${repo}`

    // Create feature worktree
    const worktree = await githubWorktreeService.createFeatureWorktree(
      repositoryPath,
      featureName,
      {
        branch,
        baseBranch,
        purpose,
        createBranch
      }
    )

    return NextResponse.json({
      success: true,
      worktree,
      message: `Feature worktree created for ${featureName}`
    })

  } catch (error) {
    console.error('Error creating worktree:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create worktree' },
      { status: 500 }
    )
  }
}