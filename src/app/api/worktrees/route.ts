import { NextRequest, NextResponse } from 'next/server'
import { worktreeManager } from '@/lib/worktree-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project')
    const action = searchParams.get('action')

    if (action === 'list' && project) {
      // List all worktrees for a project
      const worktrees = await worktreeManager.listProjectWorktrees(project)
      return NextResponse.json({ worktrees })
    }

    if (action === 'validate') {
      // Validate branch name
      const branchName = searchParams.get('branch')
      if (!branchName) {
        return NextResponse.json({ error: 'Branch name required' }, { status: 400 })
      }
      
      const validation = worktreeManager.validateBranchName(branchName)
      return NextResponse.json({ validation })
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 })
  } catch (error: any) {
    console.error('Worktree API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, project, branch, baseBranch, repoUrl } = body

    switch (action) {
      case 'create':
        if (!project || !branch) {
          return NextResponse.json({ error: 'Project and branch required' }, { status: 400 })
        }
        
        const worktreePath = await worktreeManager.createHierarchicalWorktree(
          project, 
          branch, 
          baseBranch || 'main'
        )
        return NextResponse.json({ 
          success: true, 
          path: worktreePath,
          message: `Created worktree: ${project}/${branch}` 
        })

      case 'clone':
        if (!project || !repoUrl) {
          return NextResponse.json({ error: 'Project and repoUrl required' }, { status: 400 })
        }
        
        const mainWorktreePath = await worktreeManager.cloneProjectHierarchical(repoUrl, project)
        return NextResponse.json({ 
          success: true, 
          path: mainWorktreePath,
          message: `Cloned project: ${project}` 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Worktree API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project')
    const branch = searchParams.get('branch')
    const force = searchParams.get('force') === 'true'

    if (!project || !branch) {
      return NextResponse.json({ error: 'Project and branch required' }, { status: 400 })
    }

    await worktreeManager.removeHierarchicalWorktree(project, branch, force)
    return NextResponse.json({ 
      success: true, 
      message: `Removed worktree: ${project}/${branch}` 
    })
  } catch (error: any) {
    console.error('Worktree API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}