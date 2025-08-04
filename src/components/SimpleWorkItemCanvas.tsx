'use client'

import { useState, useEffect } from 'react'
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
  ChevronDown
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WorkItemDetailSidebar } from '@/components/WorkItemDetailSidebar'
import { WorkItemDetailView } from '@/components/WorkItemDetailView'
import { SubtaskDetailView } from '@/components/SubtaskDetailView'
import { TaskDetailsSidebar } from '@/components/TaskDetailsSidebar'
import { TaskFullDetailView } from '@/components/TaskFullDetailView'
import { HierarchicalTodo, hierarchicalTodoClientService } from '@/lib/hierarchical-todos-client'

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

  useEffect(() => {
    loadWorkItems()
  }, [project.name])

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
      estimatedEffort: workItem.estimatedEffort,
      assignedTo: workItem.assignedToId,
      createdAt: workItem.createdAt,
      updatedAt: workItem.updatedAt,
      projectName: workItem.projectName || project.name
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
      projectName: todo.projectName
    }
  }

  const loadWorkItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.name}/work-items`)
      
      if (response.ok) {
        const data = await response.json()
        setWorkItems(data.workItems || [])
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

  // Filter to only show top-level tasks (no valid parentId)
  const topLevelTasks = workItems.filter(item => {
    const hasParent = item.parentId && item.parentId !== 'null' && item.parentId !== 'undefined' && item.parentId.trim() !== ''
    return !hasParent
  })

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

  const handleSubtaskCreate = (subtask: HierarchicalTodo) => {
    // When a subtask is created, reload the work items to include it
    loadWorkItems()
  }

  const handleViewFullDetails = (todo: HierarchicalTodo) => {
    setSelectedHierarchicalTodo(todo)
    setViewMode('task-full-detail')
    setHierarchicalSidebarOpen(false)
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Canvas</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{topLevelTasks.length} top-level items</Badge>
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
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Smart capture: Just describe what you want to accomplish</span>
          </p>
        </div>

        {/* Asana-Style Table View */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="grid grid-cols-8 gap-4 items-center text-sm font-medium text-gray-600">
              <div className="col-span-1">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              </div>
              <div className="col-span-5">Task name</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-1">Effort</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {statusGroups.map((group) => (
              <div key={group.key}>
                {/* Section Header */}
                {group.items.length > 0 && (
                  <div className="bg-gray-25 px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{group.title}</span>
                      <span className="text-xs text-gray-500">({group.items.length})</span>
                    </div>
                  </div>
                )}
                
                {/* Section Items */}
                {group.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-8 gap-4 items-center px-4 py-3 hover:bg-gray-50 cursor-pointer group transition-all duration-150 ease-out hover:shadow-sm hover:scale-[1.01] ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    } ${item.status === 'DONE' ? 'opacity-60' : ''}`}
                    onClick={() => handleWorkItemClick(item)}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300"
                        checked={item.status === 'DONE'}
                        onChange={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Task Name */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {item.status === 'PENDING' ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center">
                            {getTypeIcon(item.type)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${
                            item.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </span>
                          {item.status === 'PENDING' && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              🤖 Enhancing
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Priority */}
                    <div className="col-span-1">
                      {item.priority === 'HIGH' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 transition-all duration-150 hover:bg-orange-200">
                          High
                        </span>
                      )}
                      {item.priority === 'URGENT' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-900 border border-orange-300 transition-all duration-150 hover:bg-orange-300">
                          Urgent
                        </span>
                      )}
                      {item.priority === 'MEDIUM' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 transition-all duration-150 hover:bg-gray-100">
                          Med
                        </span>
                      )}
                      {item.priority === 'LOW' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 transition-all duration-150 hover:bg-gray-100">
                          Low
                        </span>
                      )}
                    </div>
                    
                    {/* Effort */}
                    <div className="col-span-1 flex items-center gap-1">
                      {item.estimatedEffort && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 transition-all duration-150 hover:bg-blue-100 hover:scale-105">
                          {item.estimatedEffort}
                        </span>
                      )}
                      {item.functionalArea !== 'SOFTWARE' && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 text-[10px]">
                          {item.functionalArea.slice(0,3)}
                        </span>
                      )}
                      {item.worktreeName && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          <GitBranch className="w-2 h-2" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
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
    </Card>
  )
}