/**
 * Task Ordering System for Maverick
 * 
 * This system provides drag-and-drop ordering with persistent file-based storage
 * that works well with Git and the .maverick directory structure.
 * 
 * Approach:
 * - Use a `.task-order.json` file in each .maverick directory
 * - Store arrays of task IDs grouped by status
 * - Individual work item files remain unchanged
 * - Ordering is overlaid at display time
 */

import { promises as fs } from 'fs'
import path from 'path'

export interface TaskOrder {
  version: string
  lastUpdated: string
  statusGroups: {
    [status: string]: {
      taskIds: string[]
      collapsed?: boolean
    }
  }
  customSections?: {
    [sectionName: string]: {
      taskIds: string[]
      collapsed?: boolean
      color?: string
    }
  }
}

export class TaskOrderingService {
  private static instance: TaskOrderingService

  static getInstance(): TaskOrderingService {
    if (!TaskOrderingService.instance) {
      TaskOrderingService.instance = new TaskOrderingService()
    }
    return TaskOrderingService.instance
  }

  async getTaskOrder(maverickPath: string): Promise<TaskOrder> {
    const orderFile = path.join(maverickPath, '.task-order.json')
    
    try {
      const content = await fs.readFile(orderFile, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      // Return default ordering if file doesn't exist
      return this.createDefaultOrder()
    }
  }

  async saveTaskOrder(maverickPath: string, order: TaskOrder): Promise<void> {
    const orderFile = path.join(maverickPath, '.task-order.json')
    
    order.lastUpdated = new Date().toISOString()
    
    await fs.writeFile(orderFile, JSON.stringify(order, null, 2), 'utf-8')
  }

  async reorderTasks(
    maverickPath: string,
    taskId: string,
    fromStatus: string,
    toStatus: string,
    newIndex: number
  ): Promise<TaskOrder> {
    const order = await this.getTaskOrder(maverickPath)
    
    // Remove from current position
    if (order.statusGroups[fromStatus]) {
      const currentIndex = order.statusGroups[fromStatus].taskIds.indexOf(taskId)
      if (currentIndex > -1) {
        order.statusGroups[fromStatus].taskIds.splice(currentIndex, 1)
      }
    }
    
    // Add to new position
    if (!order.statusGroups[toStatus]) {
      order.statusGroups[toStatus] = { taskIds: [] }
    }
    
    order.statusGroups[toStatus].taskIds.splice(newIndex, 0, taskId)
    
    await this.saveTaskOrder(maverickPath, order)
    return order
  }

  async addTaskToOrder(
    maverickPath: string,
    taskId: string,
    status: string,
    position: 'top' | 'bottom' = 'top'
  ): Promise<void> {
    const order = await this.getTaskOrder(maverickPath)
    
    if (!order.statusGroups[status]) {
      order.statusGroups[status] = { taskIds: [] }
    }
    
    // Remove if already exists
    const existingIndex = order.statusGroups[status].taskIds.indexOf(taskId)
    if (existingIndex > -1) {
      order.statusGroups[status].taskIds.splice(existingIndex, 1)
    }
    
    // Add to position
    if (position === 'top') {
      order.statusGroups[status].taskIds.unshift(taskId)
    } else {
      order.statusGroups[status].taskIds.push(taskId)
    }
    
    await this.saveTaskOrder(maverickPath, order)
  }

  async removeTaskFromOrder(maverickPath: string, taskId: string): Promise<void> {
    const order = await this.getTaskOrder(maverickPath)
    
    // Remove from all status groups
    for (const status in order.statusGroups) {
      const index = order.statusGroups[status].taskIds.indexOf(taskId)
      if (index > -1) {
        order.statusGroups[status].taskIds.splice(index, 1)
      }
    }
    
    // Remove from custom sections
    if (order.customSections) {
      for (const section in order.customSections) {
        const index = order.customSections[section].taskIds.indexOf(taskId)
        if (index > -1) {
          order.customSections[section].taskIds.splice(index, 1)
        }
      }
    }
    
    await this.saveTaskOrder(maverickPath, order)
  }

  applyOrderToTasks<T extends { id: string; status: string }>(
    tasks: T[],
    order: TaskOrder
  ): T[] {
    const taskMap = new Map(tasks.map(task => [task.id, task]))
    const orderedTasks: T[] = []
    const usedTaskIds = new Set<string>()
    
    // Add tasks according to order
    for (const [status, group] of Object.entries(order.statusGroups)) {
      for (const taskId of group.taskIds) {
        const task = taskMap.get(taskId)
        if (task && task.status === status) {
          orderedTasks.push(task)
          usedTaskIds.add(taskId)
        }
      }
    }
    
    // Add any tasks not in the order file (newly created)
    for (const task of tasks) {
      if (!usedTaskIds.has(task.id)) {
        orderedTasks.push(task)
      }
    }
    
    return orderedTasks
  }

  private createDefaultOrder(): TaskOrder {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      statusGroups: {
        'PENDING': { taskIds: [] },
        'PLANNED': { taskIds: [] },
        'IN_PROGRESS': { taskIds: [] },
        'IN_REVIEW': { taskIds: [] },
        'DONE': { taskIds: [], collapsed: true },
        'DEFERRED': { taskIds: [], collapsed: true }
      }
    }
  }

  async createCustomSection(
    maverickPath: string,
    sectionName: string,
    taskIds: string[] = [],
    color?: string
  ): Promise<void> {
    const order = await this.getTaskOrder(maverickPath)
    
    if (!order.customSections) {
      order.customSections = {}
    }
    
    order.customSections[sectionName] = {
      taskIds,
      collapsed: false,
      color
    }
    
    await this.saveTaskOrder(maverickPath, order)
  }

  async toggleSectionCollapsed(
    maverickPath: string,
    sectionName: string,
    isCustom = false
  ): Promise<void> {
    const order = await this.getTaskOrder(maverickPath)
    
    if (isCustom && order.customSections && order.customSections[sectionName]) {
      order.customSections[sectionName].collapsed = !order.customSections[sectionName].collapsed
    } else if (order.statusGroups[sectionName]) {
      order.statusGroups[sectionName].collapsed = !order.statusGroups[sectionName].collapsed
    }
    
    await this.saveTaskOrder(maverickPath, order)
  }
}

export const taskOrderingService = TaskOrderingService.getInstance()

/**
 * Usage Example:
 * 
 * // Load tasks with custom ordering
 * const tasks = await loadWorkItems()
 * const order = await taskOrderingService.getTaskOrder(maverickPath)
 * const orderedTasks = taskOrderingService.applyOrderToTasks(tasks, order)
 * 
 * // Handle drag and drop
 * await taskOrderingService.reorderTasks(
 *   maverickPath,
 *   taskId,
 *   'PLANNED',    // from status
 *   'IN_PROGRESS', // to status
 *   2             // new index in destination
 * )
 */