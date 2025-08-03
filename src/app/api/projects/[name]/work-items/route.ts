import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    
    // TODO: Verify user has access to this project
    // For now, simple email-based access check
    
    // Load work items from markdown files
    const workItems = await loadWorkItemsFromMarkdown(projectName)

    return NextResponse.json({ workItems })
  } catch (error) {
    console.error('Error fetching work items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work items' },
      { status: 500 }
    )
  }
}

async function loadWorkItemsFromMarkdown(projectName: string) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(workItemsDir, { recursive: true })
    
    // Read all .md files in the work-items directory
    const files = await fs.readdir(workItemsDir)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const workItems = []
    
    for (const file of markdownFiles) {
      try {
        const filePath = path.join(workItemsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const workItem = parseWorkItemMarkdown(content, file)
        if (workItem) {
          workItems.push(workItem)
        }
      } catch (error) {
        console.error(`Error reading work item file ${file}:`, error)
      }
    }
    
    // Sort by creation date (newest first)
    workItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return workItems
  } catch (error) {
    console.error('Error loading work items from markdown:', error)
    return []
  }
}

function parseWorkItemMarkdown(content: string, filename: string) {
  try {
    const lines = content.split('\n')
    const workItem: any = {
      id: filename.replace('.md', ''),
      filename,
      markdownContent: content
    }
    
    // Parse YAML frontmatter first
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
        // Parse YAML frontmatter
        if (line.startsWith('id:')) {
          workItem.id = line.substring(3).trim()
        } else if (line.startsWith('title:')) {
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
        } else if (line.startsWith('category:')) {
          workItem.category = line.substring(9).trim().replace(/^"(.*)"$/, '$1')
        } else if (line.startsWith('businessImpact:')) {
          workItem.businessImpact = line.substring(15).trim().replace(/^"(.*)"$/, '$1')
        } else if (line.startsWith('createdAt:')) {
          workItem.createdAt = line.substring(10).trim()
        } else if (line.startsWith('updatedAt:')) {
          workItem.updatedAt = line.substring(10).trim()
        } else if (line.startsWith('worktreeName:')) {
          const value = line.substring(13).trim()
          workItem.worktreeName = value === 'null' ? null : value
        } else if (line.startsWith('githubBranch:')) {
          const value = line.substring(13).trim()
          workItem.githubBranch = value === 'null' ? null : value
        }
      }
    }
    
    // Extract description from markdown content if frontmatter was found
    if (frontmatterEnd !== -1) {
      const contentAfterFrontmatter = lines.slice(frontmatterEnd + 1)
      const descriptionIndex = contentAfterFrontmatter.findIndex(line => line.trim() === '## 📋 Description')
      
      if (descriptionIndex !== -1) {
        // Find next section
        let nextSectionIndex = contentAfterFrontmatter.findIndex((line, index) => 
          index > descriptionIndex + 1 && line.startsWith('## ')
        )
        if (nextSectionIndex === -1) {
          nextSectionIndex = contentAfterFrontmatter.length
        }
        
        const descriptionLines = contentAfterFrontmatter.slice(descriptionIndex + 1, nextSectionIndex)
        workItem.description = descriptionLines.join('\n').trim()
      }
      
      // Also get title from heading if not in frontmatter
      if (!workItem.title) {
        const titleLine = contentAfterFrontmatter.find(line => line.startsWith('# '))
        if (titleLine) {
          workItem.title = titleLine.substring(2).trim()
        }
      }
    }
    
    // Set defaults for missing fields
    workItem.type = workItem.type || 'TASK'
    workItem.status = workItem.status || 'PLANNED'
    workItem.priority = workItem.priority || 'MEDIUM'
    workItem.functionalArea = workItem.functionalArea || 'SOFTWARE'
    workItem.orderIndex = Date.now()
    workItem.depth = 0
    
    // Use current time if dates not found
    const now = new Date().toISOString()
    workItem.createdAt = workItem.createdAt || now
    workItem.updatedAt = workItem.updatedAt || now
    
    return workItem
  } catch (error) {
    console.error('Error parsing work item markdown:', error)
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        business: {
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id,
                  status: 'ACCEPTED',
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] }
                }
              }
            }
          ]
        }
      },
      include: {
        business: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Calculate order index for new item
    const maxOrderIndex = await prisma.workItem.findFirst({
      where: {
        projectId: projectId,
        parentId: body.parentId || null
      },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    })

    const orderIndex = (maxOrderIndex?.orderIndex || 0) + 1

    // Calculate depth based on parent
    let depth = 0
    if (body.parentId) {
      const parent = await prisma.workItem.findUnique({
        where: { id: body.parentId },
        select: { depth: true }
      })
      depth = (parent?.depth || 0) + 1
    }

    // Generate worktree name for features and bugs
    let worktreeName = undefined
    let githubBranch = undefined
    if ((body.type === 'FEATURE' || body.type === 'BUG') && body.createWorktree) {
      const sanitizedTitle = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 50)
      
      const prefix = body.type.toLowerCase()
      worktreeName = `${prefix}/${sanitizedTitle}`
      githubBranch = worktreeName
    }

    // Create the work item
    const workItem = await prisma.workItem.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        status: 'PLANNED',
        priority: body.priority || 'MEDIUM',
        functionalArea: body.functionalArea || 'SOFTWARE',
        parentId: body.parentId || null,
        orderIndex,
        depth,
        worktreeName,
        githubBranch,
        worktreeStatus: worktreeName ? 'PENDING' : null,
        estimatedEffort: body.estimatedEffort || null,
        projectId: projectId,
        assignedToId: body.assignedToId || null
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create worktree if requested and repository is configured
    let worktreeCreated = false
    if (worktreeName && project.repositoryUrl && body.createWorktree) {
      try {
        // Extract owner/repo from repository URL
        const repoMatch = project.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
        if (repoMatch) {
          const [, owner, repo] = repoMatch
          
          // Call worktree creation API
          const worktreeResponse = await fetch(`${process.env.NEXTAUTH_URL}/repositories/${owner}/${repo}/worktrees`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              featureName: worktreeName,
              description: body.description,
              baseBranch: project.defaultBranch || 'main',
              purpose: body.type.toLowerCase(),
              createBranch: true
            })
          })

          if (worktreeResponse.ok) {
            const worktreeData = await worktreeResponse.json()
            worktreeCreated = true
            
            // Update work item with worktree details
            await prisma.workItem.update({
              where: { id: workItem.id },
              data: {
                worktreeStatus: 'ACTIVE',
                worktreePath: worktreeData.worktree?.path
              }
            })
          } else {
            console.error('Failed to create worktree:', await worktreeResponse.text())
          }
        }
      } catch (error) {
        console.error('Error creating worktree for work item:', error)
        // Don't fail the work item creation if worktree creation fails
      }
    }

    return NextResponse.json({ 
      workItem,
      worktreeCreated,
      message: worktreeCreated 
        ? `Work item created with worktree: ${worktreeName}`
        : 'Work item created successfully'
    })
  } catch (error) {
    console.error('Error creating work item:', error)
    return NextResponse.json(
      { error: 'Failed to create work item' },
      { status: 500 }
    )
  }
}