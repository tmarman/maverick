import { NextRequest, NextResponse } from 'next/server'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'
import { promises as fs } from 'fs'
import path from 'path'

// GET /api/projects/[name]/hierarchical-todos/[id]/markdown
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string; id: string } }
) {
  try {
    const { name: projectName, id: todoId } = params

    // Get project context to access the file system
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found or not initialized' },
        { status: 404 }
      )
    }

    // Read the markdown file directly
    const workItemsPath = path.join(context.workingDirectory, 'work-items')
    const filePath = path.join(workItemsPath, `${todoId}.md`)

    try {
      const markdown = await fs.readFile(filePath, 'utf-8')
      
      return NextResponse.json({
        success: true,
        markdown,
        filePath
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Task file not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error fetching task markdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task markdown' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[name]/hierarchical-todos/[id]/markdown
export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string; id: string } }
) {
  try {
    const { name: projectName, id: todoId } = params
    const { markdown } = await request.json()

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      )
    }

    // Get project context to access the file system
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found or not initialized' },
        { status: 404 }
      )
    }

    // Write the markdown file directly
    const workItemsPath = path.join(context.workingDirectory, 'work-items')
    const filePath = path.join(workItemsPath, `${todoId}.md`)

    try {
      // Ensure directory exists
      await fs.mkdir(workItemsPath, { recursive: true })
      
      // Write the updated markdown
      await fs.writeFile(filePath, markdown, 'utf-8')
      
      // Parse the updated todo from the markdown to return updated metadata
      const updatedTodo = await hierarchicalTodoService.getTodo(projectName, context.workingDirectory, todoId)
      
      return NextResponse.json({
        success: true,
        message: 'Task markdown updated successfully',
        todo: updatedTodo,
        filePath
      })
    } catch (error) {
      console.error('Error writing task markdown:', error)
      return NextResponse.json(
        { error: 'Failed to save task markdown' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error updating task markdown:', error)
    return NextResponse.json(
      { error: 'Failed to update task markdown' },
      { status: 500 }
    )
  }
}