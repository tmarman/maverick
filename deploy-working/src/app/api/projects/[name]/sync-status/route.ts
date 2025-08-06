import { NextRequest, NextResponse } from 'next/server'
import { backgroundSyncService } from '@/lib/background-sync-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: projectName } = await params

    // Get sync status for this specific project
    const allStatuses = await backgroundSyncService.performSyncCycle()
    const projectStatuses = allStatuses.filter(status => status.project === projectName)

    if (projectStatuses.length === 0) {
      return NextResponse.json({
        project: projectName,
        status: 'unknown',
        message: 'Project not found or not yet synced',
        lastSync: new Date(),
        branches: []
      })
    }

    // Find the main/primary branch status
    const mainStatus = projectStatuses.find(s => s.branch === 'main') || projectStatuses[0]
    
    // Calculate overall project health
    const hasConflicts = projectStatuses.some(s => s.status === 'conflict')
    const hasErrors = projectStatuses.some(s => s.status === 'error')
    const needsAttention = projectStatuses.some(s => s.needsAttention)
    const allSynced = projectStatuses.every(s => s.status === 'synced')

    let overallStatus: string
    let overallMessage: string

    if (hasErrors) {
      overallStatus = 'error'
      overallMessage = 'Some branches have sync errors'
    } else if (hasConflicts) {
      overallStatus = 'conflict'
      overallMessage = 'Some branches have merge conflicts'
    } else if (needsAttention) {
      overallStatus = 'attention'
      overallMessage = 'Some branches need attention'
    } else if (allSynced) {
      overallStatus = 'synced'
      overallMessage = 'All branches up to date'
    } else {
      overallStatus = 'pending'
      overallMessage = 'Some branches have updates available'
    }

    return NextResponse.json({
      project: projectName,
      status: overallStatus,
      message: overallMessage,
      lastSync: mainStatus.lastSync,
      needsAttention,
      branches: projectStatuses.map(status => ({
        branch: status.branch,
        status: status.status,
        message: status.message,
        lastSync: status.lastSync,
        conflictFiles: status.conflictFiles,
        needsAttention: status.needsAttention
      }))
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: projectName } = await params
    const body = await request.json()
    const { action, branch, strategy } = body

    if (action === 'sync') {
      // Trigger manual sync for specific branch or all branches
      if (branch) {
        const result = await backgroundSyncService.syncWorktree(projectName, branch)
        return NextResponse.json({ success: true, result })
      } else {
        // Sync all branches for this project
        const results = await backgroundSyncService.performSyncCycle()
        const projectResults = results.filter(r => r.project === projectName)
        return NextResponse.json({ success: true, results: projectResults })
      }
    }

    if (action === 'resolve-conflicts') {
      if (!branch) {
        return NextResponse.json({ error: 'Branch required for conflict resolution' }, { status: 400 })
      }

      const result = await backgroundSyncService.resolveConflictsAutomatically(
        projectName, 
        branch, 
        strategy || 'auto-merge'
      )
      
      return NextResponse.json({ success: result.success, result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error handling sync action:', error)
    return NextResponse.json({ error: 'Failed to handle sync action' }, { status: 500 })
  }
}