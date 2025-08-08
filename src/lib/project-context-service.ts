import path from 'path'
import { promises as fs } from 'fs'
import { worktreeManager } from './worktree-manager'

export interface ProjectContext {
  project: string
  currentWorktree: string
  worktreePath: string
  maverickPath: string
  workItemsPath: string
  aiLogsPath: string
  agentsPath: string
}

export class ProjectContextService {
  private static instance: ProjectContextService
  private activeContexts = new Map<string, ProjectContext>()

  static getInstance(): ProjectContextService {
    if (!ProjectContextService.instance) {
      ProjectContextService.instance = new ProjectContextService()
    }
    return ProjectContextService.instance
  }

  /**
   * Get the current project context (defaults to central branch for project management)
   */
  async getProjectContext(projectName: string, preferredBranch?: string): Promise<ProjectContext> {
    // Check if we have a cached context
    const cacheKey = `${projectName}:${preferredBranch || 'central'}`
    if (this.activeContexts.has(cacheKey)) {
      const context = this.activeContexts.get(cacheKey)!
      
      // Verify the context is still valid
      try {
        await fs.access(context.worktreePath)
        return context
      } catch {
        // Context is invalid, remove from cache
        this.activeContexts.delete(cacheKey)
      }
    }

    // Determine which worktree to use
    let targetBranch: string = 'main' // default fallback
    
    if (preferredBranch) {
      // Use specified branch if it exists
      const worktreePath = worktreeManager.getWorktreePath(projectName, preferredBranch)
      try {
        await fs.access(worktreePath)
        targetBranch = preferredBranch
      } catch {
        throw new Error(`Worktree ${preferredBranch} does not exist for project ${projectName}`)
      }
    } else {
      // CENTRAL BRANCH STRATEGY: Always use main for project management views (source of truth)
      try {
        // Check if project exists in file system, if not try to initialize it
        if (!await worktreeManager.projectExists(projectName)) {
          console.log(`📂 Project ${projectName} not found in tmp/repos, attempting to initialize...`)
          await this.initializeProjectFromDatabase(projectName)
        }

        // For project-level views, ALWAYS use main branch (unless specifically requested otherwise)
        if (!preferredBranch) {
          targetBranch = 'main'
          console.log(`📋 Using main branch for project-level context (source of truth)`)
        } else {
          // Only use preferred branch when explicitly requested (feature work context)
          const worktrees = await worktreeManager.listProjectWorktrees(projectName)
          const requestedWorktree = worktrees.find(w => w.branch === preferredBranch)
          
          if (requestedWorktree) {
            targetBranch = preferredBranch
            console.log(`🌳 Using ${preferredBranch} branch for feature work context`)
          } else {
            console.log(`⚠️  Requested branch ${preferredBranch} not found, falling back to main`)
            targetBranch = 'main'
          }
        }
      } catch (error) {
        // Fallback for maverick development
        if (projectName.toLowerCase() === 'maverick') {
          return await this.getFallbackMaverickContext()
        }
        throw new Error(`Cannot determine central worktree for ${projectName}: ${error}`)
      }
    }

    // Build context paths
    const worktreePath = worktreeManager.getWorktreePath(projectName, targetBranch)
    const maverickPath = path.join(worktreePath, '.maverick')
    
    const context: ProjectContext = {
      project: projectName,
      currentWorktree: targetBranch,
      worktreePath,
      maverickPath,
      workItemsPath: path.join(maverickPath, 'work-items'),
      aiLogsPath: path.join(maverickPath, 'ai-logs'),
      agentsPath: path.join(maverickPath, 'agents')
    }

    // Ensure .maverick structure exists
    await this.ensureMaverickStructure(context)

    // Cache the context
    this.activeContexts.set(cacheKey, context)

    return context
  }

  /**
   * Get worktree context for a specific work item (feature branch)
   */
  async getWorkItemContext(projectName: string, workItemId: string): Promise<{
    context: ProjectContext | null
    prStatus: 'none' | 'draft' | 'ready' | 'merged'
    hasChanges: boolean
  }> {
    try {
      // Try to find a worktree associated with this work item
      // Use the work item ID to construct likely branch names
      const possibleBranches = [
        `feat-${workItemId}`,
        `fix-${workItemId}`, 
        `feature-${workItemId}`,
        workItemId
      ]

      for (const branchName of possibleBranches) {
        try {
          const context = await this.getProjectContext(projectName, branchName)
          
          // Check if this worktree has changes relative to main
          const hasChanges = await this.checkWorktreeHasChanges(context)
          
          // TODO: Check actual PR status with GitHub API
          const prStatus = hasChanges ? 'draft' : 'none'
          
          return { context, prStatus, hasChanges }
        } catch {
          continue // Try next branch name
        }
      }

      return { context: null, prStatus: 'none', hasChanges: false }
    } catch (error) {
      console.error(`Error getting work item context for ${workItemId}:`, error)
      return { context: null, prStatus: 'none', hasChanges: false }
    }
  }

  /**
   * Check if a worktree has changes relative to main branch
   */
  async checkWorktreeHasChanges(context: ProjectContext): Promise<boolean> {
    if (context.currentWorktree === 'main') return false
    
    try {
      const { execSync } = require('child_process')
      
      // Check if there are commits ahead of main
      const output = execSync(`git rev-list --count main..HEAD`, {
        cwd: context.worktreePath,
        encoding: 'utf8'
      }).trim()
      
      return parseInt(output) > 0
    } catch {
      return false
    }
  }

  /**
   * Create a new worktree for a work item
   */
  async createWorkItemWorktree(
    projectName: string, 
    workItemId: string, 
    branchType: 'feat' | 'fix' | 'refactor' | 'docs' = 'feat',
    description?: string
  ): Promise<ProjectContext> {
    // Generate branch name from work item
    const branchName = `${branchType}-${workItemId}`
    
    // Create the worktree
    const worktreePath = await worktreeManager.createHierarchicalWorktree(
      projectName, 
      branchName, 
      'main'
    )

    // Get the context for the new worktree
    const context = await this.getProjectContext(projectName, branchName)

    // Add work item association to the worktree's .maverick/project.json
    const projectJsonPath = path.join(context.maverickPath, 'project.json')
    try {
      const configData = await fs.readFile(projectJsonPath, 'utf8')
      const config = JSON.parse(configData)
      
      config.workItem = {
        id: workItemId,
        description: description || '',
        createdAt: new Date().toISOString()
      }
      
      await fs.writeFile(projectJsonPath, JSON.stringify(config, null, 2))
    } catch (error) {
      console.error('Error updating worktree project.json:', error)
    }

    return context
  }

  /**
   * Initialize a project from database info (clone repo, set up worktree structure)
   */
  private async initializeProjectFromDatabase(projectName: string): Promise<void> {
    const { prisma } = require('@/lib/prisma')
    
    try {
      // Look up project in database (SQL Server doesn't support mode: 'insensitive')
      const project = await prisma.project.findFirst({
        where: { 
          name: projectName
        },
        include: {
          organization: true
        }
      })

      if (!project) {
        throw new Error(`Project ${projectName} not found in database`)
      }

      console.log(`🔍 Found project ${projectName} in database:`, {
        name: project.name,
        repositoryUrl: project.repositoryUrl,
        defaultBranch: project.defaultBranch
      })

      // Special handling for the maverick project - it's the current directory
      if (projectName.toLowerCase() === 'maverick') {
        console.log(`🏗️ Using Maverick project from current directory...`)
        await this.initializeMaverickProject()
      } else if (project.repositoryUrl) {
        // Check if project already exists before trying to clone
        if (await worktreeManager.projectExists(projectName)) {
          console.log(`📁 Project ${projectName} already exists on disk, skipping clone`)
        } else {
          // Clone from repository
          console.log(`📥 Cloning ${projectName} from ${project.repositoryUrl}...`)
          await worktreeManager.cloneProjectHierarchical(project.repositoryUrl, projectName)
        }
      } else {
        throw new Error(`Project ${projectName} has no repository URL and cannot be initialized`)
      }

      console.log(`✅ Project ${projectName} initialized successfully`)
    } catch (error) {
      console.error(`❌ Failed to initialize project ${projectName}:`, error)
      
      // For maverick, fall back to current directory structure
      if (projectName.toLowerCase() === 'maverick') {
        console.log(`🔄 Using fallback maverick context...`)
        // Don't throw, let the fallback handle it
        return
      }
      
      throw error
    }
  }

  /**
   * Initialize maverick project by cloning current directory to /tmp/repos/maverick/main
   */
  private async initializeMaverickProject(): Promise<void> {
    const mainRepoPath = worktreeManager.getWorktreePath('maverick', 'main')
    
    // Check if already initialized
    try {
      await fs.access(mainRepoPath)
      console.log(`📁 Maverick main repo already exists at ${mainRepoPath}`)
      return
    } catch {
      // Need to initialize
    }
    
    try {
      const { execSync } = require('child_process')
      
      // Create project directory
      await fs.mkdir(path.dirname(mainRepoPath), { recursive: true })
      
      // Clone current directory to main repo (excluding tmp to avoid recursion)
      console.log(`📂 Cloning current Maverick development to ${mainRepoPath}`)
      
      // Initialize git repo in main location
      execSync(`git clone ${process.cwd()} ${mainRepoPath}`, { stdio: 'pipe' })
      
      // Remove tmp directory from clone to avoid confusion
      const tmpPath = path.join(mainRepoPath, 'tmp')
      try {
        await fs.rm(tmpPath, { recursive: true, force: true })
      } catch {
        // Ignore if tmp doesn't exist
      }
      
      // Set remote to the original development directory for now
      // (In production this would point to the actual git repository)
      execSync(`git remote set-url origin ${process.cwd()}`, { 
        cwd: mainRepoPath, 
        stdio: 'pipe' 
      })
      
      console.log(`✅ Maverick project initialized`)
      console.log(`🌳 Main repo: ${mainRepoPath}`)
      console.log(`📝 Now loading from clone, not original development directory`)
    } catch (error) {
      console.log(`⚠️ Could not initialize maverick clone: ${error}`)
      // Don't throw - fall back to current directory structure
    }
  }

  /**
   * Fallback context for maverick development (uses current .maverick structure)
   */
  private async getFallbackMaverickContext(): Promise<ProjectContext> {
    const currentPath = process.cwd()
    const maverickPath = path.join(currentPath, '.maverick')
    
    // Ensure .maverick structure exists
    const workItemsPath = path.join(maverickPath, 'work-items')
    const aiLogsPath = path.join(maverickPath, 'ai-logs')
    const agentsPath = path.join(maverickPath, 'agents')
    
    await fs.mkdir(workItemsPath, { recursive: true })
    await fs.mkdir(aiLogsPath, { recursive: true })
    await fs.mkdir(agentsPath, { recursive: true })

    return {
      project: 'maverick',
      currentWorktree: 'dev',
      worktreePath: currentPath,
      maverickPath,
      workItemsPath,
      aiLogsPath,
      agentsPath
    }
  }

  /**
   * Switch the active worktree for a project
   */
  async switchProjectContext(projectName: string, targetBranch: string): Promise<ProjectContext> {
    // Clear any cached contexts for this project
    for (const key of Array.from(this.activeContexts.keys())) {
      if (key.startsWith(`${projectName}:`)) {
        this.activeContexts.delete(key)
      }
    }

    // Get new context
    return await this.getProjectContext(projectName, targetBranch)
  }

  /**
   * Get all available worktrees for a project
   */
  async getAvailableWorktrees(projectName: string): Promise<Array<{
    branch: string
    path: string
    isActive: boolean
    lastModified: Date
  }>> {
    try {
      const worktrees = await worktreeManager.listProjectWorktrees(projectName)
      
      // Determine which one is currently "active" (most recently used)
      const currentContext = await this.getProjectContext(projectName)
      
      return worktrees.map(worktree => ({
        branch: worktree.branch,
        path: worktree.path,
        isActive: worktree.branch === currentContext.currentWorktree,
        lastModified: worktree.lastModified
      }))
    } catch (error) {
      console.error(`Error getting worktrees for ${projectName}:`, error)
      return []
    }
  }

  /**
   * Ensure .maverick structure exists in worktree
   */
  private async ensureMaverickStructure(context: ProjectContext): Promise<void> {
    const { maverickPath, workItemsPath, aiLogsPath, agentsPath } = context

    try {
      // Create directories if they don't exist
      await fs.mkdir(workItemsPath, { recursive: true })
      await fs.mkdir(aiLogsPath, { recursive: true })
      await fs.mkdir(agentsPath, { recursive: true })

      // Create project.json if it doesn't exist
      const projectJsonPath = path.join(maverickPath, 'project.json')
      try {
        await fs.access(projectJsonPath)
      } catch {
        const projectConfig = {
          version: "1.0",
          scope: {
            type: context.currentWorktree === 'main' ? 'project' : 'feature',
            name: `${context.project} - ${context.currentWorktree}`,
            description: `Worktree context for ${context.currentWorktree}`,
            branch: context.currentWorktree,
            project: context.project
          },
          createdAt: new Date().toISOString()
        }
        
        await fs.writeFile(projectJsonPath, JSON.stringify(projectConfig, null, 2))
      }
    } catch (error) {
      console.error(`Error ensuring .maverick structure for ${context.project}:`, error)
      throw error
    }
  }

  /**
   * Load work items from current project context
   */
  async loadWorkItems(projectName: string, branch?: string): Promise<any[]> {
    const context = await this.getProjectContext(projectName, branch)
    
    try {
      const files = await fs.readdir(context.workItemsPath)
      const markdownFiles = files.filter(file => file.endsWith('.md'))
      
      const workItems = []
      for (const file of markdownFiles) {
        try {
          const filePath = path.join(context.workItemsPath, file)
          const content = await fs.readFile(filePath, 'utf8')
          
          // Parse frontmatter and content
          const workItem = this.parseWorkItemMarkdown(content, file)
          if (workItem) {
            workItems.push(workItem)
          }
        } catch (error) {
          console.error(`Error loading work item ${file}:`, error)
        }
      }
      
      return workItems
    } catch (error) {
      console.error(`Error loading work items for ${projectName}:`, error)
      return []
    }
  }

  /**
   * Parse work item markdown with frontmatter
   */
  private parseWorkItemMarkdown(content: string, filename: string): any | null {
    try {
      const lines = content.split('\n')
      
      // Check for frontmatter
      if (lines[0] !== '---') {
        return null
      }
      
      const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---')
      if (frontmatterEnd === -1) {
        return null
      }
      
      // Parse frontmatter (simple YAML-like parsing)
      const frontmatter: any = {}
      for (let i = 1; i < frontmatterEnd; i++) {
        const line = lines[i].trim()
        if (line && line.includes(':')) {
          const [key, ...valueParts] = line.split(':')
          const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
          frontmatter[key.trim()] = value
        }
      }
      
      // Get content after frontmatter
      const markdownContent = lines.slice(frontmatterEnd + 1).join('\n').trim()
      
      // Handle parentId and depth parsing
      let parentId = frontmatter.parentId
      if (parentId === 'null' || parentId === '' || parentId === 'undefined') {
        parentId = null
      }

      return {
        id: frontmatter.id || filename.replace('.md', ''),
        title: frontmatter.title || 'Untitled',
        type: frontmatter.type || 'TASK',
        status: frontmatter.status || 'PLANNED',
        priority: frontmatter.priority || 'MEDIUM',
        functionalArea: frontmatter.functionalArea || 'GENERAL',
        estimatedEffort: frontmatter.estimatedEffort || '1d',
        category: frontmatter.category || 'General',
        businessImpact: frontmatter.businessImpact || '',
        parentId: parentId,
        depth: parseInt(frontmatter.depth) || 0,
        orderIndex: parseInt(frontmatter.orderIndex) || Date.now(),
        createdAt: frontmatter.createdAt || new Date().toISOString(),
        updatedAt: frontmatter.updatedAt || new Date().toISOString(),
        aiGenerated: frontmatter.aiGenerated === 'true',
        content: markdownContent,
        filename
      }
    } catch (error) {
      console.error(`Error parsing work item ${filename}:`, error)
      return null
    }
  }
}

// Export singleton
export const projectContextService = ProjectContextService.getInstance()