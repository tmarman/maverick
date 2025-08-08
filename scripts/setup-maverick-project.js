#!/usr/bin/env node

/**
 * Setup script to create the maverick project in the database
 * This ensures the project context service can find it properly
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

async function setupMaverickProject() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking if maverick project exists in database...')
    
    // Check if project already exists
    const existingProject = await prisma.project.findFirst({
      where: { name: 'maverick' }
    })
    
    if (existingProject) {
      console.log('✅ Maverick project already exists in database')
      console.log(`   ID: ${existingProject.id}`)
      console.log(`   Status: ${existingProject.status}`)
      console.log(`   Type: ${existingProject.type}`)
      return
    }
    
    console.log('📂 Creating maverick project in database...')
    
    // Create the maverick project
    const project = await prisma.project.create({
      data: {
        name: 'maverick',
        description: 'Maverick AI-native business formation platform',
        type: 'SOFTWARE',
        status: 'ACTIVE',
        repositoryUrl: 'https://github.com/your-org/maverick',
        defaultBranch: 'main',
        metadata: JSON.stringify({
          isTemplate: true,
          capabilities: ['ai-generation', 'worktree-management', 'task-automation'],
          framework: 'Next.js',
          language: 'TypeScript'
        }),
        // No organization for now - this is a standalone project
        organizationId: null
      }
    })
    
    console.log('✅ Successfully created maverick project!')
    console.log(`   ID: ${project.id}`)
    console.log(`   Name: ${project.name}`)
    console.log(`   Type: ${project.type}`)
    console.log(`   Status: ${project.status}`)
    
    // Verify the project can be found
    const verification = await prisma.project.findFirst({
      where: { name: 'maverick' },
      include: {
        organization: true
      }
    })
    
    if (verification) {
      console.log('✅ Project verification successful')
    } else {
      console.log('❌ Project verification failed')
    }
    
    // Also initialize the worktree structure
    console.log('🌳 Initializing worktree structure...')
    await initializeWorktreeStructure()
    
  } catch (error) {
    console.error('❌ Error setting up maverick project:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function initializeWorktreeStructure() {
  const { WorktreeManager } = require('../src/lib/worktree-manager')
  
  try {
    const worktreeManager = new WorktreeManager(process.cwd())
    await worktreeManager.initialize()
    
    // Check if project already exists in worktree structure
    const exists = await worktreeManager.projectExists('maverick')
    if (exists) {
      console.log('✅ Maverick project already exists in worktree structure')
      return
    }
    
    console.log('📂 Setting up maverick hierarchical worktree structure...')
    
    // For maverick, we need to create the hierarchical structure pointing to current directory
    // This is a bit special since we're working IN the maverick repo
    const fs = require('fs/promises')
    const path = require('path')
    
    // Create the project structure 
    const mainPath = worktreeManager.getWorktreePath('maverick', 'main')
    await fs.mkdir(path.dirname(mainPath), { recursive: true })
    
    // For development, we'll create a symbolic link to current directory as 'main'
    // In production, this would be a proper git clone
    console.log(`🔗 Creating symbolic link: ${mainPath} -> ${process.cwd()}`)
    try {
      await fs.symlink(process.cwd(), mainPath)
      console.log('✅ Worktree structure initialized with symbolic link')
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log('✅ Worktree structure already exists')
      } else {
        throw error
      }
    }
    
  } catch (error) {
    console.error('❌ Error initializing worktree structure:', error)
    throw error
  }
}

// Run the setup
if (require.main === module) {
  setupMaverickProject()
    .then(() => {
      console.log('🎉 Maverick project setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupMaverickProject }