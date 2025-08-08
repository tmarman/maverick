/**
 * Worktree Queue Service
 * Manages task queues within worktrees and persistent worktree state
 */

import { promises as fs } from 'fs'
import path from 'path'
import { WorktreeQueue, QueuedTask, WorktreeCategory, SmartWorktreeManager } from './smart-worktree-manager'

export class WorktreeQueueService {
  private static instance: WorktreeQueueService
  private queuesCache = new Map<string, WorktreeQueue>()

  static getInstance(): WorktreeQueueService {
    if (!WorktreeQueueService.instance) {
      WorktreeQueueService.instance = new WorktreeQueueService()
    }
    return WorktreeQueueService.instance
  }

  /**
   * Get the queue file path for a worktree
   */
  private getQueueFilePath(projectName: string, worktreeName: string): string {
    return path.join(
      process.cwd(), 
      'tmp', 
      'repos', 
      projectName, 
      worktreeName, 
      '.maverick', 
      'worktree-queue.json'
    )
  }

  /**
   * Load queue from file or create new one
   */
  async loadQueue(projectName: string, worktreeName: string): Promise<WorktreeQueue> {
    const cacheKey = `${projectName}:${worktreeName}`
    
    // Check cache first
    if (this.queuesCache.has(cacheKey)) {
      return this.queuesCache.get(cacheKey)!
    }

    const queueFilePath = this.getQueueFilePath(projectName, worktreeName)
    
    try {
      const queueData = await fs.readFile(queueFilePath, 'utf-8')
      const queue: WorktreeQueue = JSON.parse(queueData)
      this.queuesCache.set(cacheKey, queue)
      return queue
    } catch (error) {
      // File doesn't exist, create new queue
      return this.createNewQueue(projectName, worktreeName)
    }
  }

  /**
   * Create a new queue for a worktree
   */
  private async createNewQueue(projectName: string, worktreeName: string): Promise<WorktreeQueue> {
    // Determine category based on worktree name
    const categories: WorktreeCategory[] = [] // TODO: Load from project configuration
    const category = categories.find((c: WorktreeCategory) => c.name === worktreeName) || {
      id: 'general',
      name: 'General',
      description: 'General development tasks',
      team: 'Development',
      color: '#6B7280'
    }

    const queue: WorktreeQueue = {
      worktreeName,
      category,
      tasks: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }

    await this.saveQueue(projectName, queue)
    return queue
  }

  /**
   * Save queue to file and cache
   */
  async saveQueue(projectName: string, queue: WorktreeQueue): Promise<void> {
    const queueFilePath = this.getQueueFilePath(projectName, queue.worktreeName)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(queueFilePath), { recursive: true })
    
    // Update last activity
    queue.lastActivity = new Date().toISOString()
    
    // Save to file
    await fs.writeFile(queueFilePath, JSON.stringify(queue, null, 2))
    
    // Update cache
    const cacheKey = `${projectName}:${queue.worktreeName}`
    this.queuesCache.set(cacheKey, queue)
  }

  /**
   * Add a task to the worktree queue
   */
  async addTaskToQueue(
    projectName: string, 
    worktreeName: string, 
    taskId: string,
    title: string,
    type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK',
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  ): Promise<WorktreeQueue> {
    const queue = await this.loadQueue(projectName, worktreeName)
    
    // Check if task already exists
    const existingTask = queue.tasks.find(t => t.taskId === taskId)
    if (existingTask) {
      throw new Error(`Task ${taskId} already exists in worktree queue`)
    }

    const queuedTask: QueuedTask = {
      taskId,
      title,
      type,
      priority,
      status: 'QUEUED',
      addedAt: new Date().toISOString()
    }

    queue.tasks.push(queuedTask)
    await this.saveQueue(projectName, queue)
    
    return queue
  }

  /**
   * Start working on the next task in queue
   */
  async startNextTask(projectName: string, worktreeName: string): Promise<QueuedTask | null> {
    const queue = await this.loadQueue(projectName, worktreeName)
    
    // Find the next queued task (prioritize by priority, then by order)
    const nextTask = queue.tasks
      .filter(t => t.status === 'QUEUED')
      .sort((a, b) => {
        // Priority order: CRITICAL > URGENT > HIGH > MEDIUM > LOW
        const priorityOrder = { CRITICAL: 5, URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        // If same priority, use order added (FIFO)
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      })[0]

    if (!nextTask) {
      return null // No tasks in queue
    }

    // Mark as in progress
    nextTask.status = 'IN_PROGRESS'
    await this.saveQueue(projectName, queue)
    
    return nextTask
  }

  /**
   * Complete a task (mark as done, optionally record commit)
   */
  async completeTask(
    projectName: string, 
    worktreeName: string, 
    taskId: string,
    commitSha?: string
  ): Promise<void> {
    const queue = await this.loadQueue(projectName, worktreeName)
    
    const task = queue.tasks.find(t => t.taskId === taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found in worktree queue`)
    }

    task.status = 'COMPLETED'
    task.completedAt = new Date().toISOString()
    if (commitSha) {
      task.commitSha = commitSha
    }

    await this.saveQueue(projectName, queue)
  }

  /**
   * Remove a task from the queue
   */
  async removeTaskFromQueue(
    projectName: string, 
    worktreeName: string, 
    taskId: string
  ): Promise<void> {
    const queue = await this.loadQueue(projectName, worktreeName)
    
    queue.tasks = queue.tasks.filter(t => t.taskId !== taskId)
    await this.saveQueue(projectName, queue)
  }

  /**
   * Get all active worktree queues for a project
   */
  async getActiveQueues(projectName: string): Promise<WorktreeQueue[]> {
    const worktreesPath = path.join(process.cwd(), 'tmp', 'repos', projectName)
    
    try {
      const entries = await fs.readdir(worktreesPath, { withFileTypes: true })
      const worktreeNames = entries
        .filter(entry => entry.isDirectory() && entry.name !== 'main')
        .map(entry => entry.name)

      const queues = await Promise.all(
        worktreeNames.map(name => this.loadQueue(projectName, name))
      )

      return queues.filter(queue => queue.status === 'ACTIVE')
    } catch (error) {
      return [] // No worktrees exist yet
    }
  }

  /**
   * Pause/Resume a worktree queue
   */
  async setQueueStatus(
    projectName: string, 
    worktreeName: string, 
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  ): Promise<void> {
    const queue = await this.loadQueue(projectName, worktreeName)
    queue.status = status
    await this.saveQueue(projectName, queue)
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(projectName: string, worktreeName: string): Promise<{
    total: number
    queued: number
    inProgress: number
    completed: number
  }> {
    const queue = await this.loadQueue(projectName, worktreeName)
    
    return {
      total: queue.tasks.length,
      queued: queue.tasks.filter(t => t.status === 'QUEUED').length,
      inProgress: queue.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: queue.tasks.filter(t => t.status === 'COMPLETED').length
    }
  }
}