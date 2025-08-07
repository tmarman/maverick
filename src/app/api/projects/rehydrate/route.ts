import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRehydrationService } from '@/lib/rehydration-service'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectName, projectPath, organizationId } = body

    if (!projectName || !projectPath || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName, projectPath, organizationId' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting rehydration for project: ${projectName}`)

    // Get rehydration service
    const rehydrationService = getRehydrationService()

    // Rehydrate the project from file system
    const result = await rehydrationService.rehydrateProject(
      projectPath,
      projectName,
      session.user.id!,
      organizationId
    )

    if (!result.success) {
      console.error('❌ Rehydration failed:', result.errors)
      return NextResponse.json(
        { 
          error: 'Rehydration failed', 
          details: result.errors,
          partial: {
            projectsProcessed: result.projectsProcessed,
            workItemsProcessed: result.workItemsProcessed,
            agentsProcessed: result.agentsProcessed
          }
        },
        { status: 500 }
      )
    }

    console.log('✅ Rehydration completed successfully')

    return NextResponse.json({
      success: true,
      message: `Project ${projectName} rehydrated successfully`,
      summary: {
        projectsProcessed: result.projectsProcessed,
        workItemsProcessed: result.workItemsProcessed,
        agentsProcessed: result.agentsProcessed
      }
    })

  } catch (error) {
    console.error('❌ Rehydration API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check rehydration status or preview what would be rehydrated
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectPath = searchParams.get('projectPath')

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Missing projectPath parameter' },
        { status: 400 }
      )
    }

    // Preview what would be rehydrated (dry run)
    const maverickPath = path.join(projectPath, '.maverick')
    
    // Check if .maverick directory exists and scan contents
    const fs = await import('fs/promises')
    
    let preview = {
      maverickExists: false,
      tasksFound: 0,
      agentsFound: 0,
      docsFound: 0,
      hasProjectMd: false
    }

    try {
      await fs.access(maverickPath)
      preview.maverickExists = true

      // Count tasks
      try {
        const tasksPath = path.join(maverickPath, 'tasks')
        const taskFiles = await fs.readdir(tasksPath)
        preview.tasksFound = taskFiles.filter(f => f.endsWith('.md')).length
      } catch {}

      // Count agents
      try {
        const agentsPath = path.join(maverickPath, 'agents')
        const agentFiles = await fs.readdir(agentsPath)
        preview.agentsFound = agentFiles.filter(f => f.endsWith('.md')).length
      } catch {}

      // Count docs
      try {
        const docsPath = path.join(maverickPath, 'docs')
        const docFiles = await fs.readdir(docsPath)
        preview.docsFound = docFiles.filter(f => f.endsWith('.md')).length
      } catch {}

      // Check for project.md
      try {
        await fs.access(path.join(maverickPath, 'project.md'))
        preview.hasProjectMd = true
      } catch {}

    } catch {
      // .maverick directory doesn't exist
    }

    return NextResponse.json({
      preview,
      message: preview.maverickExists 
        ? `Found ${preview.tasksFound} tasks, ${preview.agentsFound} agents, ${preview.docsFound} docs`
        : 'No .maverick directory found - fresh project structure will be created'
    })

  } catch (error) {
    console.error('❌ Rehydration preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}