import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { githubWorktreeService } from '@/lib/github-worktree-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; worktreeName: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, worktreeName } = await params
    const repositoryPath = `/tmp/maverick/repositories/${session.user.id}/${repo}`

    // Get all worktrees and find the specific one
    const worktrees = await githubWorktreeService.listWorktrees(repositoryPath)
    const worktree = worktrees.find(w => w.name === worktreeName)

    if (!worktree) {
      return NextResponse.json({ error: 'Worktree not found' }, { status: 404 })
    }

    // Get detailed status
    const status = await githubWorktreeService.getWorktreeStatus(worktree.path)

    return NextResponse.json({
      success: true,
      worktree: {
        ...worktree,
        status: status
      }
    })

  } catch (error) {
    console.error('Error getting worktree details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get worktree details' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; worktreeName: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, worktreeName } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const repositoryPath = `/tmp/maverick/repositories/${session.user.id}/${repo}`

    // Remove the worktree
    const success = await githubWorktreeService.removeWorktree(
      repositoryPath,
      worktreeName,
      force
    )

    if (!success) {
      return NextResponse.json({ error: 'Failed to remove worktree' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Worktree ${worktreeName} removed successfully`
    })

  } catch (error) {
    console.error('Error removing worktree:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove worktree' },
      { status: 500 }
    )
  }
}