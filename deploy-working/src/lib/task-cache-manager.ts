/**
 * Task Cache Manager for Maverick
 * 
 * Maintains a .maverick/tasks.json cache index for fast task operations
 * while keeping the markdown files as the source of truth.
 * 
 * The cache includes:
 * - Task metadata for fast filtering/searching
 * - File modification timestamps for cache invalidation
 * - Index mappings for quick lookups
 * - Relationship mapping for hierarchy operations
 */

import { promises as fs } from 'fs'
import path from 'path'
import { HierarchicalTodo } from './hierarchical-todos'

export interface TaskCacheEntry {
  id: string
  title: string
  type: HierarchicalTodo['type']
  status: HierarchicalTodo['status']
  priority: HierarchicalTodo['priority']
  functionalArea: HierarchicalTodo['functionalArea']
  parentId?: string
  depth: number
  orderIndex: number
  estimatedEffort?: string
  createdAt: string
  updatedAt: string
  
  // File metadata
  filename: string
  filePath: string
  fileModified: string
  fileSize: number
  
  // Quick access fields
  hasDescription: boolean
  hasSubtasks: boolean
  subtaskCount: number
  
  // Content hash for change detection
  contentHash: string
}

export interface TaskCacheIndex {
  version: string
  projectName: string
  generatedAt: string
  totalTasks: number
  
  // Fast lookup indexes
  tasks: TaskCacheEntry[]
  taskById: Record<string, TaskCacheEntry>
  tasksByParent: Record<string, string[]>
  tasksByStatus: Record<string, string[]>
  tasksByType: Record<string, string[]>
  
  // File change tracking
  lastScanPath: string
  filesScanned: string[]
  orphanedFiles: string[]
}

export class TaskCacheManager {
  private static instance: TaskCacheManager

  static getInstance(): TaskCacheManager {
    if (!TaskCacheManager.instance) {
      TaskCacheManager.instance = new TaskCacheManager()
    }
    return TaskCacheManager.instance
  }

  /**
   * Get the cache file path for a project
   */
  private getCacheFilePath(maverickPath: string): string {
    return path.join(maverickPath, 'tasks.json')
  }

  /**
   * Load existing cache or create new one
   */
  async loadCache(projectName: string, maverickPath: string): Promise<TaskCacheIndex | null> {
    const cacheFilePath = this.getCacheFilePath(maverickPath)
    
    try {
      const content = await fs.readFile(cacheFilePath, 'utf-8')
      const cache = JSON.parse(content) as TaskCacheIndex
      
      // Validate cache version and structure
      if (cache.version !== '1.0' || cache.projectName !== projectName) {
        console.log('🔄 Cache version mismatch, rebuilding...')
        return null
      }
      
      return cache
    } catch (error) {
      // Cache doesn't exist or is corrupted
      return null
    }
  }

  /**
   * Save cache to disk
   */
  async saveCache(maverickPath: string, cache: TaskCacheIndex): Promise<void> {
    const cacheFilePath = this.getCacheFilePath(maverickPath)
    
    // Ensure .maverick directory exists
    await fs.mkdir(path.dirname(cacheFilePath), { recursive: true })
    
    const content = JSON.stringify(cache, null, 2)
    await fs.writeFile(cacheFilePath, content, 'utf-8')
  }

  /**
   * Build complete cache index from scratch
   */
  async rebuildCache(projectName: string, maverickPath: string): Promise<TaskCacheIndex> {
    console.log(`🏗️ Rebuilding task cache for ${projectName}...`)
    
    const workItemsPath = path.join(maverickPath, 'work-items')
    const tasks: TaskCacheEntry[] = []
    const filesScanned: string[] = []
    const orphanedFiles: string[] = []

    try {
      // Ensure work-items directory exists
      await fs.mkdir(workItemsPath, { recursive: true })
      
      const files = await fs.readdir(workItemsPath)
      const markdownFiles = files.filter(file => file.endsWith('.md'))

      // Process each markdown file
      for (const filename of markdownFiles) {
        try {
          const filePath = path.join(workItemsPath, filename)
          const stats = await fs.stat(filePath)
          const content = await fs.readFile(filePath, 'utf-8')
          
          const taskData = this.parseTaskFromMarkdown(content, filename, filePath, stats)
          
          if (taskData) {
            tasks.push(taskData)
            filesScanned.push(filename)
          } else {
            orphanedFiles.push(filename)
          }
        } catch (error) {
          console.error(`Error processing ${filename}:`, error)
          orphanedFiles.push(filename)
        }
      }

      // Calculate subtask counts
      this.calculateSubtaskCounts(tasks)

      // Build lookup indexes
      const cache: TaskCacheIndex = {
        version: '1.0',
        projectName,
        generatedAt: new Date().toISOString(),
        totalTasks: tasks.length,
        tasks,
        taskById: {},
        tasksByParent: {},
        tasksByStatus: {},
        tasksByType: {},
        lastScanPath: workItemsPath,
        filesScanned,
        orphanedFiles
      }

      // Build indexes
      this.buildIndexes(cache)

      // Save to disk
      await this.saveCache(maverickPath, cache)

      console.log(`✅ Cache rebuilt: ${tasks.length} tasks indexed`)
      return cache

    } catch (error) {
      console.error('Error rebuilding cache:', error)
      throw error
    }
  }

  /**
   * Check if cache needs refresh by comparing file modification times
   */
  async needsRefresh(cache: TaskCacheIndex, maverickPath: string): Promise<boolean> {
    const workItemsPath = path.join(maverickPath, 'work-items')
    
    try {
      const files = await fs.readdir(workItemsPath)
      const markdownFiles = files.filter(file => file.endsWith('.md'))

      // Check if file count changed
      if (markdownFiles.length !== cache.filesScanned.length) {
        return true
      }

      // Check if any file was modified after cache generation
      const cacheGeneratedTime = new Date(cache.generatedAt).getTime()
      
      for (const filename of markdownFiles) {
        const filePath = path.join(workItemsPath, filename)
        try {
          const stats = await fs.stat(filePath)
          if (stats.mtime.getTime() > cacheGeneratedTime) {
            return true
          }
        } catch (error) {
          // File might have been deleted
          return true
        }
      }

      return false
    } catch (error) {
      // Directory doesn't exist or other error
      return true
    }
  }

  /**
   * Get fresh cache, rebuilding if necessary
   */
  async getFreshCache(projectName: string, maverickPath: string): Promise<TaskCacheIndex> {
    let cache = await this.loadCache(projectName, maverickPath)
    
    if (!cache || await this.needsRefresh(cache, maverickPath)) {
      cache = await this.rebuildCache(projectName, maverickPath)
    }
    
    return cache
  }

  /**
   * Invalidate cache entry for a specific task
   */
  async invalidateTask(maverickPath: string, taskId: string): Promise<void> {
    const cache = await this.loadCache('', maverickPath)
    if (!cache) return

    // Remove from cache and rebuild indexes
    cache.tasks = cache.tasks.filter(task => task.id !== taskId)
    cache.totalTasks = cache.tasks.length
    cache.generatedAt = new Date().toISOString()
    
    this.buildIndexes(cache)
    await this.saveCache(maverickPath, cache)
  }

  /**
   * Update cache entry for a specific task
   */
  async updateTaskInCache(maverickPath: string, updatedTask: HierarchicalTodo): Promise<void> {
    const cache = await this.loadCache('', maverickPath)
    if (!cache) return

    const filePath = path.join(maverickPath, 'work-items', `${updatedTask.id}.md`)
    
    try {
      const stats = await fs.stat(filePath)
      const content = await fs.readFile(filePath, 'utf-8')
      
      const taskData = this.parseTaskFromMarkdown(content, `${updatedTask.id}.md`, filePath, stats)
      
      if (taskData) {
        // Update or add task in cache
        const existingIndex = cache.tasks.findIndex(task => task.id === updatedTask.id)
        
        if (existingIndex >= 0) {
          cache.tasks[existingIndex] = taskData
        } else {
          cache.tasks.push(taskData)
        }
        
        cache.totalTasks = cache.tasks.length
        cache.generatedAt = new Date().toISOString()
        
        // Recalculate subtask counts and rebuild indexes
        this.calculateSubtaskCounts(cache.tasks)
        this.buildIndexes(cache)
        
        await this.saveCache(maverickPath, cache)
      }
    } catch (error) {
      console.error('Error updating task in cache:', error)
    }
  }

  /**
   * Parse task data from markdown content
   */
  private parseTaskFromMarkdown(content: string, filename: string, filePath: string, stats: any): TaskCacheEntry | null {
    try {
      const lines = content.split('\n')
      
      // Find frontmatter
      const frontmatterStart = lines.findIndex(line => line.trim() === '---')
      const frontmatterEnd = lines.findIndex((line, index) => index > frontmatterStart && line.trim() === '---')
      
      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return null
      }
      
      // Parse frontmatter
      const frontmatter: any = {}
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        const line = lines[i].trim()
        if (line && line.includes(':')) {
          const [key, ...valueParts] = line.split(':')
          let value: any = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
          
          if (value === 'null') {
            value = undefined
          } else if (key.trim() === 'depth' || key.trim() === 'orderIndex') {
            value = parseInt(value) || 0
          }
          
          frontmatter[key.trim()] = value
        }
      }

      // Check for description content
      const hasDescription = content.includes('## 📋 Description') && 
                           !content.match(/## 📋 Description\s*\n\s*(No description provided\.|$)/m)

      // Generate content hash for change detection
      const contentHash = this.generateSimpleHash(content)

      return {
        id: frontmatter.id,
        title: frontmatter.title || 'Untitled',
        type: frontmatter.type || 'TASK',
        status: frontmatter.status || 'PLANNED',
        priority: frontmatter.priority || 'MEDIUM',
        functionalArea: frontmatter.functionalArea || 'SOFTWARE',
        parentId: frontmatter.parentId,
        depth: frontmatter.depth || 0,
        orderIndex: frontmatter.orderIndex || 0,
        estimatedEffort: frontmatter.estimatedEffort,
        createdAt: frontmatter.createdAt,
        updatedAt: frontmatter.updatedAt,
        filename,
        filePath,
        fileModified: stats.mtime.toISOString(),
        fileSize: stats.size,
        hasDescription,
        hasSubtasks: false, // Will be calculated later
        subtaskCount: 0, // Will be calculated later
        contentHash
      }
    } catch (error) {
      console.error('Error parsing task markdown:', error)
      return null
    }
  }

  /**
   * Calculate subtask counts for all tasks
   */
  private calculateSubtaskCounts(tasks: TaskCacheEntry[]): void {
    const childrenCount: Record<string, number> = {}
    
    // Count children for each task
    tasks.forEach(task => {
      if (task.parentId) {
        childrenCount[task.parentId] = (childrenCount[task.parentId] || 0) + 1
      }
    })
    
    // Update hasSubtasks and subtaskCount
    tasks.forEach(task => {
      const count = childrenCount[task.id] || 0
      task.hasSubtasks = count > 0
      task.subtaskCount = count
    })
  }

  /**
   * Build lookup indexes for fast access
   */
  private buildIndexes(cache: TaskCacheIndex): void {
    cache.taskById = {}
    cache.tasksByParent = {}
    cache.tasksByStatus = {}
    cache.tasksByType = {}
    
    cache.tasks.forEach(task => {
      // By ID index
      cache.taskById[task.id] = task
      
      // By parent index
      if (task.parentId) {
        if (!cache.tasksByParent[task.parentId]) {
          cache.tasksByParent[task.parentId] = []
        }
        cache.tasksByParent[task.parentId].push(task.id)
      }
      
      // By status index
      if (!cache.tasksByStatus[task.status]) {
        cache.tasksByStatus[task.status] = []
      }
      cache.tasksByStatus[task.status].push(task.id)
      
      // By type index
      if (!cache.tasksByType[task.type]) {
        cache.tasksByType[task.type] = []
      }
      cache.tasksByType[task.type].push(task.id)
    })
  }

  /**
   * Generate a simple hash of content for change detection
   */
  private generateSimpleHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
}

export const taskCacheManager = TaskCacheManager.getInstance()