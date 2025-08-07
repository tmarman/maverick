import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGitHubServiceForUser } from '@/lib/github-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await params
    const { searchParams } = new URL(request.url)
    const branch = searchParams.get('branch') || 'main'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get project with repository information
    const project = await prisma.project.findFirst({
      where: {
        name: name,
        organization: {
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id,
                  status: 'ACCEPTED'
                }
              }
            }
          ]
        }
      },
      include: {
        workItems: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            worktreeName: true,
            githubBranch: true,
            createdAt: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    if (!project.repositoryUrl) {
      return NextResponse.json({ error: 'Project has no connected repository' }, { status: 400 })
    }

    // Extract owner/repo from GitHub URL
    const repoMatch = project.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!repoMatch) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
    }

    const [, owner, repo] = repoMatch

    // Get GitHub service for user
    const githubService = await getGitHubServiceForUser(session.user.email!)
    if (!githubService) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    // Fetch commit history from GitHub
    const commits = await fetchCommitHistory(githubService, owner, repo, branch, limit)

    // Analyze commits and match with work items
    const analyzedHistory = await analyzeProjectHistory(commits, project.workItems)

    // Get project milestones (deployments, major features, etc.)
    const milestones = await getProjectMilestones(project.id)

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        repositoryUrl: project.repositoryUrl,
        defaultBranch: project.defaultBranch
      },
      history: analyzedHistory,
      milestones,
      stats: {
        totalCommits: commits.length,
        contributors: Array.from(new Set(commits.map((c: any) => c.author.login))).length,
        firstCommit: commits[commits.length - 1]?.commit.author.date,
        lastCommit: commits[0]?.commit.author.date,
        activeBranches: Array.from(new Set(commits.map((c: any) => branch))).length
      }
    })

  } catch (error) {
    console.error('Error fetching git history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch git history' },
      { status: 500 }
    )
  }
}

async function fetchCommitHistory(githubService: any, owner: string, repo: string, branch: string, limit: number) {
  try {
    // Use GitHub API to get commit history
    const commits = await githubService.octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: limit
    })

    return commits.data.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        login: commit.author?.login || 'unknown',
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        avatar_url: commit.author?.avatar_url
      },
      commit: {
        author: {
          date: commit.commit.author.date
        },
        message: commit.commit.message
      },
      html_url: commit.html_url,
      files: [] // Would need separate API call for file changes
    }))
  } catch (error) {
    console.error('Error fetching commits from GitHub:', error)
    return []
  }
}

async function analyzeProjectHistory(commits: any[], workItems: any[]) {
  const analyzedCommits = commits.map(commit => {
    const message = commit.commit.message.toLowerCase()
    
    // Try to match commit to work items
    const matchedWorkItems = workItems.filter(item => {
      const itemTitle = item.title.toLowerCase()
      const worktreeName = item.worktreeName?.toLowerCase() || ''
      const githubBranch = item.githubBranch?.toLowerCase() || ''
      
      // Check if commit message mentions work item
      return (
        message.includes(itemTitle.substring(0, 20)) ||
        (worktreeName && message.includes(worktreeName)) ||
        (githubBranch && message.includes(githubBranch)) ||
        message.includes(`#${item.id}`)
      )
    })

    // Categorize commit type
    let commitType = 'other'
    if (message.includes('feat') || message.includes('add') || message.includes('implement')) {
      commitType = 'feature'
    } else if (message.includes('fix') || message.includes('bug') || message.includes('patch')) {
      commitType = 'bugfix'
    } else if (message.includes('refactor') || message.includes('improve') || message.includes('optimize')) {
      commitType = 'refactor'
    } else if (message.includes('test') || message.includes('spec')) {
      commitType = 'test'
    } else if (message.includes('doc') || message.includes('readme')) {
      commitType = 'docs'
    } else if (message.includes('initial') || message.includes('first') || message.includes('setup')) {
      commitType = 'setup'
    }

    // Determine impact/scope
    let impact = 'minor'
    if (message.includes('major') || message.includes('breaking') || message.includes('release')) {
      impact = 'major'
    } else if (message.includes('feature') || message.includes('add') || matchedWorkItems.length > 0) {
      impact = 'moderate'
    }

    return {
      ...commit,
      analysis: {
        type: commitType,
        impact,
        matchedWorkItems: matchedWorkItems.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type
        })),
        isWorkItemRelated: matchedWorkItems.length > 0
      }
    }
  })

  return analyzedCommits
}

async function getProjectMilestones(projectId: string) {
  // Get significant events in project history - simplified for now
  const workItemMilestones = await prisma.workItem.findMany({
    where: {
      projectId,
      OR: [
        { type: 'EPIC' },
        { type: 'FEATURE', status: 'DONE' }
      ]
    },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return {
    deployments: [], // Simplified - remove deployment dependency
    workItems: workItemMilestones.map(w => ({
      type: 'work_item',
      date: w.updatedAt,
      title: w.title,
      workItemType: w.type,
      status: w.status
    }))
  }
}