const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedMaverickProject() {
  try {
    console.log('🔍 Checking for existing Maverick project...')
    
    // Check if maverick project already exists (SQL Server doesn't support case-insensitive mode)
    const existingProject = await prisma.project.findFirst({
      where: {
        name: 'maverick'
      }
    })
    
    if (existingProject) {
      console.log('✅ Maverick project already exists:', existingProject.id)
      return
    }
    
    // Check for a business to attach the project to
    let business = await prisma.business.findFirst()
    
    if (!business) {
      console.log('🏢 Creating default business for Maverick project...')
      
      // Create a default business
      business = await prisma.business.create({
        data: {
          name: 'Maverick Development',
          description: 'AI-native business formation platform',
          businessType: 'online',
          legalStructure: 'llc',
          status: 'ACTIVE',
          squareServices: JSON.stringify(['payments', 'pos']),
          appFeatures: JSON.stringify(['ai_agents', 'project_management', 'business_formation']),
          githubRepoId: 'maverick-repo',
          repositoryUrl: 'https://github.com/tmarman/maverick',
          defaultBranch: 'main',
          subscriptionPlan: 'founder',
          subscriptionStatus: 'ACTIVE',
          ownerId: 'system' // Placeholder - will be updated when real users exist
        }
      })
      console.log('✅ Created business:', business.id)
    } else {
      console.log('✅ Using existing business:', business.id)
    }
    
    // Create the maverick project
    console.log('🚀 Creating Maverick project...')
    
    const project = await prisma.project.create({
      data: {
        name: 'maverick',
        description: 'AI-powered business development platform with .maverick workspace architecture',
        type: 'SOFTWARE',
        status: 'ACTIVE',
        businessId: business.id,
        githubRepoId: 'maverick-repo-id',
        repositoryUrl: 'https://github.com/tmarman/maverick',
        defaultBranch: 'main',
        githubConfig: JSON.stringify({
          owner: 'tmarman',
          repo: 'maverick',
          full_name: 'tmarman/maverick',
          clone_url: 'https://github.com/tmarman/maverick.git',
          ssh_url: 'git@github.com:tmarman/maverick.git',
          language: 'TypeScript',
          private: false,
          stars: 0,
          forks: 0
        }),
        aiAgentConfig: JSON.stringify({
          enabledAgents: ['product_expert', 'developer', 'project_manager'],
          defaultAgent: 'developer',
          aiInstructions: 'configured'
        }),
        metadata: JSON.stringify({
          hasStructure: true,
          templateUsed: 'ai-platform',
          customTheme: 'maverick_brand',
          workspacePath: '/repositories/tim/maverick'
        })
      }
    })
    
    console.log('🎉 Successfully created Maverick project:', project.id)
    console.log('📁 Project details:', {
      name: project.name,
      type: project.type,
      status: project.status,
      repositoryUrl: project.repositoryUrl
    })
    
  } catch (error) {
    console.error('❌ Error seeding Maverick project:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedMaverickProject()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })