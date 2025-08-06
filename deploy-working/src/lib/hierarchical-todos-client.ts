/**
 * Client-side Hierarchical Todo Service for Maverick
 * 
 * This service provides the same interface as the server-side hierarchical-todos.ts
 * but uses API calls instead of direct file system access.
 */

export interface HierarchicalTodo {
  id: string
  title: string
  description?: string
  type: 'EPIC' | 'FEATURE' | 'STORY' | 'TASK' | 'SUBTASK' | 'BUG'
  status: 'PENDING' | 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'DEFERRED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING'
  
  // Hierarchy
  parentId?: string
  children?: HierarchicalTodo[]
  depth: number
  orderIndex: number
  
  // Metadata
  estimatedEffort?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'  // T-shirt sizing
  assignedTo?: string
  dueDate?: string
  tags?: string[]
  
  // System
  createdAt: string
  updatedAt: string
  projectName: string
  
  // File reference
  filename?: string
  filePath?: string
}

export class HierarchicalTodoClientService {
  private static instance: HierarchicalTodoClientService

  static getInstance(): HierarchicalTodoClientService {
    if (!HierarchicalTodoClientService.instance) {
      HierarchicalTodoClientService.instance = new HierarchicalTodoClientService()
    }
    return HierarchicalTodoClientService.instance
  }

  /**
   * Create a new todo (can be nested under a parent)
   */
  async createTodo(
    projectName: string,
    todo: Partial<HierarchicalTodo>,
    parentId?: string
  ): Promise<HierarchicalTodo> {
    const response = await fetch(`/api/projects/${projectName}/hierarchical-todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo, parentId })
    })

    if (!response.ok) {
      throw new Error(`Failed to create todo: ${response.statusText}`)
    }

    const data = await response.json()
    return data.todo
  }

  /**
   * Get a single todo by ID
   */
  async getTodo(projectName: string, todoId: string): Promise<HierarchicalTodo | null> {
    const response = await fetch(`/api/projects/${projectName}/hierarchical-todos/${todoId}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get todo: ${response.statusText}`)
    }

    const data = await response.json()
    return data.todo
  }

  /**
   * Get all todos and build hierarchy tree
   */
  async getAllTodosWithHierarchy(projectName: string): Promise<HierarchicalTodo[]> {
    const response = await fetch(`/api/projects/${projectName}/hierarchical-todos`)
    
    if (!response.ok) {
      throw new Error(`Failed to get todos: ${response.statusText}`)
    }

    const data = await response.json()
    return data.todos
  }

  /**
   * Get immediate children of a todo
   */
  async getChildTodos(projectName: string, parentId: string): Promise<HierarchicalTodo[]> {
    const response = await fetch(`/api/projects/${projectName}/hierarchical-todos/${parentId}/children`)
    
    if (!response.ok) {
      throw new Error(`Failed to get child todos: ${response.statusText}`)
    }

    const data = await response.json()
    return data.children
  }

  /**
   * Update a todo
   */
  async updateTodo(
    projectName: string,
    todoId: string,
    updates: Partial<HierarchicalTodo>
  ): Promise<HierarchicalTodo | null> {
    const response = await fetch(`/api/projects/${projectName}/hierarchical-todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })

    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to update todo: ${response.statusText}`)
    }

    const data = await response.json()
    return data.todo
  }

  /**
   * Delete a todo (and optionally its children)
   */
  async deleteTodo(
    projectName: string,
    todoId: string,
    deleteChildren = false
  ): Promise<boolean> {
    const response = await fetch(`/api/projects/${projectName}/hierarchical-todos/${todoId}`, {
      method: 'DELETE'
    })

    if (response.status === 404) {
      return false
    }
    
    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.statusText}`)
    }

    return true
  }

  /**
   * Move a todo to a different parent (or make it top-level)
   */
  async moveTodo(
    projectName: string,
    todoId: string,
    newParentId?: string,
    newOrderIndex?: number
  ): Promise<HierarchicalTodo | null> {
    const updates: Partial<HierarchicalTodo> = {
      parentId: newParentId
    }
    
    if (newOrderIndex !== undefined) {
      updates.orderIndex = newOrderIndex
    }
    
    return await this.updateTodo(projectName, todoId, updates)
  }
}

export const hierarchicalTodoClientService = HierarchicalTodoClientService.getInstance()