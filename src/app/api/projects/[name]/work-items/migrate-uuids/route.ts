import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs/promises'
import * as path from 'path'

// Migration endpoint to add UUIDs to existing work items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await params
    
    // Verify user has access to this project
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
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Get all work items for this project
    const workItems = await prisma.workItem.findMany({
      where: {
        projectId: project.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`🔄 Starting UUID migration for ${workItems.length} work items in project ${name}`)

    let migratedCount = 0
    let createdFiles = []

    // Create project working directory
    const projectDir = path.join(process.cwd(), '.maverick', name.toLowerCase())
    const tasksDir = path.join(projectDir, 'tasks')
    await fs.mkdir(tasksDir, { recursive: true })

    for (const workItem of workItems) {
      try {
        // Generate UUID for this work item
        const workItemUuid = uuidv4()

        // Create markdown file with UUID frontmatter
        const safeTitle = workItem.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
        
        const filename = `${safeTitle}-${workItem.id}.md`
        const filepath = path.join(tasksDir, filename)
        
        // Create markdown content with UUID frontmatter
        const markdownContent = `---
uuid: ${workItemUuid}
id: ${workItem.id}
title: "${workItem.title}"
type: ${workItem.type}
status: ${workItem.status}
priority: ${workItem.priority}
functional_area: ${workItem.functionalArea}
estimated_effort: "${workItem.estimatedEffort || ''}"
created: ${new Date(workItem.createdAt).toISOString()}
updated: ${new Date(workItem.updatedAt).toISOString()}
parent_id: ${workItem.parentId || 'null'}
order_index: ${workItem.orderIndex}
depth: ${workItem.depth}
---

# ${workItem.title}

## 📋 Description

${workItem.description || 'No description provided.'}

## 🎯 Acceptance Criteria

- [ ] Define acceptance criteria for this work item

## 📝 Implementation Notes

*Add implementation details and notes here*

## 🔗 Related Items

*Link to related tasks, dependencies, or blocking items*

## 📅 Progress Log

- **${new Date(workItem.createdAt).toISOString().split('T')[0]}**: Task created
- **${new Date().toISOString().split('T')[0]}**: UUID ${workItemUuid} added via migration

---
*Task UUID: \`${workItemUuid}\`*  
*Database ID: \`${workItem.id}\`*  
*Created: ${new Date(workItem.createdAt).toLocaleString()}*  
*Status: ${workItem.status}*
`
        
        await fs.writeFile(filepath, markdownContent, 'utf-8')
        createdFiles.push({
          workItemId: workItem.id,
          title: workItem.title,
          uuid: workItemUuid,
          filepath: filepath.replace(process.cwd(), '.')
        })
        
        migratedCount++
        console.log(`✅ Migrated work item ${workItem.id}: "${workItem.title}" -> UUID: ${workItemUuid}`)
        
      } catch (error) {
        console.error(`❌ Failed to migrate work item ${workItem.id}: "${workItem.title}"`, error)
      }
    }

    const summary = {
      success: true,
      message: `Successfully migrated ${migratedCount} work items to include UUIDs`,
      stats: {
        totalWorkItems: workItems.length,
        migratedCount,
        createdFiles: createdFiles.length,
        projectName: name,
        tasksDirectory: tasksDir.replace(process.cwd(), '.')
      },
      files: createdFiles
    }

    console.log('🎉 UUID Migration Summary:', summary)

    return NextResponse.json(summary)

  } catch (error) {
    console.error('UUID migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}