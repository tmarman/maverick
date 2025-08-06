import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { projectContextService } from '@/lib/project-context-service'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface GitStatus {
  branch: string
  type: 'main' | 'worktree'
  path: string
  status: 'clean' | 'dirty' | 'ahead' | 'behind' | 'conflict'
  changes: {
    added: number
    modified: number
    deleted: number
    untracked: number
  }
  commits: {
    ahead: number
    behind: number
  }
  lastCommit?: {
    hash: string
    message: string
    author: string
    date: string
  }
  associatedTask?: {
    id: string
    title: string
    status: string
  }
}

// GET /api/projects/[name]/git-status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { name: projectName } = resolvedParams
    
    // Get project context
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found or not initialized' },
        { status: 404 }
      )
    }

    const statuses: GitStatus[] = []

    // Get main branch status
    const mainPath = `/tmp/repos/${projectName}/main`
    if (existsSync(mainPath)) {
      const mainStatus = await getGitStatus(mainPath, 'main', 'main')
      if (mainStatus) {
        statuses.push(mainStatus)
      }
    }

    // Get worktree statuses
    const worktrees = await getWorktrees(mainPath)
    for (const worktree of worktrees) {
      const worktreeStatus = await getGitStatus(worktree.path, worktree.branch, 'worktree')
      if (worktreeStatus) {
        // Try to find associated task
        const associatedTask = await findAssociatedTask(projectName, context.maverickPath, worktree.branch)
        if (associatedTask) {
          worktreeStatus.associatedTask = associatedTask
        }
        statuses.push(worktreeStatus)
      }
    }

    return NextResponse.json({
      statuses,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting git status:', error)
    return NextResponse.json(
      { error: 'Failed to get git status', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function getGitStatus(
  repoPath: string, 
  branchName: string, 
  type: 'main' | 'worktree'
): Promise<GitStatus | null> {
  try {
    // Check if directory exists and is a git repo
    if (!existsSync(repoPath) || !existsSync(path.join(repoPath, '.git'))) {
      return null
    }

    // Get current branch
    const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath })
    const actualBranch = currentBranch.trim()

    // Get status porcelain for parsing
    const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: repoPath })
    
    // Parse changes
    const lines = statusOutput.trim().split('\n').filter(line => line)
    let added = 0, modified = 0, deleted = 0, untracked = 0

    for (const line of lines) {
      const status = line.substring(0, 2)
      if (status.includes('A')) added++
      else if (status.includes('M')) modified++
      else if (status.includes('D')) deleted++
      else if (status.includes('??')) untracked++
    }

    // Get commits ahead/behind
    let ahead = 0, behind = 0
    try {
      const { stdout: aheadBehind } = await execAsync(
        `git rev-list --left-right --count origin/${actualBranch}...HEAD`, 
        { cwd: repoPath }
      )
      const [behindStr, aheadStr] = aheadBehind.trim().split('\t')
      behind = parseInt(behindStr) || 0
      ahead = parseInt(aheadStr) || 0
    } catch (e) {
      // If remote tracking doesn't exist, ignore
    }

    // Get last commit
    let lastCommit
    try {
      const { stdout: commitInfo } = await execAsync(
        'git log -1 --format="%H|%s|%an|%ad" --date=iso', 
        { cwd: repoPath }
      )
      const [hash, message, author, date] = commitInfo.trim().split('|')
      lastCommit = { hash, message, author, date }
    } catch (e) {
      // No commits yet
    }

    // Determine overall status
    let status: GitStatus['status'] = 'clean'
    const totalChanges = added + modified + deleted + untracked
    
    if (totalChanges > 0) {
      status = 'dirty'
    } else if (ahead > 0 && behind > 0) {
      status = 'conflict'
    } else if (ahead > 0) {
      status = 'ahead'
    } else if (behind > 0) {
      status = 'behind'
    }

    return {
      branch: actualBranch,
      type,
      path: repoPath,
      status,
      changes: { added, modified, deleted, untracked },
      commits: { ahead, behind },
      lastCommit
    }

  } catch (error) {
    console.error(`Failed to get git status for ${repoPath}:`, error)
    return null
  }
}

async function getWorktrees(mainRepoPath: string): Promise<Array<{ branch: string, path: string }>> {
  try {
    const { stdout } = await execAsync('git worktree list --porcelain', { cwd: mainRepoPath })
    const worktrees: Array<{ branch: string, path: string }> = []
    
    const entries = stdout.trim().split('\n\n')
    for (const entry of entries) {
      const lines = entry.split('\n')
      let worktreePath = ''
      let branch = ''
      
      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          worktreePath = line.substring(9)
        } else if (line.startsWith('branch ')) {
          branch = line.substring(7).replace('refs/heads/', '')
        }
      }
      
      // Skip the main worktree
      if (worktreePath && branch && !worktreePath.endsWith('/main')) {
        worktrees.push({ branch, path: worktreePath })
      }
    }
    
    return worktrees
  } catch (error) {
    console.error('Failed to get worktrees:', error)
    return []
  }
}

async function findAssociatedTask(
  projectName: string, 
  maverickPath: string, 
  branchName: string
): Promise<{ id: string, title: string, status: string } | null> {
  try {
    // Load all tasks and find one with matching worktreeName/branch
    const todos = await hierarchicalTodoService.getAllTodosWithHierarchy(projectName, maverickPath)
    
    for (const todo of todos) {
      // Check if the task has a worktreeName that matches this branch
      const todoData = todo as any
      if (todoData.worktreeName === branchName || 
          todoData.githubBranch === branchName ||
          branchName.includes(todoData.id)) {
        return {
          id: todo.id,
          title: todo.title,
          status: todo.status
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to find associated task:', error)
    return null
  }
}