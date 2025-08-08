/**
 * Hierarchical Todo System for Maverick
 * 
 * This system enables recursive task nesting with full CRUD operations
 * and maintains the file-based structure while supporting unlimited depth.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

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

  // Worktree integration
  worktreeName?: string
  worktreePath?: string
  worktreeStatus?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  
  // Smart categorization
  smartCategory?: {
    id: string
    name: string
    team: string
    color: string
    categorizedAt: string
  }
}

export class HierarchicalTodoService {
  private static instance: HierarchicalTodoService

  static getInstance(): HierarchicalTodoService {
    if (!HierarchicalTodoService.instance) {
      HierarchicalTodoService.instance = new HierarchicalTodoService()
    }
    return HierarchicalTodoService.instance
  }

  /**
   * Create a new todo (can be nested under a parent)
   */
  async createTodo(
    projectName: string,
    maverickPath: string,
    todo: Partial<HierarchicalTodo>,
    parentId?: string
  ): Promise<HierarchicalTodo> {
    const todoId = randomUUID()
    const timestamp = new Date().toISOString()
    
    // Calculate depth and order index
    let depth = 0
    let orderIndex = Date.now()
    
    if (parentId) {
      const parent = await this.getTodo(projectName, maverickPath, parentId)
      if (parent) {
        depth = parent.depth + 1
        // Get siblings to determine order
        const siblings = await this.getChildTodos(projectName, maverickPath, parentId)
        orderIndex = siblings.length
      }
    }
    
    const newTodo: HierarchicalTodo = {
      id: todoId,
      title: todo.title || 'Untitled Task',
      description: todo.description || '',
      type: todo.type || (depth > 0 ? 'SUBTASK' : 'TASK'),
      status: todo.status || 'PLANNED',
      priority: todo.priority || 'MEDIUM',
      functionalArea: todo.functionalArea || 'SOFTWARE',
      parentId,
      depth,
      orderIndex,
      estimatedEffort: todo.estimatedEffort,
      assignedTo: todo.assignedTo,
      dueDate: todo.dueDate,
      tags: todo.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      projectName
    }
    
    // Save to file
    await this.saveTodoToFile(maverickPath, newTodo)
    
    return newTodo
  }

  /**
   * Get a single todo by ID
   */
  async getTodo(projectName: string, maverickPath: string, todoId: string): Promise<HierarchicalTodo | null> {
    const workItemsPath = path.join(maverickPath, 'work-items')
    const filePath = path.join(workItemsPath, `${todoId}.md`)
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return this.parseMarkdownToTodo(content, filePath)
    } catch (error) {
      return null
    }
  }

  /**
   * Get all todos and build hierarchy tree
   */
  async getAllTodosWithHierarchy(projectName: string, maverickPath: string): Promise<HierarchicalTodo[]> {
    const workItemsPath = path.join(maverickPath, 'work-items')
    
    try {
      const files = await fs.readdir(workItemsPath)
      const markdownFiles = files.filter(file => file.endsWith('.md'))
      
      const allTodos: HierarchicalTodo[] = []
      
      // Load all todos
      for (const file of markdownFiles) {
        try {
          const filePath = path.join(workItemsPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const todo = this.parseMarkdownToTodo(content, filePath)
          
          if (todo) {
            allTodos.push(todo)
          }
        } catch (error) {
          console.error(`Error loading todo ${file}:`, error)
        }
      }
      
      // Build hierarchy
      return this.buildHierarchy(allTodos)
    } catch (error) {
      console.error('Error loading todos:', error)
      return []
    }
  }

  /**
   * Get immediate children of a todo
   */
  async getChildTodos(projectName: string, maverickPath: string, parentId: string): Promise<HierarchicalTodo[]> {
    const allTodos = await this.getAllTodosWithHierarchy(projectName, maverickPath)
    return this.findAllChildren(allTodos, parentId)
  }

  /**
   * Update a todo
   */
  async updateTodo(
    maverickPath: string,
    todoId: string,
    updates: Partial<HierarchicalTodo>
  ): Promise<HierarchicalTodo | null> {
    const todo = await this.getTodo('', maverickPath, todoId)
    if (!todo) return null
    
    const updatedTodo = {
      ...todo,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await this.saveTodoToFile(maverickPath, updatedTodo)
    return updatedTodo
  }

  /**
   * Delete a todo (and optionally its children)
   */
  async deleteTodo(
    projectName: string,
    maverickPath: string,
    todoId: string,
    deleteChildren = false
  ): Promise<boolean> {
    try {
      if (deleteChildren) {
        // Get all children and delete them first
        const children = await this.getChildTodos(projectName, maverickPath, todoId)
        for (const child of children) {
          await this.deleteTodo(projectName, maverickPath, child.id, true)
        }
      }
      
      // Delete the todo file
      const workItemsPath = path.join(maverickPath, 'work-items')
      const filePath = path.join(workItemsPath, `${todoId}.md`)
      await fs.unlink(filePath)
      
      return true
    } catch (error) {
      console.error(`Error deleting todo ${todoId}:`, error)
      return false
    }
  }

  /**
   * Move a todo to a different parent (or make it top-level)
   */
  async moveTodo(
    projectName: string,
    maverickPath: string,
    todoId: string,
    newParentId?: string,
    newOrderIndex?: number
  ): Promise<HierarchicalTodo | null> {
    const todo = await this.getTodo(projectName, maverickPath, todoId)
    if (!todo) return null
    
    let newDepth = 0
    
    if (newParentId) {
      const newParent = await this.getTodo(projectName, maverickPath, newParentId)
      if (newParent) {
        newDepth = newParent.depth + 1
      }
    }
    
    const updates: Partial<HierarchicalTodo> = {
      parentId: newParentId,
      depth: newDepth
    }
    
    if (newOrderIndex !== undefined) {
      updates.orderIndex = newOrderIndex
    }
    
    return await this.updateTodo(maverickPath, todoId, updates)
  }

  /**
   * Build hierarchy tree from flat array
   */
  private buildHierarchy(todos: HierarchicalTodo[]): HierarchicalTodo[] {
    const todoMap = new Map<string, HierarchicalTodo>()
    const rootTodos: HierarchicalTodo[] = []
    
    // Create map for quick lookup
    todos.forEach(todo => {
      todo.children = []
      todoMap.set(todo.id, todo)
    })
    
    // Build parent-child relationships
    todos.forEach(todo => {
      if (todo.parentId && todoMap.has(todo.parentId)) {
        const parent = todoMap.get(todo.parentId)!
        parent.children!.push(todo)
      } else {
        rootTodos.push(todo)
      }
    })
    
    // Sort by order index at each level
    const sortChildren = (items: HierarchicalTodo[]) => {
      items.sort((a, b) => a.orderIndex - b.orderIndex)
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortChildren(item.children)
        }
      })
    }
    
    sortChildren(rootTodos)
    
    return rootTodos
  }

  /**
   * Find all children recursively
   */
  private findAllChildren(todos: HierarchicalTodo[], parentId: string): HierarchicalTodo[] {
    const result: HierarchicalTodo[] = []
    
    const findChildren = (items: HierarchicalTodo[]) => {
      items.forEach(item => {
        if (item.parentId === parentId) {
          result.push(item)
        }
        if (item.children) {
          findChildren(item.children)
        }
      })
    }
    
    findChildren(todos)
    return result.sort((a, b) => a.orderIndex - b.orderIndex)
  }

  /**
   * Save todo to markdown file
   */
  private async saveTodoToFile(maverickPath: string, todo: HierarchicalTodo): Promise<void> {
    const workItemsPath = path.join(maverickPath, 'work-items')
    const filePath = path.join(workItemsPath, `${todo.id}.md`)
    
    // Ensure directory exists
    await fs.mkdir(workItemsPath, { recursive: true })
    
    const markdown = this.generateTodoMarkdown(todo)
    await fs.writeFile(filePath, markdown, 'utf-8')
  }

  /**
   * Generate markdown content for todo
   */
  private generateTodoMarkdown(todo: HierarchicalTodo): string {
    const dateFormatted = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    return `---
id: ${todo.id}
title: "${todo.title}"
type: ${todo.type}
status: ${todo.status}
priority: ${todo.priority}
functionalArea: ${todo.functionalArea}
parentId: ${todo.parentId || 'null'}
depth: ${todo.depth}
orderIndex: ${todo.orderIndex}
estimatedEffort: "${todo.estimatedEffort || ''}"
assignedTo: ${todo.assignedTo || 'null'}
dueDate: ${todo.dueDate || 'null'}
createdAt: ${todo.createdAt}
updatedAt: ${todo.updatedAt}
projectName: ${todo.projectName}
tags: [${todo.tags?.map(tag => `"${tag}"`).join(', ') || ''}]${todo.smartCategory ? `
smartCategory:
  id: ${todo.smartCategory.id}
  name: ${todo.smartCategory.name}
  team: ${todo.smartCategory.team}
  color: ${todo.smartCategory.color}
  categorizedAt: ${todo.smartCategory.categorizedAt}` : ''}
---

# ${todo.title}

## 📋 Description
${todo.description || 'No description provided.'}

${todo.depth > 0 ? `## 🔗 Parent Task
This is a subtask (depth: ${todo.depth})` : ''}

## 🏷️ Classification
- **Type:** ${todo.type}
- **Priority:** ${todo.priority}
- **Functional Area:** ${todo.functionalArea}
- **Estimated Effort:** ${todo.estimatedEffort || 'Not specified'}

${todo.assignedTo ? `## 👤 Assignment
- **Assigned to:** ${todo.assignedTo}` : ''}

${todo.dueDate ? `## 📅 Timeline
- **Due date:** ${todo.dueDate}` : ''}

${todo.tags && todo.tags.length > 0 ? `## 🏷️ Tags
${todo.tags.map(tag => `- ${tag}`).join('\n')}` : ''}

## 💬 Notes & Updates
_Add notes and updates here_

---

## Metadata
- **Created:** ${dateFormatted}
- **Last Updated:** ${dateFormatted}
- **Project:** ${todo.projectName}
- **Hierarchy Level:** ${todo.depth}
- **Generated by:** Maverick Hierarchical Todo System ✨

> _This ${todo.depth > 0 ? 'sub' : ''}task is part of the hierarchical todo system._
`
  }

  /**
   * Parse markdown to todo object
   */
  private parseMarkdownToTodo(content: string, filePath: string): HierarchicalTodo | null {
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
      let currentObject: any = frontmatter
      let currentKey: string | null = null
      
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        
        // Skip empty lines
        if (!trimmed) continue
        
        // Check if this is a nested property (starts with spaces)
        if (line.startsWith('  ') && currentKey) {
          // This is a nested property
          if (!currentObject[currentKey]) {
            currentObject[currentKey] = {}
          }
          const [key, ...valueParts] = trimmed.split(':')
          let value: any = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
          
          // Handle special values
          if (value === 'null') {
            value = undefined
          }
          
          currentObject[currentKey][key.trim()] = value
        } else if (trimmed.includes(':')) {
          // This is a top-level property
          const [key, ...valueParts] = trimmed.split(':')
          const keyName = key.trim()
          let value: any = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
          
          // Handle special values
          if (value === 'null') {
            value = undefined
          } else if (keyName === 'depth' || keyName === 'orderIndex') {
            value = parseInt(value) || 0
          } else if (keyName === 'tags') {
            value = value ? value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, '')) : []
          }
          
          // If value is empty, this might be a parent for nested properties
          if (!value) {
            currentKey = keyName
            currentObject = frontmatter
          } else {
            frontmatter[keyName] = value
            currentKey = null
          }
        }
      }
      
      // Get description content
      const descriptionStart = lines.findIndex(line => line.trim() === '## 📋 Description')
      let description = ''
      
      if (descriptionStart > -1) {
        const nextSectionStart = lines.findIndex((line, index) => 
          index > descriptionStart + 1 && line.startsWith('## ')
        )
        const endIndex = nextSectionStart > -1 ? nextSectionStart : lines.length
        
        description = lines.slice(descriptionStart + 1, endIndex)
          .join('\n')
          .trim()
      }
      
      return {
        id: frontmatter.id,
        title: frontmatter.title,
        description,
        type: frontmatter.type || 'TASK',
        status: frontmatter.status || 'PLANNED',
        priority: frontmatter.priority || 'MEDIUM',
        functionalArea: frontmatter.functionalArea || 'SOFTWARE',
        parentId: frontmatter.parentId,
        depth: frontmatter.depth || 0,
        orderIndex: frontmatter.orderIndex || 0,
        estimatedEffort: frontmatter.estimatedEffort,
        assignedTo: frontmatter.assignedTo,
        dueDate: frontmatter.dueDate,
        tags: frontmatter.tags || [],
        createdAt: frontmatter.createdAt,
        updatedAt: frontmatter.updatedAt,
        projectName: frontmatter.projectName,
        smartCategory: frontmatter.smartCategory,
        filename: path.basename(filePath),
        filePath
      }
    } catch (error) {
      console.error('Error parsing todo markdown:', error)
      return null
    }
  }
}

export const hierarchicalTodoService = HierarchicalTodoService.getInstance()