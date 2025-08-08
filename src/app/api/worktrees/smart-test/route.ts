import { NextRequest, NextResponse } from 'next/server'
import { SmartWorktreeManager } from '@/lib/smart-worktree-manager'

// GET /api/worktrees/smart-test - Test smart categorization
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing smart worktree categorization...')

    // Test different types of tasks to see how they get categorized
    const testTasks = [
      {
        title: "Add user authentication with JWT tokens",
        description: "Implement secure login system with password hashing",
        type: "FEATURE",
        functionalArea: "SECURITY"
      },
      {
        title: "Fix responsive design issues on mobile dashboard",
        description: "Update CSS and component styling for better mobile experience",
        type: "BUG",
        functionalArea: "UI"
      },
      {
        title: "Optimize database queries for user search",
        description: "Add indexes and improve SQL query performance",
        type: "TASK", 
        functionalArea: "DATABASE"
      },
      {
        title: "Set up CI/CD pipeline with GitHub Actions",
        description: "Automate build and deployment process",
        type: "TASK",
        functionalArea: "OPERATIONS"
      },
      {
        title: "Create API endpoint for order management",
        description: "Build REST API for creating and managing orders",
        type: "FEATURE",
        functionalArea: "BACKEND"
      },
      {
        title: "Add unit tests for payment processing",
        description: "Write comprehensive test suite for payment flows",
        type: "TASK",
        functionalArea: "TESTING"
      },
      {
        title: "Update landing page marketing copy",
        description: "Improve conversion rates with better messaging",
        type: "TASK", 
        functionalArea: "MARKETING"
      }
    ]

    const results = testTasks.map(task => {
      const suggestion = SmartWorktreeManager.suggestWorktreeName(
        task.title,
        task.description,
        task.type,
        task.functionalArea,
        []
      )
      
      return {
        originalTask: task,
        suggestedWorktree: suggestion.worktreeName,
        category: suggestion.category,
        team: suggestion.category?.team,
        reasoning: `Keywords matched: ${suggestion.category?.description || 'None'}`
      }
    })

    // Get all available categories
    const allCategories: any[] = []

    return NextResponse.json({
      success: true,
      message: 'Smart worktree categorization test completed',
      results,
      availableCategories: allCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        team: cat.team,
        description: cat.description,
        color: cat.color
      }))
    })

  } catch (error) {
    console.error('Smart worktree test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Smart worktree test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/worktrees/smart-test - Test full smart worktree workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      title = "Fix login button styling issues",
      description = "The login button is not responsive and has incorrect hover states",
      type = "BUG",
      functionalArea = "UI"
    } = body

    console.log('🚀 Testing full smart worktree workflow...')

    // Step 1: Get smart categorization
    const suggestion = SmartWorktreeManager.suggestWorktreeName(
      title,
      description,
      type,
      functionalArea,
      []
    )

    // Step 2: Test worktree queue operations (simulation)
    const { WorktreeQueueService } = await import('@/lib/worktree-queue-service')
    const queueService = WorktreeQueueService.getInstance()

    const mockTaskId = `test-task-${Date.now()}`
    const projectName = 'maverick'
    const worktreeName = suggestion.worktreeName

    const results = []
    
    results.push({
      step: 1,
      action: 'Smart categorization',
      result: {
        originalTitle: title,
        suggestedWorktree: worktreeName,
        team: suggestion.category?.team,
        category: suggestion.category?.name
      }
    })

    try {
      // Step 3: Try to add task to queue (will create queue if needed)
      await queueService.addTaskToQueue(
        projectName,
        worktreeName,
        mockTaskId,
        title,
        type as any,
        'MEDIUM'
      )
      
      results.push({
        step: 2,
        action: 'Add task to worktree queue',
        result: 'Successfully added to queue'
      })

      // Step 4: Get queue stats
      const stats = await queueService.getQueueStats(projectName, worktreeName)
      results.push({
        step: 3,
        action: 'Queue statistics',
        result: stats
      })

      // Step 5: Start working on the task
      const startedTask = await queueService.startNextTask(projectName, worktreeName)
      results.push({
        step: 4,
        action: 'Start next task in queue',
        result: startedTask ? 'Task started successfully' : 'No tasks in queue'
      })

      // Cleanup: Remove the test task
      await queueService.removeTaskFromQueue(projectName, worktreeName, mockTaskId)
      results.push({
        step: 5,
        action: 'Cleanup test task',
        result: 'Test task removed'
      })

    } catch (error) {
      results.push({
        step: 'error',
        action: 'Queue operations failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Smart worktree workflow test completed',
      taskExample: { title, description, type, functionalArea },
      smartSuggestion: suggestion,
      workflowResults: results
    })

  } catch (error) {
    console.error('Smart worktree workflow test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Smart worktree workflow test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}