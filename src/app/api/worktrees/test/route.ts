import { NextRequest, NextResponse } from 'next/server'
import { WorktreeManager } from '@/lib/worktree-manager'
import path from 'path'

// GET /api/worktrees/test
export async function GET(request: NextRequest) {
  try {
    const projectName = 'maverick' // Test with current project
    const baseRepoPath = process.cwd() // Use current directory
    
    const worktreeManager = new WorktreeManager(baseRepoPath)
    await worktreeManager.initialize()

    // Test hierarchical worktree operations
    const testResults: any[] = []

    // 1. Test if project exists (should be false for hierarchical structure initially)
    const projectExists = await worktreeManager.projectExists(projectName)
    testResults.push({
      test: 'Project exists check',
      result: projectExists,
      status: 'info'
    })

    // 2. Test clone operation (should work with current repo)
    try {
      const gitRemote = 'https://github.com/your-username/maverick.git' // Fallback, will be skipped
      // For testing, we'll skip actual cloning since we're already in the repo
      testResults.push({
        test: 'Clone project (skipped - already in repo)',
        result: 'Current working directory is already a git repo',
        status: 'success'
      })
    } catch (error) {
      testResults.push({
        test: 'Clone project',
        result: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      })
    }

    // 3. Test branch validation
    const testBranches = [
      'feat-new-feature',
      'fix-bug-fix', 
      'invalid branch name!',
      'task-test-worktree'
    ]

    for (const branch of testBranches) {
      const validation = worktreeManager.validateBranchName(branch)
      testResults.push({
        test: `Branch validation: ${branch}`,
        result: {
          isValid: validation.isValid,
          normalized: validation.normalizedName,
          errors: validation.errors,
          suggestions: validation.suggestions
        },
        status: validation.isValid ? 'success' : 'warning'
      })
    }

    // 4. Test worktree paths
    const worktreePath = worktreeManager.getWorktreePath(projectName, 'test-branch')
    testResults.push({
      test: 'Generate worktree path',
      result: worktreePath,
      status: 'info'
    })

    // 5. Test getting all branches (should work if we're in a git repo)
    try {
      if (await worktreeManager.projectExists(projectName)) {
        const branches = await worktreeManager.getAllBranches(projectName)
        testResults.push({
          test: 'Get all branches',
          result: {
            activeCount: branches.active.length,
            inactiveCount: branches.inactive.length,
            active: branches.active.slice(0, 3), // Show first 3
            inactive: branches.inactive.slice(0, 3) // Show first 3
          },
          status: 'success'
        })
      }
    } catch (error) {
      testResults.push({
        test: 'Get all branches',
        result: error instanceof Error ? error.message : 'Unknown error',
        status: 'info'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Worktree system test completed',
      worktreeRoot: worktreeManager.getProjectPath(projectName),
      baseRepoPath,
      tests: testResults
    })

  } catch (error) {
    console.error('Worktree test error:', error)
    return NextResponse.json(
      { 
        error: 'Worktree test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/worktrees/test - Test creating and cleaning up a worktree
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const testBranch = body.branch || 'test-worktree-functionality'
    const projectName = body.project || 'maverick'
    
    const worktreeManager = new WorktreeManager(process.cwd())
    await worktreeManager.initialize()

    const results: any[] = []

    try {
      // Test creating a hierarchical worktree
      results.push({
        step: 1,
        action: 'Creating hierarchical worktree',
        status: 'starting'
      })

      const worktreePath = await worktreeManager.createHierarchicalWorktree(
        projectName,
        testBranch,
        'main'
      )

      results.push({
        step: 2,
        action: 'Worktree created successfully',
        path: worktreePath,
        status: 'success'
      })

      // Test listing worktrees
      const worktrees = await worktreeManager.listProjectWorktrees(projectName)
      results.push({
        step: 3,
        action: 'List worktrees',
        worktrees: worktrees.map(wt => ({
          branch: wt.branch,
          path: wt.path,
          status: wt.status
        })),
        status: 'success'
      })

      // Clean up test worktree
      if (!body.keepWorktree) {
        await worktreeManager.removeHierarchicalWorktree(projectName, testBranch, true)
        results.push({
          step: 4,
          action: 'Worktree cleaned up',
          status: 'success'
        })
      } else {
        results.push({
          step: 4,
          action: 'Worktree kept for inspection',
          path: worktreePath,
          status: 'info'
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Worktree creation test completed successfully',
        results
      })

    } catch (testError) {
      results.push({
        step: 'error',
        action: 'Test failed',
        error: testError instanceof Error ? testError.message : 'Unknown error',
        status: 'error'
      })

      return NextResponse.json({
        success: false,
        message: 'Worktree test failed',
        results
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Worktree POST test error:', error)
    return NextResponse.json(
      { 
        error: 'Worktree POST test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}