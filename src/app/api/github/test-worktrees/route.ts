import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { githubWorktreeService } from '@/lib/github-worktree-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action = 'test' } = body

    if (action === 'test') {
      // Test with the current Maverick repository
      const testRepo = {
        id: 123456789,
        name: 'maverick',
        full_name: 'square/maverick',
        description: 'AI-native founder platform',
        html_url: 'https://github.com/square/maverick',
        clone_url: 'https://github.com/square/maverick.git',
        ssh_url: 'git@github.com:square/maverick.git',
        default_branch: 'main',
        language: 'TypeScript',
        languages_url: 'https://api.github.com/repos/square/maverick/languages',
        size: 1024,
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        pushed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        private: false,
        owner: {
          login: 'square',
          avatar_url: 'https://github.com/square.png',
          type: 'Organization'
        }
      }

      const testBaseDir = `/tmp/maverick/test-repositories/${session.user.id}`

      // Clone the test repository
      const setup = await githubWorktreeService.cloneRepository({
        repository: testRepo,
        baseDirectory: testBaseDir,
        shallow: true,
        includeSubmodules: false
      })

      // Create a test feature worktree
      const featureWorktree = await githubWorktreeService.createFeatureWorktree(
        setup.baseDirectory,
        'test-payment-integration',
        {
          branch: 'feature/test-payment-integration',
          baseBranch: 'main',
          purpose: 'feature',
          createBranch: true
        }
      )

      // List all worktrees
      const allWorktrees = await githubWorktreeService.listWorktrees(setup.baseDirectory)

      // Get status of the main worktree
      const mainWorktree = allWorktrees.find(w => w.purpose === 'main')
      const mainStatus = mainWorktree 
        ? await githubWorktreeService.getWorktreeStatus(mainWorktree.path)
        : null

      return NextResponse.json({
        success: true,
        message: 'Worktree system test completed successfully',
        results: {
          repository: testRepo.full_name,
          setup: {
            baseDirectory: setup.baseDirectory,
            mainBranch: setup.mainBranch,
            totalWorktrees: setup.worktrees.length
          },
          createdFeature: {
            name: featureWorktree.name,
            branch: featureWorktree.branch,
            path: featureWorktree.path,
            purpose: featureWorktree.purpose
          },
          allWorktrees: allWorktrees.map(w => ({
            name: w.name,
            branch: w.branch,
            purpose: w.purpose,
            status: w.status
          })),
          mainWorktreeStatus: mainStatus
        }
      })
    }

    if (action === 'cleanup') {
      // Cleanup test repositories
      const testBaseDir = `/tmp/maverick/test-repositories/${session.user.id}`
      
      try {
        const cleanedCount = await githubWorktreeService.cleanupStaleWorktrees(`${testBaseDir}/maverick`)
        
        return NextResponse.json({
          success: true,
          message: 'Test cleanup completed',
          cleanedWorktrees: cleanedCount
        })
      } catch (error) {
        return NextResponse.json({
          success: true,
          message: 'No test repository found to cleanup'
        })
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    console.error('Worktree test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      message: 'Worktree system test failed'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub Worktree Test Endpoint',
    actions: {
      test: 'POST with {"action": "test"} to run full worktree test',
      cleanup: 'POST with {"action": "cleanup"} to cleanup test data'
    },
    documentation: '/FEATURE_DEVELOPMENT_WORKFLOW.md'
  })
}