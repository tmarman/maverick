'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus,
  Zap,
  Bug,
  CheckCircle,
  Clock,
  PlayCircle,
  GitBranch,
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
  History,
  Database,
  Users,
  MessageSquare,
  Code
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { v4 as uuidv4 } from 'uuid'
import { WorkItemDetailSidebar } from '@/components/WorkItemDetailSidebar'
import { WorkItemDetailView } from '@/components/WorkItemDetailView'
import { SubtaskDetailView } from '@/components/SubtaskDetailView'
import { TaskDetailsSidebar } from '@/components/TaskDetailsSidebar'
import { TaskFullDetailView } from '@/components/TaskFullDetailView'
import { ContextualAIChat } from '@/components/ContextualAIChat'
import { HierarchicalTodo, hierarchicalTodoClientService } from '@/lib/hierarchical-todos-client'
import SmartTaskCategorizationPreview from '@/components/SmartTaskCategorizationPreview'
import { CategoryWorktreeView } from '@/components/CategoryWorktreeView'
import { CategoryManager } from '@/components/CategoryManager'
import TaskTreeItem from '@/components/TaskTreeItem'

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PENDING' | 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'BLOCKED' | 'DEFERRED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING'
  parentId?: string
  orderIndex: number
  depth: number
  worktreeName?: string
  worktreePath?: string
  worktreeStatus?: 'PENDING' | 'ACTIVE' | 'STALE' | 'MERGED' | 'REMOVED'
  githubBranch?: string
  estimatedEffort?: string
  assignedToId?: string
  createdAt: string
  updatedAt: string
  children?: WorkItem[]
  markdownContent?: string
  projectName?: string
  smartCategory?: {
    id: string
    name: string
    team: string
    color: string
    categorizedAt: string
  }
}

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
  submodulePath?: string
  defaultBranch?: string
}

interface SimpleWorkItemCanvasProps {
  project: Project
  className?: string
}

export function SimpleWorkItemCanvas({ project, className }: SimpleWorkItemCanvasProps) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemText, setNewItemText] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'board' | 'detail' | 'subtask' | 'task-full-detail'>('board')
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null)
  const [parentWorkItem, setParentWorkItem] = useState<WorkItem | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedHierarchicalTodo, setSelectedHierarchicalTodo] = useState<HierarchicalTodo | null>(null)
  const [hierarchicalSidebarOpen, setHierarchicalSidebarOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState<WorkItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [adviceChatOpen, setAdviceChatOpen] = useState(false)
  const [planningTaskId, setPlanningTaskId] = useState<string | null>(null)
  const [generatingHistory, setGeneratingHistory] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set())
  const [migratingUuids, setMigratingUuids] = useState(false)
  const [groupByCategory, setGroupByCategory] = useState(false)
  const [projectCategories, setProjectCategories] = useState<Array<{
    id: string
    name: string
    color: string
    description: string
    keywords: string[]
    examples: string[]
  }>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [selectedCategoryWorktree, setSelectedCategoryWorktree] = useState<{
    id: string
    name: string
    color: string
    items: WorkItem[]
  } | null>(null)
  
  // Auto-categorization progress state
  const [categorizationInProgress, setCategorizationInProgress] = useState(false)
  const [categorizationProgress, setCategorizationProgress] = useState({
    current: 0,
    total: 0,
    currentItem: '',
    currentCategory: ''
  })
  
  // Task organization state
  const [organizationSuggestion, setOrganizationSuggestion] = useState<{
    originalTask: WorkItem
    suggestion: any
    analysis: any
  } | null>(null)

  useEffect(() => {
    loadWorkItems()
    loadCategories()
  }, [project.name])

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await fetch(`/api/projects/${project.name}/categories`)
      if (response.ok) {
        const data = await response.json()
        setProjectCategories(data.categories || [])
      } else {
        console.error('Failed to load categories')
        // Use default fallback categories
        setProjectCategories([
          { id: 'general', name: 'General', color: '#6B7280', description: 'General work items', keywords: [], examples: [] }
        ])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Enhanced loadCategories with categorization progress callbacks
  const loadCategoriesWithCallbacks = Object.assign(loadCategories, {
    onCategorizationStart: (total: number) => {
      setCategorizationInProgress(true)
      setCategorizationProgress({
        current: 0,
        total,
        currentItem: '',
        currentCategory: ''
      })
      toast({
        title: 'Auto-categorization started',
        description: `Processing ${total} work items...`
      })
    },
    
    onCategorizationProgress: (current: number, total: number, itemTitle: string, categoryName: string) => {
      setCategorizationProgress({
        current,
        total,
        currentItem: itemTitle,
        currentCategory: categoryName
      })
      // Reload work items to show the visual changes
      loadWorkItems()
    },
    
    onCategorizationComplete: (categorizedCount: number, totalCount: number) => {
      setCategorizationInProgress(false)
      setCategorizationProgress({ current: 0, total: 0, currentItem: '', currentCategory: '' })
      loadWorkItems() // Final reload
      toast({
        title: '🎉 Categorization complete!',
        description: `Successfully categorized ${categorizedCount} out of ${totalCount} work items`
      })
    },
    
    onCategorizationError: (errorMessage: string) => {
      setCategorizationInProgress(false)
      setCategorizationProgress({ current: 0, total: 0, currentItem: '', currentCategory: '' })
      toast({
        title: 'Categorization failed',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  })

  // Handle escape key to close views
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewMode === 'subtask') {
          handleBackToWorkItem()
        } else if (viewMode === 'detail') {
          handleBackToBoard()
        } else if (viewMode === 'task-full-detail') {
          setViewMode('board')
          setSelectedHierarchicalTodo(null)
        } else if (hierarchicalSidebarOpen) {
          setHierarchicalSidebarOpen(false)
          setSelectedHierarchicalTodo(null)
        } else if (sidebarOpen) {
          setSidebarOpen(false)
          setSelectedWorkItem(null)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, sidebarOpen, hierarchicalSidebarOpen])

  // Helper function to convert WorkItem to HierarchicalTodo
  const workItemToHierarchicalTodo = (workItem: WorkItem): HierarchicalTodo => {
    return {
      id: workItem.id,
      title: workItem.title,
      description: workItem.description,
      type: workItem.type as HierarchicalTodo['type'],
      status: (workItem.status === 'PENDING' ? 'PENDING' : 
               workItem.status === 'PLANNED' ? 'PLANNED' :
               workItem.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
               workItem.status === 'IN_REVIEW' ? 'IN_REVIEW' :
               workItem.status === 'DONE' ? 'DONE' :
               workItem.status === 'DEFERRED' ? 'DEFERRED' : 'PLANNED') as HierarchicalTodo['status'],
      priority: workItem.priority as HierarchicalTodo['priority'],
      functionalArea: workItem.functionalArea as HierarchicalTodo['functionalArea'],
      parentId: workItem.parentId,
      depth: workItem.depth,
      orderIndex: workItem.orderIndex,
      estimatedEffort: workItem.estimatedEffort as HierarchicalTodo['estimatedEffort'],
      assignedTo: workItem.assignedToId,
      createdAt: workItem.createdAt,
      updatedAt: workItem.updatedAt,
      projectName: workItem.projectName || project.name,
      smartCategory: workItem.smartCategory
    }
  }

  // Helper function to convert HierarchicalTodo back to WorkItem
  const hierarchicalTodoToWorkItem = (todo: HierarchicalTodo): WorkItem => {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      type: todo.type as WorkItem['type'],
      status: (todo.status === 'PENDING' ? 'PENDING' :
               todo.status === 'PLANNED' ? 'PLANNED' :
               todo.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
               todo.status === 'IN_REVIEW' ? 'IN_REVIEW' :
               todo.status === 'DONE' ? 'DONE' :
               todo.status === 'DEFERRED' ? 'DEFERRED' : 'PLANNED') as WorkItem['status'],
      priority: todo.priority as WorkItem['priority'],
      functionalArea: todo.functionalArea as WorkItem['functionalArea'],
      parentId: todo.parentId,
      orderIndex: todo.orderIndex,
      depth: todo.depth,
      estimatedEffort: todo.estimatedEffort,
      assignedToId: todo.assignedTo,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
      projectName: todo.projectName,
      smartCategory: todo.smartCategory
    }
  }

  const loadWorkItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.name}/work-items`)
      
      if (response.ok) {
        const data = await response.json()
        const workItems = data.workItems || []
        
        // Sort work items to prioritize those with active worktrees
        const sortedWorkItems = workItems.sort((a: WorkItem, b: WorkItem) => {
          // First, prioritize by active worktree status
          const aHasActiveWorktree = a.worktreeStatus === 'ACTIVE' ? 1 : 0
          const bHasActiveWorktree = b.worktreeStatus === 'ACTIVE' ? 1 : 0
          
          if (aHasActiveWorktree !== bHasActiveWorktree) {
            return bHasActiveWorktree - aHasActiveWorktree // Active worktrees first
          }
          
          // If both have same worktree status, prioritize by task status
          const statusPriority = {
            'IN_PROGRESS': 5,
            'IN_REVIEW': 4,
            'PLANNED': 3,
            'PENDING': 2,
            'TESTING': 2,
            'BLOCKED': 1,
            'DONE': 0,
            'CANCELLED': -1,
            'DEFERRED': -2
          }
          
          const aStatusPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 0
          const bStatusPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 0
          
          if (aStatusPriority !== bStatusPriority) {
            return bStatusPriority - aStatusPriority
          }
          
          // Finally, maintain original order for items with same priority
          return a.orderIndex - b.orderIndex
        })
        
        setWorkItems(sortedWorkItems)
      } else {
        console.error('Failed to load work items')
        setWorkItems([])
      }
    } catch (error) {
      console.error('Error loading work items:', error)
      setWorkItems([])
    } finally {
      setLoading(false)
    }
  }

  const createWorkItem = async () => {
    if (!newItemText.trim()) return

    try {
      setCreating(true)
      
      // Let AI analyze the text and determine the appropriate work item structure
      const response = await fetch(`/api/projects/${project.name}/work-items/smart-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newItemText.trim(),
          autoStructure: true // Tell the API to use AI to structure this
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Work item created',
          description: data.message || `Created: ${data.workItem.title}`
        })
        
        setNewItemText('')
        await loadWorkItems()
      } else {
        const error = await response.json()
        toast({
          title: 'Failed to create work item',
          description: error.message || 'An error occurred',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating work item:', error)
      toast({
        title: 'Creation failed',
        description: 'Failed to create work item',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const getTypeIcon = (type: WorkItem['type']) => {
    switch (type) {
      case 'FEATURE':
        return <Zap className="w-4 h-4 text-blue-600" />
      case 'BUG':
        return <Bug className="w-4 h-4 text-red-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: WorkItem['status']) => {
    switch (status) {
      case 'PLANNED':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4 text-blue-500" />
      case 'DONE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'DEFERRED':
        return <ArrowRight className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: WorkItem['status']) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-background-tertiary text-text-muted'
      case 'IN_PROGRESS':
        return 'bg-background-tertiary text-text-primary'
      case 'DONE':
        return 'bg-background-secondary text-text-primary'
      case 'DEFERRED':
        return 'bg-orange-50 text-orange-700'
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-background-tertiary text-text-muted'
    }
  }

  // Filter to only show top-level tasks (no valid parentId) and sort by orderIndex
  const topLevelTasks = workItems
    .filter(item => {
      const hasParent = item.parentId && item.parentId !== 'null' && item.parentId !== 'undefined' && item.parentId.trim() !== ''
      return !hasParent
    })
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))

  // Group work items by status for list view
  const statusGroups = [
    {
      title: '🤖 AI Enhancing',
      key: 'enhancing',
      items: topLevelTasks.filter(item => item.status === 'PENDING'),
      color: 'blue'
    },
    {
      title: '📋 To Do',
      key: 'planned',
      items: topLevelTasks.filter(item => item.status === 'PLANNED'),
      color: 'gray'
    },
    {
      title: '🚀 In Progress',
      key: 'progress',
      items: topLevelTasks.filter(item => item.status === 'IN_PROGRESS'),
      color: 'orange'
    },
    {
      title: '👀 In Review',
      key: 'review',
      items: topLevelTasks.filter(item => item.status === 'IN_REVIEW' || item.status === 'TESTING'),
      color: 'purple'
    },
    {
      title: '✅ Completed',
      key: 'done',
      items: topLevelTasks.filter(item => item.status === 'DONE'),
      color: 'green'
    },
    {
      title: '⏸️ Deferred',
      key: 'deferred',
      items: topLevelTasks.filter(item => item.status === 'DEFERRED'),
      color: 'yellow'
    }
  ].filter(group => group.items.length > 0) // Only show groups with items

  // Group tasks by categories
  const categoryGroups = React.useMemo(() => {
    console.log('🏗️ SimpleWorkItemCanvas: Building category groups...')
    console.log(`📊 Total workItems: ${workItems.length}`)
    console.log(`📊 Total topLevelTasks: ${topLevelTasks.length}`)
    console.log('📝 Top level tasks:', topLevelTasks.map(item => ({
      id: item.id.substring(0, 8),
      title: item.title,
      type: item.type,
      hasParent: !!item.parentId,
      smartCategory: item.smartCategory?.name || 'None'
    })))
    
    if (categoriesLoading || projectCategories.length === 0) {
      console.log('⏳ Categories still loading or no categories available')
      return []
    }
    
    const categories = new Map<string, {
      id: string
      name: string
      color: string
      items: WorkItem[]
      suggestedItems?: Array<{ 
        id: string
        title: string
        description: string
        priority: 'LOW' | 'MEDIUM' | 'HIGH'
        type: 'TASK' | 'FEATURE'
        isSuggested: boolean
      }>
    }>()
    
    // Don't pre-initialize categories - only create them when they have items
    
    topLevelTasks.forEach(item => {
      const categoryName = item.smartCategory?.name || 'Uncategorized'
      console.log(`🔄 Processing top-level task: "${item.title}" → Category: "${categoryName}"`)
      
      if (!categories.has(categoryName)) {
        // Find the category definition from projectCategories
        const categoryDef = projectCategories.find(c => c.name === categoryName)
        console.log(`📂 Category definition for "${categoryName}":`, categoryDef ? { id: categoryDef.id, name: categoryDef.name } : 'Not found')
        
        categories.set(categoryName, {
          id: categoryDef?.id || 'uncategorized',
          name: categoryName,
          color: categoryDef?.color || item.smartCategory?.color || '#6B7280',
          items: []
        })
      }
      categories.get(categoryName)!.items.push(item)
    })
    
    // Add suggested work for sparse categories based on category ID
    const suggestedWork: Record<string, Array<{
      id: string
      title: string
      description: string
      priority: 'HIGH' | 'MEDIUM' | 'LOW'
      type: 'TASK' | 'FEATURE'
      isSuggested: boolean
    }>> = {
      'api-services': [
        { id: 'suggested-api-1', title: 'API Rate Limiting & Throttling', description: 'Implement rate limiting for all API endpoints to prevent abuse', priority: 'HIGH', type: 'FEATURE', isSuggested: true },
        { id: 'suggested-api-2', title: 'API Documentation Generation', description: 'Auto-generate API docs with OpenAPI/Swagger', priority: 'MEDIUM', type: 'FEATURE', isSuggested: true },
        { id: 'suggested-api-3', title: 'API Versioning Strategy', description: 'Implement versioning for backward compatibility', priority: 'MEDIUM', type: 'TASK', isSuggested: true },
      ],
      'data-analytics': [
        { id: 'suggested-data-1', title: 'Analytics Dashboard', description: 'Create comprehensive analytics dashboard for business metrics', priority: 'HIGH', type: 'FEATURE', isSuggested: true },
        { id: 'suggested-data-2', title: 'Data Pipeline Monitoring', description: 'Add monitoring and alerting for data processing pipelines', priority: 'MEDIUM', type: 'TASK', isSuggested: true },
        { id: 'suggested-data-3', title: 'Database Optimization', description: 'Optimize slow queries and add proper indexing', priority: 'MEDIUM', type: 'TASK', isSuggested: true },
      ],
      'infrastructure-devops': [
        { id: 'suggested-devops-1', title: 'Container Health Monitoring', description: 'Implement comprehensive monitoring for container health and performance', priority: 'HIGH', type: 'TASK', isSuggested: true },
        { id: 'suggested-devops-2', title: 'Automated Backup Strategy', description: 'Set up automated database and file backups with restore testing', priority: 'HIGH', type: 'TASK', isSuggested: true },
        { id: 'suggested-devops-3', title: 'Blue-Green Deployment Pipeline', description: 'Implement zero-downtime deployments with blue-green strategy', priority: 'MEDIUM', type: 'FEATURE', isSuggested: true },
      ],
      'content-marketing': [
        { id: 'suggested-marketing-1', title: 'Landing Page Optimization', description: 'A/B test and optimize landing page conversion rates', priority: 'HIGH', type: 'TASK', isSuggested: true },
        { id: 'suggested-marketing-2', title: 'User Onboarding Email Series', description: 'Create automated email sequence for new user engagement', priority: 'MEDIUM', type: 'FEATURE', isSuggested: true },
        { id: 'suggested-marketing-3', title: 'SEO Content Strategy', description: 'Develop content strategy and blog posts for organic traffic', priority: 'MEDIUM', type: 'TASK', isSuggested: true },
      ],
      'testing-quality': [
        { id: 'suggested-qa-1', title: 'End-to-End Test Suite', description: 'Comprehensive E2E tests covering critical user journeys', priority: 'HIGH', type: 'TASK', isSuggested: true },
        { id: 'suggested-qa-2', title: 'Performance Testing Framework', description: 'Set up automated performance testing and monitoring', priority: 'HIGH', type: 'FEATURE', isSuggested: true },
        { id: 'suggested-qa-3', title: 'Accessibility Audit & Testing', description: 'Comprehensive accessibility testing and WCAG compliance', priority: 'MEDIUM', type: 'TASK', isSuggested: true },
      ],
      'ui-ux': [
        { id: 'suggested-ui-1', title: 'Design System Components', description: 'Create reusable component library with consistent styling', priority: 'HIGH', type: 'FEATURE', isSuggested: true },
        { id: 'suggested-ui-2', title: 'Mobile Responsive Design', description: 'Ensure all interfaces work well on mobile devices', priority: 'HIGH', type: 'TASK', isSuggested: true },
        { id: 'suggested-ui-3', title: 'User Flow Optimization', description: 'Analyze and improve key user journeys', priority: 'MEDIUM', type: 'TASK', isSuggested: true },
      ]
    }
    
    // Add suggested items to categories with fewer than 5 tasks
    categories.forEach((category, categoryName) => {
      if (category.items.length < 5 && suggestedWork[category.id]) {
        category.suggestedItems = suggestedWork[category.id]
      }
    })
    
    // Sort categories by project category order
    const categoryOrder = projectCategories.map(c => c.name)
    const sortedCategories = Array.from(categories.entries()).sort(([a], [b]) => {
      const aIndex = categoryOrder.indexOf(a)
      const bIndex = categoryOrder.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
    
    // Only return categories that have items
    return sortedCategories
      .map(([categoryName, group]) => group)
      .filter(group => group.items.length > 0)
  }, [topLevelTasks, projectCategories, categoriesLoading])
  
  const toggleSection = (teamName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(teamName)) {
        newSet.delete(teamName)
      } else {
        newSet.add(teamName)
      }
      return newSet
    })
  }

  const toggleTaskExpansion = (taskId: string) => {
    setCollapsedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      createWorkItem()
    }
  }

  const handleWorkItemClick = (workItem: WorkItem) => {
    // Use hierarchical sidebar for better subtask management
    const hierarchicalTodo = workItemToHierarchicalTodo(workItem)
    setSelectedHierarchicalTodo(hierarchicalTodo)
    setHierarchicalSidebarOpen(true)
    
    // Close other sidebars
    setSidebarOpen(false)
    setSelectedWorkItem(null)
  }

  const handleViewFullPlan = (workItem: WorkItem) => {
    setSelectedWorkItem(workItem)
    setViewMode('detail')
    setSidebarOpen(false)
  }

  const handleBackToBoard = () => {
    setViewMode('board')
    setSelectedWorkItem(null)
    setSelectedSubtask(null)
    setParentWorkItem(null)
    setSidebarOpen(false)
  }

  const handleViewSubtask = (subtask: any, workItem: WorkItem) => {
    setSelectedSubtask(subtask)
    setParentWorkItem(workItem)
    setViewMode('subtask')
  }

  const handleBackToWorkItem = () => {
    setViewMode('detail')
    setSelectedSubtask(null)
    setParentWorkItem(null)
  }

  const handleWorkItemUpdate = (updatedWorkItem: WorkItem) => {
    setWorkItems(prev => 
      prev.map(item => 
        item.id === updatedWorkItem.id ? updatedWorkItem : item
      )
    )
  }

  const handleHierarchicalTodoUpdate = (updatedTodo: HierarchicalTodo) => {
    // Convert back to WorkItem and update the list
    const updatedWorkItem = hierarchicalTodoToWorkItem(updatedTodo)
    handleWorkItemUpdate(updatedWorkItem)
    
    // Update the selected todo as well
    setSelectedHierarchicalTodo(updatedTodo)
  }

  const handleHierarchicalTodoClose = () => {
    setHierarchicalSidebarOpen(false)
    setSelectedHierarchicalTodo(null)
  }

  const handleNavigateToTask = async (taskId: string) => {
    try {
      // Find the task in the current workItems list first
      let targetTask = workItems.find(item => item.id === taskId)
      
      if (!targetTask) {
        // If not found, fetch it from hierarchical todos
        const hierarchicalTodo = await hierarchicalTodoClientService.getTodo(project.name.toLowerCase(), taskId)
        if (hierarchicalTodo) {
          targetTask = hierarchicalTodoToWorkItem(hierarchicalTodo)
        }
      }
      
      if (targetTask) {
        const hierarchicalTodo = workItemToHierarchicalTodo(targetTask)
        setSelectedHierarchicalTodo(hierarchicalTodo)
        // Keep sidebar open for navigation flow
      }
    } catch (error) {
      console.error('Failed to navigate to task:', error)
      toast({
        title: 'Navigation failed',
        description: 'Could not load the selected task',
        variant: 'destructive'
      })
    }
  }

  const handleStartWorking = async (item: WorkItem) => {
    try {
      toast({
        title: 'Starting work...',
        description: `Analyzing "${item.title}" and setting up development environment`,
      })

      // Step 1: Check if we should create a new worktree or add to existing one
      const worktreeDecision = await analyzeWorktreeNeeds(item)
      
      if (worktreeDecision.action === 'CREATE_NEW') {
        // Create a new worktree for this work
        const { activeWorktreeManager } = await import('@/lib/active-worktree-manager')
        
        const worktree = await activeWorktreeManager.createWorktree(project.name.toLowerCase(), {
          displayName: worktreeDecision.suggestedName,
          description: worktreeDecision.description,
          category: item.smartCategory ? {
            id: item.smartCategory.id,
            name: item.smartCategory.name,
            color: item.smartCategory.color
          } : undefined,
          initialWorkItems: [item.id]
        })
        
        toast({
          title: 'Worktree created',
          description: `Created "${worktree.displayName}" with initial task`,
        })
        
        // Update the work item status
        const updatedItem = { ...item, status: 'IN_PROGRESS' as const, worktreeStatus: 'ACTIVE' as const }
        handleWorkItemUpdate(updatedItem)
        
      } else if (worktreeDecision.action === 'ADD_TO_EXISTING') {
        // Add to existing worktree
        const { activeWorktreeManager } = await import('@/lib/active-worktree-manager')
        
        await activeWorktreeManager.addWorkItemToWorktree(
          project.name.toLowerCase(),
          worktreeDecision.existingWorktreeId!,
          item.id
        )
        
        toast({
          title: 'Added to worktree',
          description: `Added "${item.title}" to existing worktree`,
        })
        
        const updatedItem = { ...item, status: 'IN_PROGRESS' as const, worktreeStatus: 'ACTIVE' as const }
        handleWorkItemUpdate(updatedItem)
        
      } else {
        // AUTO_ORGANIZE - task is complex, needs to be broken down
        toast({
          title: 'Analyzing task complexity...',
          description: 'This task appears complex. Generating organization suggestions.',
        })
        
        await handleAutoOrganizeTask(item)
        return
      }
      
      // Open worktree details to show progress
      // TODO: Navigate to worktree view instead of task details
      const hierarchicalTodo = workItemToHierarchicalTodo(item)
      setSelectedHierarchicalTodo(hierarchicalTodo)
      setHierarchicalSidebarOpen(true)
      
    } catch (error) {
      console.error('Failed to start working:', error)
      toast({
        title: 'Failed to start work',
        description: error instanceof Error ? error.message : 'Could not set up the development environment',
        variant: 'destructive'
      })
    }
  }

  const analyzeWorktreeNeeds = async (item: WorkItem): Promise<{
    action: 'CREATE_NEW' | 'ADD_TO_EXISTING' | 'AUTO_ORGANIZE'
    suggestedName?: string
    description?: string
    existingWorktreeId?: string
    reasoning: string
  }> => {
    // Simple heuristics for now - can be enhanced with AI later
    
    // Check if there are existing active worktrees in the same category
    const activeWorktrees = await getActiveWorktreesForCategory(item.smartCategory?.id)
    
    // If task is an EPIC or very large, suggest organization first
    if (item.type === 'EPIC' || (item.description && item.description.length > 500)) {
      return {
        action: 'AUTO_ORGANIZE',
        reasoning: 'Task appears to be large or complex and should be broken down into smaller tasks first'
      }
    }
    
    // If there's an active worktree in the same category with space, suggest adding to it
    if (activeWorktrees.length > 0) {
      const suitableWorktree = activeWorktrees.find(wt => 
        wt.workItems.length < 5 && // Not too crowded
        wt.status === 'ACTIVE' && 
        !wt.progress.readyForReview // Not ready for review yet
      )
      
      if (suitableWorktree) {
        return {
          action: 'ADD_TO_EXISTING',
          existingWorktreeId: suitableWorktree.id,
          reasoning: `Found suitable active worktree "${suitableWorktree.displayName}" in same category`
        }
      }
    }
    
    // Default: create new worktree
    const suggestedName = generateWorktreeName(item)
    return {
      action: 'CREATE_NEW',
      suggestedName,
      description: `Development worktree for ${item.title}`,
      reasoning: 'No suitable existing worktree found, creating new one'
    }
  }

  const generateWorktreeName = (item: WorkItem): string => {
    // Generate a human-readable name from the work item
    const cleanTitle = item.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30)
    
    const typePrefix = item.type.toLowerCase()
    const categoryPrefix = item.smartCategory?.name.toLowerCase().replace(/\s+/g, '-') || 'general'
    
    return `${categoryPrefix}-${typePrefix}-${cleanTitle}`
  }

  const getActiveWorktreesForCategory = async (categoryId?: string): Promise<any[]> => {
    // TODO: Implement actual worktree loading
    // For now, return empty array
    return []
  }

  const handleAutoOrganizeTask = async (item: WorkItem) => {
    try {
      const { taskAutoOrganizer } = await import('@/lib/task-auto-organizer')
      
      // Analyze this specific task
      const organizationResult = await taskAutoOrganizer.analyzeAndSuggestOrganization(
        project.name.toLowerCase(),
        [item]
      )
      
      const suggestions = organizationResult.suggestions
      const analysis = organizationResult.analysis[0]
      
      if (suggestions.length === 0) {
        toast({
          title: 'Task is ready to work on',
          description: 'No organization needed. You can start working on this task.',
        })
        
        // Proceed with normal start working flow
        const hierarchicalTodo = workItemToHierarchicalTodo(item)
        setSelectedHierarchicalTodo(hierarchicalTodo)
        setHierarchicalSidebarOpen(true)
        return
      }
      
      // Show organization suggestions
      const primarySuggestion = suggestions[0]
      
      if (primarySuggestion.type === 'SPLIT_TASK' && primarySuggestion.suggestedSubtasks) {
        toast({
          title: `Task complexity: ${analysis?.analysis.complexity}`,
          description: `Suggested to split into ${primarySuggestion.suggestedSubtasks.length} subtasks. Opening organization view.`,
        })
        
        // Store the organization suggestion for use in the sidebar
        setOrganizationSuggestion({
          originalTask: item,
          suggestion: primarySuggestion,
          analysis
        })
        
        // Open the task details with organization mode
        const hierarchicalTodo = workItemToHierarchicalTodo(item)
        setSelectedHierarchicalTodo(hierarchicalTodo)
        setHierarchicalSidebarOpen(true)
        
      } else if (primarySuggestion.type === 'CREATE_SUBTASKS' && primarySuggestion.subtasks) {
        // Auto-create subtasks
        const subtasks = primarySuggestion.subtasks
        
        toast({
          title: 'Creating subtasks...',
          description: `Creating ${subtasks.length} subtasks for better organization`,
        })
        
        // Create the subtasks
        for (const subtask of subtasks) {
          await createSubtask(item.id, subtask)
        }
        
        toast({
          title: 'Subtasks created',
          description: `Created ${subtasks.length} subtasks. Task is now organized and ready for work.`,
        })
        
        // Reload work items to show the new structure
        await loadWorkItems()
        
      } else {
        // Default: show in organization mode
        const hierarchicalTodo = workItemToHierarchicalTodo(item)
        setSelectedHierarchicalTodo(hierarchicalTodo)
        setHierarchicalSidebarOpen(true)
      }
      
    } catch (error) {
      console.error('Failed to auto-organize task:', error)
      toast({
        title: 'Organization analysis failed',
        description: 'Could not analyze task complexity. Opening task details.',
        variant: 'destructive'
      })
      
      // Fall back to normal task view
      const hierarchicalTodo = workItemToHierarchicalTodo(item)
      setSelectedHierarchicalTodo(hierarchicalTodo)
      setHierarchicalSidebarOpen(true)
    }
  }

  const createSubtask = async (parentId: string, subtaskData: any) => {
    try {
      const response = await fetch(`/api/projects/${project.name}/work-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subtaskData.title,
          description: subtaskData.description,
          type: 'SUBTASK',
          status: 'PLANNED',
          priority: subtaskData.priority,
          functionalArea: 'SOFTWARE',
          parentId: parentId,
          estimatedEffort: subtaskData.estimatedEffort
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create subtask')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to create subtask:', error)
      throw error
    }
  }

  const handleCheckProgress = async (item: WorkItem) => {
    try {
      // Navigate to worktree details to check progress
      // This will show:
      // 1. Active worktree status
      // 2. Current branch and commits
      // 3. Files modified
      // 4. Test status
      
      toast({
        title: 'Checking progress...',
        description: `Loading worktree details for "${item.title}"`,
      })

      // TODO: Navigate to worktree details view
      // For now, open task details
      const hierarchicalTodo = workItemToHierarchicalTodo(item)
      setSelectedHierarchicalTodo(hierarchicalTodo)
      setHierarchicalSidebarOpen(true)
      
    } catch (error) {
      console.error('Failed to check progress:', error)
      toast({
        title: 'Failed to check progress',
        description: 'Could not load worktree details',
        variant: 'destructive'
      })
    }
  }

  const handleCheckStatus = async (item: WorkItem) => {
    try {
      // Check if the task is actually complete
      // This involves AI analysis of:
      // 1. Code changes made
      // 2. Tests passing
      // 3. Deployment status
      // 4. User feedback/validation
      
      toast({
        title: 'Checking completion status...',
        description: `Validating completion of "${item.title}"`,
      })

      // TODO: Implement AI-powered completion validation
      // For now, show a completion validation dialog
      const isComplete = await validateTaskCompletion(item)
      
      if (isComplete) {
        toast({
          title: 'Task verified complete',
          description: `"${item.title}" has been successfully completed`,
        })
      } else {
        toast({
          title: 'Task needs attention',
          description: `"${item.title}" may not be fully complete`,
          variant: 'destructive'
        })
      }
      
    } catch (error) {
      console.error('Failed to check status:', error)
      toast({
        title: 'Failed to check status',
        description: 'Could not validate task completion',
        variant: 'destructive'
      })
    }
  }

  const validateTaskCompletion = async (item: WorkItem): Promise<boolean> => {
    // TODO: Implement AI-powered validation
    // This could involve:
    // 1. Analyzing git commits
    // 2. Running tests
    // 3. Checking deployment status
    // 4. Validating against acceptance criteria
    
    // For now, return a simple heuristic
    return item.status === 'DONE' && item.worktreeStatus !== 'ACTIVE'
  }

  const handleSubtaskCreate = (subtask: HierarchicalTodo) => {
    // When a subtask is created, reload the work items to include it
    loadWorkItems()
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: WorkItem, index: number) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    
    // Add some visual feedback
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire row, not just moving between child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (!draggedItem) return
    
    const sourceIndex = topLevelTasks.findIndex(item => item.id === draggedItem.id)
    if (sourceIndex === -1 || sourceIndex === targetIndex) return

    try {
      // Reorder the items locally first for immediate feedback
      const newItems = [...topLevelTasks]
      const [movedItem] = newItems.splice(sourceIndex, 1)
      newItems.splice(targetIndex, 0, movedItem)
      
      // Update order indices
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        orderIndex: index
      }))
      
      // Update local state immediately
      setWorkItems(prev => {
        const nonTopLevel = prev.filter(item => {
          const hasParent = item.parentId && item.parentId !== 'null' && item.parentId !== 'undefined' && item.parentId.trim() !== ''
          return hasParent
        })
        return [...updatedItems, ...nonTopLevel]
      })

      // Update the server
      await updateTaskOrder(draggedItem.id, targetIndex)
      
      toast({
        title: 'Task reordered',
        description: `Moved "${draggedItem.title}" to position ${targetIndex + 1}`
      })
      
    } catch (error) {
      console.error('Failed to reorder task:', error)
      // Reload to revert on error
      loadWorkItems()
      toast({
        title: 'Reorder failed',
        description: 'Could not save new task order',
        variant: 'destructive'
      })
    }
    
    setDraggedItem(null)
  }

  const updateTaskOrder = async (taskId: string, newIndex: number) => {
    const response = await fetch(`/api/projects/${project.name}/work-items/${taskId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIndex: newIndex })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update task order')
    }
  }

  const handleViewFullDetails = (todo: HierarchicalTodo) => {
    setSelectedHierarchicalTodo(todo)
    setViewMode('task-full-detail')
    setHierarchicalSidebarOpen(false)
  }

  const handleGetAdvice = () => {
    setAdviceChatOpen(true)
    setPlanningTaskId(null)
  }

  const handlePlanFeature = (taskId: string) => {
    setPlanningTaskId(taskId)
    setAdviceChatOpen(true)
  }

  const handleCloseAdviceChat = () => {
    setAdviceChatOpen(false)
    setPlanningTaskId(null)
  }

  const handleGenerateDevHistory = async () => {
    setGeneratingHistory(true)
    
    const devHistoryItemsBase = [
      {
        title: "Fixed projects API and GitHub token handling",
        description: "Enhanced error handling in projects API route for better resilience with GitHub service integration",
        type: 'FEATURE',
        status: 'DONE',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        estimatedEffort: '2-3 hours'
      },
      {
        title: "Simplified project navigation to 4 core pages", 
        description: "Streamlined ProjectTreeSidebar navigation to focus on essential project management features",
        type: 'FEATURE',
        status: 'DONE', 
        priority: 'MEDIUM',
        functionalArea: 'SOFTWARE',
        estimatedEffort: '1-2 hours'
      },
      {
        title: "Redesigned chat interface with sliding bottom-to-top UX",
        description: "Enhanced user experience with modern sliding chat interface and improved accessibility", 
        type: 'FEATURE',
        status: 'DONE',
        priority: 'MEDIUM', 
        functionalArea: 'SOFTWARE',
        estimatedEffort: '3-4 hours'
      },
      {
        title: "Project routing now uses names instead of IDs",
        description: "Improved URL structure by implementing name-based routing for better user experience and SEO",
        type: 'FEATURE',
        status: 'DONE',
        priority: 'MEDIUM',
        functionalArea: 'SOFTWARE', 
        estimatedEffort: '2-3 hours'
      },
      {
        title: "Built combined Team page with people + AI agents",
        description: "Enhanced team management interface combining human team members and AI agents with actionable smart snippets",
        type: 'FEATURE',
        status: 'DONE',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        estimatedEffort: '4-6 hours'
      },
      {
        title: "Fixed task details sidebar text contrast and legibility",
        description: "Improved accessibility by enhancing text contrast ratios and readability in task interface",
        type: 'BUG',
        status: 'DONE', 
        priority: 'MEDIUM',
        functionalArea: 'SOFTWARE',
        estimatedEffort: '1 hour'
      },
      {
        title: "Redesigned team page to be minimal with real agent data",
        description: "Created cleaner UI design with actual agent data loading from .maverick/agents directory structure",
        type: 'FEATURE', 
        status: 'DONE',
        priority: 'MEDIUM',
        functionalArea: 'SOFTWARE',
        estimatedEffort: '2-3 hours'
      },
      {
        title: "Built markdown parser with smart snippets and contextual actions",
        description: "Developed comprehensive maverick-markdown.ts parser supporting ::syntax for interactive smart snippets",
        type: 'FEATURE',
        status: 'DONE',
        priority: 'HIGH', 
        functionalArea: 'SOFTWARE',
        estimatedEffort: '6-8 hours'
      },
      {
        title: "Added contextual AI advice chat with comprehensive feature planning",
        description: "Implemented major feature with Get Advice button, Plan Feature functionality, and detailed implementation planning with risk assessment",
        type: 'FEATURE',
        status: 'DONE',
        priority: 'CRITICAL',
        functionalArea: 'SOFTWARE', 
        estimatedEffort: '8-12 hours'
      },
      {
        title: "Fixed GitHub Actions build errors in deployment pipeline",
        description: "Resolved module dependency issues and error handling in projects API for successful Azure deployments",
        type: 'BUG',
        status: 'DONE',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        estimatedEffort: '1-2 hours'
      }
    ]

    // Add UUIDs to each item
    const devHistoryItems = devHistoryItemsBase.map(item => ({
      ...item,
      uuid: uuidv4()
    }))

    try {
      let successCount = 0
      for (const item of devHistoryItems) {
        const response = await fetch(`/api/projects/${project.name}/work-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
        
        if (response.ok) {
          successCount++
        } else {
          console.error('Failed to create work item:', item.title)
        }
      }
      
      toast({
        title: 'Development history generated',
        description: `Created ${successCount} work items from development history`
      })
      
      // Reload work items to show the new ones
      await loadWorkItems()
      
    } catch (error) {
      console.error('Error generating development history:', error)
      toast({
        title: 'Failed to generate history',
        description: 'Could not create development history work items',
        variant: 'destructive'
      })
    } finally {
      setGeneratingHistory(false)
    }
  }

  const handleMigrateUuids = async () => {
    setMigratingUuids(true)
    
    try {
      const response = await fetch(`/api/projects/${project.name}/work-items/migrate-uuids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'UUID Migration Complete',
          description: `Migrated ${data.stats.migratedCount} work items with UUIDs and created markdown files`
        })
        console.log('🎉 UUID Migration Summary:', data)
      } else {
        const error = await response.json()
        toast({
          title: 'Migration failed',
          description: error.message || 'Could not migrate work items to UUIDs',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('UUID migration error:', error)
      toast({
        title: 'Migration failed',
        description: 'Network error during UUID migration',
        variant: 'destructive'
      })
    } finally {
      setMigratingUuids(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Work Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'subtask' && selectedSubtask && parentWorkItem) {
    return (
      <SubtaskDetailView
        subtask={selectedSubtask}
        parentWorkItem={parentWorkItem}
        onBack={handleBackToWorkItem}
        onBackToBoard={handleBackToBoard}
        className={className}
      />
    )
  }

  if (viewMode === 'detail' && selectedWorkItem) {
    return (
      <WorkItemDetailView
        workItem={selectedWorkItem}
        onBack={handleBackToBoard}
        onUpdate={(updated) => {
          setWorkItems(prev => prev.map(item => 
            item.id === updated.id ? { ...item, ...updated } : item
          ))
          setSelectedWorkItem(updated)
        }}
        onViewSubtask={handleViewSubtask}
        className={className}
      />
    )
  }

  if (viewMode === 'task-full-detail' && selectedHierarchicalTodo) {
    return (
      <TaskFullDetailView
        todo={selectedHierarchicalTodo}
        projectName={project.name.toLowerCase()}
        onBack={() => {
          setViewMode('board')
          setSelectedHierarchicalTodo(null)
        }}
        onUpdate={handleHierarchicalTodoUpdate}
        className={className}
      />
    )
  }

  if (selectedCategoryWorktree) {
    return (
      <CategoryWorktreeView
        category={selectedCategoryWorktree}
        projectName={project.name}
        onBack={() => setSelectedCategoryWorktree(null)}
        className={className}
      />
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Canvas</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{topLevelTasks.length} top-level items</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryManager(true)}
              className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-green-700 hover:bg-gradient-to-r hover:from-green-100 hover:to-blue-100"
            >
              <FileText className="w-4 h-4 mr-1" />
              Manage Categories
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetAdvice}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Get Advice
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateDevHistory}
              disabled={generatingHistory}
              className="text-xs text-gray-600 hover:text-gray-900"
              title="Generate development history work items"
            >
              {generatingHistory ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
              ) : (
                <History className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMigrateUuids}
              disabled={migratingUuids}
              className="text-xs text-gray-600 hover:text-gray-900"
              title="Migrate existing work items to include UUIDs"
            >
              {migratingUuids ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
              ) : (
                <Database className="w-3 h-3" />
              )}
            </Button>
            {(statusGroups.find(g => g.key === 'done')?.items.length || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs"
              >
                {showCompleted ? 'Hide' : 'Show'} Completed ({statusGroups.find(g => g.key === 'done')?.items.length || 0})
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Add */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              autoComplete="off"
              data-form-type="other"
              placeholder="What needs to be done? (e.g., 'Fix login bug', 'Add payment system', 'User can edit profile')..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-base py-3 px-4 border-2 focus:border-blue-500 transition-all duration-200 focus:shadow-lg focus:scale-[1.01]"
            />
            <Button 
              onClick={createWorkItem} 
              disabled={creating || !newItemText.trim()}
              className="transition-all duration-150 hover:scale-105 active:scale-95"
            >
              {creating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Plus className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
              )}
            </Button>
          </div>
          
          {/* Smart Categorization Preview */}
          {newItemText.trim() && (
            <SmartTaskCategorizationPreview
              title={newItemText}
              className="mt-3"
            />
          )}
          
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Smart capture: Just describe what you want to accomplish</span>
          </p>
        </div>

        {/* Team-Sectioned Task View (Asana-style) */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-600">
              <div className="col-span-1">Order</div>
              <div className="col-span-7">Task name</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-1">Effort</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>

          {/* Category Sections */}
          {categoryGroups.map((category) => (
            <div key={category.name} className="border-b border-gray-100 last:border-b-0">
              {/* Category Header */}
              <div 
                className="px-4 py-3 bg-gray-25 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => toggleSection(category.name)}
                style={{ 
                  borderLeftWidth: '4px',
                  borderLeftColor: category.color 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has(category.name) ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <div className="flex items-center gap-2">
                      <FileText 
                        className="w-4 h-4" 
                        style={{ color: category.color }}
                      />
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                          border: `1px solid ${category.color}40`
                        }}
                      >
                        {category.items.length} task{category.items.length !== 1 ? 's' : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCategoryWorktree({
                            id: category.id,
                            name: category.name,
                            color: category.color,
                            items: category.items
                          })
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                        style={{ color: category.color }}
                        title={`Open ${category.name} worktree`}
                      >
                        <Code className="w-3 h-3 mr-1" />
                        Worktree
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Tasks */}
              {!collapsedSections.has(category.name) && (
                <div className="divide-y divide-gray-50">
                  {category.items.map((item, index) => {
                    const globalIndex = topLevelTasks.findIndex(t => t.id === item.id)
                    return (
                      <TaskTreeItem
                        key={item.id}
                        item={item}
                        index={index}
                        globalIndex={globalIndex}
                        level={0}
                        isExpanded={!collapsedTasks.has(item.id)}
                        onToggleExpand={() => toggleTaskExpansion(item.id)}
                        onDragStart={(e) => handleDragStart(e, item, globalIndex)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, globalIndex)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, globalIndex)}
                        onClick={() => handleWorkItemClick(item)}
                        onStartWorking={() => handleStartWorking(item)}
                        onCheckProgress={() => handleCheckProgress(item)}
                        onCheckStatus={() => handleCheckStatus(item)}
                        draggedItemId={draggedItem?.id}
                        dragOverIndex={dragOverIndex}
                        allItems={workItems}
                        collapsedTasks={collapsedTasks}
                        onToggleTaskExpansion={toggleTaskExpansion}
                      />
                    )
                  })}
                  
                </div>
              )}
            </div>
          ))}
          
          {/* Add Task Row */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-25">
            <button type="button" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add task...
            </button>
          </div>
        </div>

        {workItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Ready to get started?</p>
            <p className="text-sm mb-4">
              Just type what you want to work on in the box above
            </p>
            <div className="max-w-md mx-auto text-xs text-text-muted space-y-1">
              <p>Examples:</p>
              <p>• "Fix the loading spinner on mobile"</p>
              <p>• "Add user authentication system"</p>
              <p>• "Improve page load performance"</p>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Work Item Detail Sidebar */}
      <WorkItemDetailSidebar
        workItem={selectedWorkItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpdate={handleWorkItemUpdate}
        onViewFullPlan={handleViewFullPlan}
      />

      {/* Hierarchical Task Details Sidebar */}
      {hierarchicalSidebarOpen && selectedHierarchicalTodo && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 animate-in fade-in duration-200"
            onClick={handleHierarchicalTodoClose}
          />
          <TaskDetailsSidebar
            todo={selectedHierarchicalTodo}
            projectName={project.name.toLowerCase()}
            onClose={handleHierarchicalTodoClose}
            onUpdate={handleHierarchicalTodoUpdate}
            onSubtaskCreate={handleSubtaskCreate}
            onViewFullDetails={handleViewFullDetails}
            onNavigateToTask={handleNavigateToTask}
          />
        </>
      )}

      {/* Contextual AI Chat */}
      <ContextualAIChat
        context={{
          type: planningTaskId ? 'single-task' : 'project-tasks',
          projectName: project.name,
          data: planningTaskId ? workItems.find(item => item.id === planningTaskId) : undefined,
          workItems: planningTaskId ? undefined : workItems
        }}
        isOpen={adviceChatOpen}
        onClose={handleCloseAdviceChat}
      />

      {/* Auto-categorization Progress Indicator */}
      {categorizationInProgress && (
        <div className="fixed top-4 right-4 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span>🤖 Auto-categorizing tasks</span>
              </h4>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(categorizationProgress.current / categorizationProgress.total) * 100}%` }}
                />
              </div>
              
              {/* Progress text */}
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">
                  {categorizationProgress.current} of {categorizationProgress.total} completed
                </span>
              </div>
              
              {/* Current item being processed */}
              {categorizationProgress.currentItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">
                      Processing: {categorizationProgress.currentItem}
                    </div>
                    {categorizationProgress.currentCategory && (
                      <div className="text-blue-700 flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        Moving to {categorizationProgress.currentCategory}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Manager */}
      <CategoryManager
        projectName={project.name}
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={projectCategories}
        onCategoriesUpdate={loadCategoriesWithCallbacks}
        workItems={topLevelTasks}
        onWorkItemUpdate={async (workItemId: string, categoryId: string) => {
          // Find the category details
          const category = projectCategories.find(c => c.id === categoryId)
          if (!category) return
          
          console.log(`🔄 Updating work item ${workItemId} to category ${categoryId} (${category.name})`)
          
          try {
            // Update the work item via API to persist to file
            const response = await fetch(`/api/projects/${project.name.toLowerCase()}/work-items/${workItemId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                smartCategory: {
                  id: category.id,
                  name: category.name,
                  team: category.name, // Use category name as team for now
                  color: category.color,
                  categorizedAt: new Date().toISOString()
                }
              })
            })

            if (!response.ok) {
              throw new Error(`Failed to update work item: ${response.status}`)
            }

            console.log(`✅ Successfully updated work item ${workItemId} in database`)

            // Update local state to reflect the change immediately
            setWorkItems(prev => prev.map(item => 
              item.id === workItemId 
                ? {
                    ...item,
                    smartCategory: {
                      id: category.id,
                      name: category.name,
                      team: category.name,
                      color: category.color,
                      categorizedAt: new Date().toISOString()
                    }
                  }
                : item
            ))
            
          } catch (error) {
            console.error('❌ Error updating work item:', error)
            toast({
              title: 'Categorization failed',
              description: `Failed to update work item: ${error instanceof Error ? error.message : String(error)}`,
              variant: 'destructive'
            })
          }
        }}
      />
    </Card>
  )
}