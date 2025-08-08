#!/usr/bin/env node

/**
 * Setup script to create the maverick worktree directory structure
 * This creates the hierarchical worktree structure expected by WorktreeManager
 */

const fs = require('fs/promises')
const path = require('path')

async function setupWorktreeStructure() {
  try {
    console.log('🌳 Setting up maverick hierarchical worktree structure...')
    
    // Create the directory structure: tmp/repos/maverick/main/
    const worktreeRoot = path.join(process.cwd(), 'tmp', 'repos')
    const projectPath = path.join(worktreeRoot, 'maverick')
    const mainPath = path.join(projectPath, 'main')
    
    console.log(`📁 Creating directories:`)
    console.log(`   Root: ${worktreeRoot}`)
    console.log(`   Project: ${projectPath}`)
    console.log(`   Main: ${mainPath}`)
    
    // Create the directory structure
    await fs.mkdir(projectPath, { recursive: true })
    
    // Check if main already exists
    try {
      await fs.access(mainPath)
      console.log('✅ Maverick main worktree already exists')
      return
    } catch {
      // Doesn't exist, create it
    }
    
    // For development, create a symbolic link to current directory as 'main'
    // In production, this would be a proper git clone
    console.log(`🔗 Creating symbolic link: ${mainPath} -> ${process.cwd()}`)
    
    try {
      await fs.symlink(process.cwd(), mainPath)
      console.log('✅ Worktree structure initialized with symbolic link')
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log('✅ Symbolic link already exists')
      } else {
        console.error('❌ Failed to create symbolic link:', error.message)
        throw error
      }
    }
    
    // Verify the structure
    console.log('🔍 Verifying worktree structure...')
    const stats = await fs.lstat(mainPath)
    if (stats.isSymbolicLink()) {
      const target = await fs.readlink(mainPath)
      console.log(`✅ Symbolic link verified: ${mainPath} -> ${target}`)
    } else if (stats.isDirectory()) {
      console.log(`✅ Directory exists: ${mainPath}`)
    }
    
    // Also ensure .maverick structure exists in the main directory
    const maverickPath = path.join(mainPath, '.maverick')
    console.log(`📂 Ensuring .maverick structure exists at ${maverickPath}`)
    
    await fs.mkdir(path.join(maverickPath, 'work-items'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'ai-logs'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'agents'), { recursive: true })
    
    // Create basic project.json if it doesn't exist
    const projectJsonPath = path.join(maverickPath, 'project.json')
    try {
      await fs.access(projectJsonPath)
      console.log('✅ Project.json already exists')
    } catch {
      const projectConfig = {
        version: "1.0",
        scope: {
          type: "project",
          name: "maverick",
          description: "Maverick AI-native business formation platform",
          branch: "main",
          baseBranch: "main"
        },
        createdAt: new Date().toISOString()
      }
      
      await fs.writeFile(projectJsonPath, JSON.stringify(projectConfig, null, 2))
      console.log('✅ Created project.json')
    }
    
  } catch (error) {
    console.error('❌ Error setting up worktree structure:', error)
    throw error
  }
}

// Run the setup
if (require.main === module) {
  setupWorktreeStructure()
    .then(() => {
      console.log('🎉 Maverick worktree structure setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupWorktreeStructure }