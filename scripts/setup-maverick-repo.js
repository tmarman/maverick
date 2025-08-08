#!/usr/bin/env node

/**
 * Setup script to properly initialize the maverick repository in the hierarchical structure
 * This creates tmp/repos/maverick/main as a proper git repository
 */

const fs = require('fs/promises')
const path = require('path')
const { execSync } = require('child_process')

async function setupMaverickRepo() {
  try {
    console.log('🚀 Setting up maverick repository for hierarchical worktree system...')
    
    const worktreeRoot = path.join(process.cwd(), 'tmp', 'repos')
    const projectPath = path.join(worktreeRoot, 'maverick')
    const mainPath = path.join(projectPath, 'main')
    
    console.log(`📁 Target: ${mainPath}`)
    
    // Create project directory
    await fs.mkdir(projectPath, { recursive: true })
    
    // Check if main repo already exists and is properly initialized
    try {
      const gitPath = path.join(mainPath, '.git')
      await fs.access(gitPath)
      console.log('✅ Maverick main repository already exists')
      
      // Verify it's a proper git repo
      try {
        execSync('git status', { cwd: mainPath, stdio: 'pipe' })
        console.log('✅ Git repository is healthy')
        return // Already properly set up
      } catch (error) {
        console.log('⚠️ Git repository exists but has issues, reinitializing...')
        await fs.rm(mainPath, { recursive: true, force: true })
      }
    } catch {
      // Doesn't exist or not accessible, need to create
      console.log('📂 Creating maverick main repository...')
    }
    
    // Remove existing directory if it exists but isn't a proper git repo
    try {
      await fs.access(mainPath)
      console.log('🧹 Removing existing incomplete directory...')
      await fs.rm(mainPath, { recursive: true, force: true })
    } catch {
      // Directory doesn't exist, that's fine
    }
    
    // Copy current directory to main path (excluding tmp to avoid recursion)
    console.log('📋 Copying current maverick repository...')
    
    // Use rsync to copy, excluding tmp and other unnecessary directories
    const excludes = [
      '--exclude=tmp/',
      '--exclude=node_modules/',
      '--exclude=.next/',
      '--exclude=dist/',
      '--exclude=build/',
      '--exclude=coverage/',
      '--exclude=.nyc_output/'
    ]
    
    const rsyncCmd = `rsync -av ${excludes.join(' ')} ${process.cwd()}/ ${mainPath}/`
    console.log('🔄 Running:', rsyncCmd)
    execSync(rsyncCmd, { stdio: 'inherit' })
    
    // Verify git repository
    try {
      execSync('git status', { cwd: mainPath, stdio: 'pipe' })
      console.log('✅ Git repository copied successfully')
    } catch (error) {
      console.log('⚠️ Git repository not found, initializing...')
      execSync('git init', { cwd: mainPath, stdio: 'pipe' })
      execSync('git add .', { cwd: mainPath, stdio: 'pipe' })
      execSync('git commit -m "Initial commit for hierarchical worktree system"', { 
        cwd: mainPath, 
        stdio: 'pipe' 
      })
      console.log('✅ Initialized git repository')
    }
    
    // Ensure .maverick structure exists and has proper project.json
    const maverickPath = path.join(mainPath, '.maverick')
    await fs.mkdir(path.join(maverickPath, 'work-items'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'ai-logs'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'agents'), { recursive: true })
    
    const projectJsonPath = path.join(maverickPath, 'project.json')
    const projectConfig = {
      version: "1.0",
      scope: {
        type: "project",
        name: "maverick",
        description: "Maverick AI-native business formation platform",
        branch: "main",
        baseBranch: "main"
      },
      createdAt: new Date().toISOString(),
      hierarchicalWorktree: true
    }
    
    await fs.writeFile(projectJsonPath, JSON.stringify(projectConfig, null, 2))
    console.log('✅ Created .maverick structure')
    
    // Test that worktree operations would work
    console.log('🧪 Testing git worktree capability...')
    try {
      const result = execSync('git worktree list', { cwd: mainPath, encoding: 'utf8' })
      console.log('✅ Git worktree is functional')
      console.log('   Current worktrees:')
      console.log(result.trim().split('\n').map(line => `   ${line}`).join('\n'))
    } catch (error) {
      console.log('⚠️ Git worktree test failed:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error setting up maverick repository:', error)
    throw error
  }
}

// Run the setup
if (require.main === module) {
  setupMaverickRepo()
    .then(() => {
      console.log('🎉 Maverick repository setup complete!')
      console.log('   The hierarchical worktree system is now ready to use.')
      console.log('   Main repository: tmp/repos/maverick/main/')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupMaverickRepo }