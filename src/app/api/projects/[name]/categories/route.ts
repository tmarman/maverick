import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface ProjectCategory {
  id: string
  name: string
  color: string
  description: string
  keywords: string[]
  examples: string[]
  isCustom?: boolean
}

async function parseCategories(projectName: string): Promise<ProjectCategory[]> {
  const categoriesPath = path.join(process.cwd(), '.maverick', 'categories.md')
  
  try {
    const content = await fs.readFile(categoriesPath, 'utf-8')
    const categories: ProjectCategory[] = []
    
    // Parse markdown sections
    const sections = content.split('### ').slice(1) // Skip header
    
    for (const section of sections) {
      const lines = section.split('\n')
      const name = lines[0].trim()
      
      // Skip the "Custom Categories" section
      if (name === 'Custom Categories') continue
      
      let id = ''
      let color = ''
      let description = ''
      let keywords: string[] = []
      let examples: string[] = []
      
      for (const line of lines.slice(1)) {
        if (line.startsWith('- **ID**:')) {
          id = line.replace('- **ID**:', '').replace(/`/g, '').trim()
        } else if (line.startsWith('- **Color**:')) {
          color = line.replace('- **Color**:', '').replace(/`/g, '').trim()
        } else if (line.startsWith('- **Description**:')) {
          description = line.replace('- **Description**:', '').trim()
        } else if (line.startsWith('- **Keywords**:')) {
          const keywordText = line.replace('- **Keywords**:', '').trim()
          keywords = keywordText.split(',').map(k => k.trim())
        } else if (line.startsWith('- **Examples**:')) {
          const exampleText = line.replace('- **Examples**:', '').trim()
          examples = [exampleText] // Could be expanded to parse multiple examples
        }
      }
      
      if (id && name && color) {
        categories.push({
          id,
          name,
          color,
          description,
          keywords,
          examples
        })
      }
    }
    
    return categories
  } catch (error) {
    console.error('Error reading categories:', error)
    // Return default categories if file doesn't exist
    return [
      {
        id: 'general',
        name: 'General',
        color: '#6B7280',
        description: 'General work items that don\'t fit other categories',
        keywords: [],
        examples: []
      }
    ]
  }
}

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
    
    const categories = await parseCategories(projectName)
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const body = await request.json()
    
    // TODO: Implement adding custom categories to the categories.md file
    // This would involve parsing the markdown, adding the new category, and writing back
    
    return NextResponse.json({ 
      message: 'Category management not yet implemented',
      category: body 
    })
  } catch (error) {
    console.error('Error managing categories:', error)
    return NextResponse.json(
      { error: 'Failed to manage categories' },
      { status: 500 }
    )
  }
}