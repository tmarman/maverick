import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { taskAgentIntegration } from '@/lib/task-agent-integration'

// GET /api/projects/[name]/tasks/[taskId]/worktree-status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; taskId: string }> }
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
    const { name: projectName, taskId } = resolvedParams
    
    // Get task execution status from agent integration
    const executionStatus = await taskAgentIntegration.getTaskExecutionStatus(taskId)
    
    if (!executionStatus.isExecuting) {
      return NextResponse.json(
        { error: 'No active agent work for this task' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      taskId: taskId,
      sessionId: executionStatus.sessionId,
      status: executionStatus.status,
      progress: executionStatus.progress,
      features: [
        '🤖 AI agent actively working',
        '📋 Task requirements analyzed',
        '🔧 Code changes in progress',
        '📸 Progress screenshots captured',
        '🎥 Demo video being recorded'
      ],
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting worktree status:', error)
    return NextResponse.json(
      { error: 'Failed to get worktree status' },
      { status: 500 }
    )
  }
}

/**
 * Calculate comprehensive task progress
 */
async function calculateTaskProgress(task: any, worktreePath: string) {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  try {
    // Check if there are any commits in the worktree
    const { stdout: commitCount } = await execAsync(`cd "${worktreePath}" && git rev-list --count HEAD ^origin/main`)
    const commits = parseInt(commitCount.trim()) || 0
    
    // Check for file changes
    const { stdout: changedFiles } = await execAsync(`cd "${worktreePath}" && git diff --name-only HEAD origin/main`)
    const filesChanged = changedFiles.trim().split('\n').filter(f => f).length
    
    // Calculate progress based on multiple factors
    const factors = {
      timeProgress: calculateTimeProgress(task),
      commitProgress: Math.min(commits * 20, 60), // Each commit = 20% up to 60%
      fileProgress: Math.min(filesChanged * 15, 40), // Each file = 15% up to 40%
    }
    
    const weightedProgress = (
      factors.timeProgress * 0.3 +
      factors.commitProgress * 0.4 +
      factors.fileProgress * 0.3
    )
    
    return {
      percentage: Math.min(Math.round(weightedProgress), 95),
      details: {
        commits,
        filesChanged,
        ...factors
      }
    }
  } catch (error) {
    // Fallback to time-based progress
    return {
      percentage: calculateTimeProgress(task),
      details: { error: 'Could not analyze git progress' }
    }
  }
}

/**
 * Calculate progress based on time elapsed and estimated effort
 */
function calculateTimeProgress(task: any): number {
  const minutesSinceStart = (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60)
  
  // Effort-based expected completion times (in minutes)
  const effortTimes = {
    'XS': 30,   // 30 minutes
    'S': 120,   // 2 hours  
    'M': 480,   // 8 hours
    'L': 960,   // 16 hours
    'XL': 2400, // 40 hours
    'XXL': 4800 // 80 hours
  }
  
  const expectedTime = effortTimes[task.estimatedEffort] || 480 // Default to M
  const timeProgress = (minutesSinceStart / expectedTime) * 100
  
  return Math.min(Math.round(timeProgress), 90) // Cap at 90% for time-based
}

/**
 * Get Git statistics for the worktree
 */
async function getGitStats(worktreePath: string) {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  try {
    const [commitInfo, diffStats] = await Promise.all([
      execAsync(`cd "${worktreePath}" && git log --oneline -n 5 HEAD ^origin/main`),
      execAsync(`cd "${worktreePath}" && git diff --stat HEAD origin/main`)
    ])
    
    return {
      recentCommits: commitInfo.stdout.trim().split('\n').filter(c => c),
      diffSummary: diffStats.stdout.trim(),
      hasChanges: diffStats.stdout.trim().length > 0
    }
  } catch (error) {
    return {
      recentCommits: [],
      diffSummary: 'No changes detected',
      hasChanges: false,
      error: error.message
    }
  }
}

/**
 * Generate recommendations based on progress and git stats
 */
function generateRecommendations(progress: any, gitStats: any): string[] {
  const recommendations: string[] = []
  
  if (progress.percentage < 10 && progress.details.commits === 0) {
    recommendations.push('🚀 Ready to start! Consider making an initial commit to track progress.')
  }
  
  if (progress.percentage > 30 && progress.details.commits < 2) {
    recommendations.push('💡 Good progress! Consider committing changes more frequently.')
  }
  
  if (progress.percentage > 70) {
    recommendations.push('🎯 Almost done! Start preparing for testing and review.')
  }
  
  if (progress.details.filesChanged > 5) {
    recommendations.push('📝 Many files changed. Consider splitting into smaller commits.')
  }
  
  if (!gitStats.hasChanges && progress.percentage > 20) {
    recommendations.push('⚠️ No changes detected. Ensure work is being committed to git.')
  }
  
  return recommendations
}