import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    const workItemId = resolvedParams.workItemId

    // Load work item from markdown file
    const workItemPath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    
    try {
      const content = await fs.readFile(workItemPath, 'utf-8')
      const workItem = parseWorkItemMarkdown(content, `${workItemId}.md`)
      
      if (!workItem) {
        return NextResponse.json({ error: 'Invalid work item format' }, { status: 400 })
      }

      return NextResponse.json({ workItem })
    } catch (error) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error fetching work item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    const workItemId = resolvedParams.workItemId
    const body = await request.json()

    // Load existing work item
    const workItemPath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    
    try {
      const existingContent = await fs.readFile(workItemPath, 'utf-8')
      const updatedContent = updateWorkItemMarkdown(existingContent, body)
      
      // Write updated content
      await fs.writeFile(workItemPath, updatedContent, 'utf-8')
      
      // Parse the updated markdown to return the work item
      const workItem = parseWorkItemMarkdown(updatedContent, `${workItemId}.md`)
      
      return NextResponse.json({ 
        workItem,
        message: 'Work item updated successfully'
      })
    } catch (error) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error updating work item:', error)
    return NextResponse.json(
      { error: 'Failed to update work item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    const workItemId = resolvedParams.workItemId

    // Delete work item markdown file
    const workItemPath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    
    try {
      await fs.unlink(workItemPath)
      
      // Update work items index
      await updateWorkItemsIndex(projectName)
      
      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting work item:', error)
    return NextResponse.json(
      { error: 'Failed to delete work item' },
      { status: 500 }
    )
  }
}

async function updateWorkItemsIndex(projectName: string) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  const indexPath = path.join(process.cwd(), 'projects', projectName, '.maverick.work-items.json')
  
  try {
    const files = await fs.readdir(workItemsDir)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const index = {
      count: markdownFiles.length,
      lastUpdated: new Date().toISOString(),
      items: markdownFiles.map(file => ({
        id: file.replace('.md', ''),
        filename: file,
        path: `work-items/${file}`
      }))
    }
    
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error updating work items index:', error)
  }
}

function updateWorkItemMarkdown(content: string, updates: any): string {
  const lines = content.split('\n')
  const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  
  if (frontmatterEnd === -1) {
    throw new Error('Invalid markdown format - missing frontmatter')
  }

  // Update frontmatter
  for (let i = 1; i < frontmatterEnd; i++) {
    const line = lines[i]
    
    if (line.startsWith('title:') && updates.title) {
      lines[i] = `title: "${updates.title}"`
    } else if (line.startsWith('status:') && updates.status) {
      lines[i] = `status: ${updates.status}`
    } else if (line.startsWith('priority:') && updates.priority) {
      lines[i] = `priority: ${updates.priority}`
    } else if (line.startsWith('updatedAt:')) {
      lines[i] = `updatedAt: ${new Date().toISOString()}`
    }
  }

  // Update the main title in content
  if (updates.title) {
    const titleLineIndex = lines.findIndex(line => line.startsWith('# '))
    if (titleLineIndex !== -1) {
      lines[titleLineIndex] = `# ${updates.title}`
    }
  }

  // Update description section
  if (updates.description) {
    const descriptionIndex = lines.findIndex(line => line.trim() === '## 📋 Description')
    if (descriptionIndex !== -1 && descriptionIndex + 1 < lines.length) {
      // Find the next section or end of file
      let nextSectionIndex = lines.findIndex((line, index) => 
        index > descriptionIndex + 1 && line.startsWith('## ')
      )
      if (nextSectionIndex === -1) {
        nextSectionIndex = lines.length
      }
      
      // Replace description content
      const beforeDescription = lines.slice(0, descriptionIndex + 1)
      const afterDescription = lines.slice(nextSectionIndex)
      
      lines.splice(0, lines.length, 
        ...beforeDescription,
        updates.description,
        '',
        ...afterDescription
      )
    }
  }

  return lines.join('\n')
}

function parseWorkItemMarkdown(content: string, filename: string) {
  try {
    const lines = content.split('\n')
    const workItem: any = {
      id: filename.replace('.md', ''),
      filename,
      markdownContent: content
    }
    
    // Parse frontmatter
    let inFrontmatter = false
    let frontmatterEnd = -1
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
          continue
        } else {
          frontmatterEnd = i
          break
        }
      }
      
      if (inFrontmatter) {
        if (line.startsWith('title:')) {
          workItem.title = line.substring(6).trim().replace(/^"(.*)"$/, '$1')
        } else if (line.startsWith('type:')) {
          workItem.type = line.substring(5).trim()
        } else if (line.startsWith('status:')) {
          workItem.status = line.substring(7).trim()
        } else if (line.startsWith('priority:')) {
          workItem.priority = line.substring(9).trim()
        } else if (line.startsWith('functionalArea:')) {
          workItem.functionalArea = line.substring(15).trim()
        } else if (line.startsWith('estimatedEffort:')) {
          workItem.estimatedEffort = line.substring(16).trim().replace(/^"(.*)"$/, '$1')
        } else if (line.startsWith('worktreeName:')) {
          const value = line.substring(13).trim()
          workItem.worktreeName = value === 'null' ? null : value
        } else if (line.startsWith('githubBranch:')) {
          const value = line.substring(13).trim()
          workItem.githubBranch = value === 'null' ? null : value
        } else if (line.startsWith('createdAt:')) {
          workItem.createdAt = line.substring(10).trim()
        } else if (line.startsWith('updatedAt:')) {
          workItem.updatedAt = line.substring(10).trim()
        }
      }
    }
    
    // Extract description from markdown content
    if (frontmatterEnd !== -1) {
      const contentAfterFrontmatter = lines.slice(frontmatterEnd + 1)
      const descriptionIndex = contentAfterFrontmatter.findIndex(line => line.trim() === '## 📋 Description')
      
      if (descriptionIndex !== -1) {
        let nextSectionIndex = contentAfterFrontmatter.findIndex((line, index) => 
          index > descriptionIndex + 1 && line.startsWith('## ')
        )
        if (nextSectionIndex === -1) {
          nextSectionIndex = contentAfterFrontmatter.length
        }
        
        const descriptionLines = contentAfterFrontmatter.slice(descriptionIndex + 1, nextSectionIndex)
        workItem.description = descriptionLines.join('\n').trim()
      }
    }
    
    // Set defaults
    workItem.type = workItem.type || 'TASK'
    workItem.status = workItem.status || 'PLANNED'
    workItem.priority = workItem.priority || 'MEDIUM'
    workItem.functionalArea = workItem.functionalArea || 'SOFTWARE'
    workItem.orderIndex = Date.now()
    workItem.depth = 0
    
    return workItem
  } catch (error) {
    console.error('Error parsing work item markdown:', error)
    return null
  }
}