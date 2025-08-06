import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { createApiLogger } from '@/lib/logging'

const apiLogger = createApiLogger('ProjectsAPI')

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  apiLogger.logRequest(request)
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const {
      name,
      description,
      type,
      status,
      repositoryUrl,
      githubRepoId,
      defaultBranch,
      githubConfig
    } = await request.json()

    if (!name || !repositoryUrl) {
      return NextResponse.json(
        { error: 'Name and repository URL are required' },
        { status: 400 }
      )
    }

    // Verify GitHub access to the repository
    const { getGitHubServiceForUser } = await import('@/lib/github-service')
    const githubService = await getGitHubServiceForUser(session.user.email)
    
    if (!githubService || !githubConfig) {
      return NextResponse.json(
        { error: 'GitHub connection required to import repositories' },
        { status: 400 }
      )
    }

    // Verify user has access to the repository
    try {
      const repoAccess = await githubService.getRepository(githubConfig.owner, githubConfig.repo)
      if (!repoAccess) {
        return NextResponse.json(
          { error: 'You do not have access to this repository' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Repository not accessible or does not exist' },
        { status: 403 }
      )
    }

    // Import Prisma client
    const { prisma } = await import('@/lib/prisma')
    
    // Find or create a business for this user
    // TODO: In the future, users might select which business to add the project to
    let business = await prisma.business.findFirst({
      where: {
        ownerId: session.user.id
      }
    })

    if (!business) {
      // Create a default personal business for the user
      business = await prisma.business.create({
        data: {
          name: `${session.user.name || session.user.email.split('@')[0]}'s Business`,
          ownerId: session.user.id,
          businessType: 'online',
          status: 'ACTIVE',
          squareServices: JSON.stringify([]),
          appFeatures: JSON.stringify([])
        }
      })
    }

    // Use project name as ID (clean, URL-friendly)
    const projectId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    
    // Create project in database
    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: name.trim(),
        description: description?.trim() || null,
        type: 'SOFTWARE', // Map GITHUB_REPOSITORY to SOFTWARE
        status: status || 'ACTIVE',
        businessId: business.id,
        githubRepoId: githubRepoId,
        repositoryUrl,
        submodulePath: projectId, // Use project ID as submodule path
        defaultBranch: defaultBranch || 'main',
        githubConfig: JSON.stringify(githubConfig),
        aiAgentConfig: JSON.stringify({
          hasStructure: false,
          templateUsed: null,
          customTheme: null,
          aiInstructions: null
        }),
        metadata: JSON.stringify({
          importedAt: new Date().toISOString(),
          importedBy: session.user.email
        })
      }
    })

    const response = NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: 'GITHUB_REPOSITORY', // Return the expected frontend type
        status: project.status,
        owner: session.user.email,
        repositoryUrl: project.repositoryUrl,
        workspacePath: `/repositories/${session.user.email.split('@')[0]}/${project.id}`,
        maverickConfig: JSON.parse(project.aiAgentConfig || '{}'),
        githubConfig: JSON.parse(project.githubConfig || '{}'),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      },
      message: `Successfully imported ${githubConfig?.full_name || name} as a Maverick project`
    })
    
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response

  } catch (error) {
    apiLogger.logError(request, error as Error)
    const response = NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  apiLogger.logRequest(request)
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Import Prisma client
    const { prisma } = await import('@/lib/prisma')
    
    // Get GitHub service to check repository access (optional)
    const { getGitHubServiceForUser, getGitHubConnectionStatus } = await import('@/lib/github-service')
    let githubService = null
    let githubConnectionStatus = null
    try {
      githubService = await getGitHubServiceForUser(session.user.email)
      githubConnectionStatus = await getGitHubConnectionStatus(session.user.email)
    } catch (error) {
      console.log('GitHub service unavailable, continuing without repo verification:', error.message)
    }

    // Query database for projects where user has business membership
    const memberProjects = await prisma.project.findMany({
      where: {
        business: {
          members: {
            some: {
              userId: session.user.id,
              status: 'ACCEPTED'
            }
          }
        }
      },
      include: {
        business: {
          include: {
            members: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    const userProjects = []

    // Process member projects and verify GitHub access
    for (const project of memberProjects) {
      let hasGitHubAccess = true
      let githubRepoData = null

      // If project has GitHub integration, verify access
      if (project.githubRepoId && project.githubConfig && githubService) {
        try {
          const githubConfig = JSON.parse(project.githubConfig)
          if (githubConfig.owner && githubConfig.repo) {
            githubRepoData = await githubService.getRepository(githubConfig.owner, githubConfig.repo)
            if (!githubRepoData) {
              hasGitHubAccess = false
            }
          }
        } catch (error) {
          console.log(`User lost access to repository for project ${project.id}`)
          hasGitHubAccess = false
        }
      }

      // Include project if user still has access
      if (hasGitHubAccess) {
        const githubConfig = project.githubConfig ? JSON.parse(project.githubConfig) : null
        const aiAgentConfig = project.aiAgentConfig ? JSON.parse(project.aiAgentConfig) : {}

        userProjects.push({
          id: project.id,
          name: project.name,
          description: project.description,
          type: project.type === 'SOFTWARE' ? 'GITHUB_REPOSITORY' : project.type,
          status: project.status,
          owner: session.user.email,
          repositoryUrl: project.repositoryUrl,
          workspacePath: `/repositories/${session.user.email.split('@')[0]}/${project.id}`,
          maverickConfig: aiAgentConfig,
          githubConfig: githubConfig || (githubRepoData ? {
            owner: githubRepoData.owner.login,
            repo: githubRepoData.name,
            full_name: githubRepoData.full_name,
            language: githubRepoData.language,
            private: githubRepoData.private,
            stars: githubRepoData.stargazers_count,
            forks: githubRepoData.forks_count
          } : null),
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString()
        })
      }
    }

    // Also check for access to any repositories that might not be in database yet
    // This handles the case where user has GitHub access but hasn't imported the project
    if (githubService) {
      try {
        // Check if user has access to the maverick repository but it's not in their projects
        const maverickRepo = await githubService.getRepository('tmarman', 'maverick')
        const hasMaverickProject = userProjects.some(p => 
          p.githubConfig?.owner === 'tmarman' && p.githubConfig?.repo === 'maverick'
        )
        
        if (maverickRepo && !hasMaverickProject) {
          // User has access to the repository but hasn't imported it as a project yet
          userProjects.push({
            id: 'maverick',
            name: 'Maverick',
            description: 'AI-powered business development platform with .maverick workspace architecture',
            type: 'AI_PLATFORM',
            status: 'ACTIVE',
            owner: session.user.email,
            repositoryUrl: 'https://github.com/tmarman/maverick',
            workspacePath: `/repositories/${session.user.email.split('@')[0]}/maverick`,
            maverickConfig: {
              hasStructure: true,
              templateUsed: 'ai-platform',
              customTheme: 'maverick_brand',
              aiInstructions: 'configured'
            },
            githubConfig: {
              owner: maverickRepo.owner.login,
              repo: maverickRepo.name,
              full_name: maverickRepo.full_name,
              language: maverickRepo.language,
              private: maverickRepo.private,
              stars: maverickRepo.stargazers_count,
              forks: maverickRepo.forks_count
            },
            createdAt: maverickRepo.created_at,
            updatedAt: maverickRepo.updated_at
          })
        }
      } catch (error) {
        // User doesn't have access to maverick repo, which is fine
        console.log('User does not have access to maverick repository')
      }
    }

    const response = NextResponse.json({
      projects: userProjects,
      count: userProjects.length,
      githubConnection: githubConnectionStatus
    })
    
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response

  } catch (error) {
    apiLogger.logError(request, error as Error)
    const response = NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response
  }
}