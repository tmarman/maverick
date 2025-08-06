import { NextRequest, NextResponse } from 'next/server'
import { worktreeManager } from '@/lib/worktree-manager'
import { projectContextService } from '@/lib/project-context-service'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    
    // Special handling for maverick project
    if (projectName === 'maverick') {
      console.log('🏗️ Setting up Maverick project in hierarchical structure...')
      
      // Check if already exists
      if (await worktreeManager.projectExists(projectName)) {
        return NextResponse.json({ 
          success: true, 
          message: 'Maverick project already exists',
          existingWorktrees: await worktreeManager.listProjectWorktrees(projectName)
        })
      }

      // Initialize maverick as a local project (not cloned from remote)
      const projectPath = worktreeManager.getProjectPath(projectName)
      await fs.mkdir(projectPath, { recursive: true })

      // Initialize as git repo
      const { execSync } = require('child_process')
      execSync('git init --bare', { cwd: projectPath })

      // Create main worktree by copying current state
      const mainWorktreePath = worktreeManager.getWorktreePath(projectName, 'main')
      
      // Clone current directory to main worktree
      execSync(`git clone ${process.cwd()} ${mainWorktreePath}`, {
        stdio: 'inherit'
      })

      // Copy our .maverick structure to the new worktree
      const currentMaverickPath = path.join(process.cwd(), '.maverick')
      const newMaverickPath = path.join(mainWorktreePath, '.maverick')
      
      try {
        await fs.access(currentMaverickPath)
        // Copy .maverick directory
        execSync(`cp -r "${currentMaverickPath}" "${newMaverickPath}"`, {
          stdio: 'inherit'
        })
        console.log('✅ Copied .maverick structure to new worktree')
      } catch (error) {
        console.log('⚠️ No existing .maverick to copy, will create fresh')
      }

      // Initialize the worktree properly  
      await projectContextService.getProjectContext(projectName, 'main')

      console.log(`✅ Maverick project initialized at: ${projectPath}`)
      console.log(`📁 Main worktree at: ${mainWorktreePath}`)

      return NextResponse.json({
        success: true,
        message: 'Maverick project initialized successfully',
        projectPath,
        mainWorktreePath,
        worktrees: await worktreeManager.listProjectWorktrees(projectName)
      })
    }

    return NextResponse.json({ error: 'Project setup not supported for this project' }, { status: 400 })
  } catch (error: any) {
    console.error('Error setting up project:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}