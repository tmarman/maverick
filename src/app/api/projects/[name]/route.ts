import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
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
    const projectName = resolvedParams.name.toLowerCase()
    
    // TODO: Replace with actual database query
    // For now, create mock project data based on the repository we know exists
    if (projectName === 'maverick') {
      const project = {
        id: 'maverick',
        name: 'Maverick',
        description: 'AI-powered business development platform with .maverick workspace architecture',
        type: 'AI_PLATFORM',
        status: 'ACTIVE',
        owner: session.user.email,
        repositoryUrl: 'https://github.com/tmarman/maverick',
        githubRepoId: 'maverick-repo-id',
        defaultBranch: 'main',
        githubConfig: {
          owner: 'tmarman',
          repo: 'maverick',
          full_name: 'tmarman/maverick',
          clone_url: 'https://github.com/tmarman/maverick.git',
          ssh_url: 'git@github.com:tmarman/maverick.git',
          language: 'TypeScript',
          private: false,
          stars: 0,
          forks: 0
        },
        workspacePath: `/repositories/${session.user.email.split('@')[0]}/maverick`,
        maverickConfig: {
          hasStructure: true,
          templateUsed: 'ai-platform',
          customTheme: 'maverick_brand',
          aiInstructions: 'configured'
        },
        createdAt: '2025-01-03T10:00:00Z',
        updatedAt: '2025-01-03T12:00:00Z'
      }

      return NextResponse.json({ 
        project,
        success: true 
      })
    }

    // For other projects, return mock data or 404
    // TODO: Replace with actual database lookup
    return NextResponse.json(
      { error: 'Project not found', message: `Project "${projectName}" does not exist` },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
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
    const projectName = resolvedParams.name.toLowerCase()
    const updates = await request.json()

    // TODO: Replace with actual database update
    console.log('Updating project:', projectName, updates)

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully'
    })

  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
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
    const projectName = resolvedParams.name.toLowerCase()

    // TODO: Replace with actual database deletion
    console.log('Deleting project:', projectName)

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}