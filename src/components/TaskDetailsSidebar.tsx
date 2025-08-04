'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Plus, 
  Check,
  Clock,
  GitBranch,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  FileText,
  PlayCircle,
  Settings,
  ChevronLeft,
  Home,
  Zap,
  Bug,
  CheckCircle
} from 'lucide-react'
import { HierarchicalTodo, hierarchicalTodoClientService } from '@/lib/hierarchical-todos-client'
import { toast } from '@/hooks/use-toast'
import { ContextualChat, type ChatScope } from '@/components/ContextualChat'

interface TaskDetailsSidebarProps {
  todo: HierarchicalTodo | null
  projectName: string
  onClose: () => void
  onUpdate?: (todo: HierarchicalTodo) => void
  onSubtaskCreate?: (subtask: HierarchicalTodo) => void
  onViewFullDetails?: (todo: HierarchicalTodo) => void
  onNavigateToTask?: (taskId: string) => void
}

export function TaskDetailsSidebar({ 
  todo, 
  projectName, 
  onClose, 
  onUpdate, 
  onSubtaskCreate,
  onViewFullDetails,
  onNavigateToTask
}: TaskDetailsSidebarProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showingSubtasks, setShowingSubtasks] = useState(true)
  const [subtasks, setSubtasks] = useState<HierarchicalTodo[]>([])
  const [loading, setLoading] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<HierarchicalTodo[]>([])
  const [parentTask, setParentTask] = useState<HierarchicalTodo | null>(null)
  const [showChat, setShowChat] = useState(false)

  // Local state for editing
  const [localTodo, setLocalTodo] = useState<HierarchicalTodo | null>(todo)

  useEffect(() => {
    setLocalTodo(todo)
    if (todo) {
      loadSubtasks()
      loadBreadcrumbs()
      loadParentTask()
    }
  }, [todo])

  const loadParentTask = async () => {
    if (!todo || !todo.parentId || !projectName) {
      setParentTask(null)
      return
    }
    
    try {
      const parent = await hierarchicalTodoClientService.getTodo(projectName, todo.parentId)
      setParentTask(parent)
    } catch (error) {
      console.error('Failed to load parent task:', error)
      setParentTask(null)
    }
  }

  const loadBreadcrumbs = async () => {
    if (!todo || !projectName) return
    
    try {
      const path: HierarchicalTodo[] = []
      let currentTodo = todo
      
      // Build breadcrumb path from current task up to root
      while (currentTodo && currentTodo.parentId) {
        const parent = await hierarchicalTodoClientService.getTodo(projectName, currentTodo.parentId)
        if (parent) {
          path.unshift(parent)
          currentTodo = parent
        } else {
          break
        }
      }
      
      setBreadcrumbs(path)
    } catch (error) {
      console.error('Failed to load breadcrumbs:', error)
    }
  }

  const loadSubtasks = async () => {
    if (!todo || !projectName) return
    
    try {
      const children = await hierarchicalTodoClientService.getChildTodos(
        projectName,
        todo.id
      )
      // Sort subtasks by orderIndex for consistent ordering
      const sortedChildren = children.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      setSubtasks(sortedChildren)
    } catch (error) {
      console.error('Failed to load subtasks:', error)
    }
  }

  const handleUpdate = async (updates: Partial<HierarchicalTodo>) => {
    if (!localTodo || !projectName) return

    setLoading(true)
    try {
      const updatedTodo = await hierarchicalTodoClientService.updateTodo(
        projectName,
        localTodo.id,
        updates
      )
      
      if (updatedTodo) {
        setLocalTodo(updatedTodo)
        if (onUpdate) {
          onUpdate(updatedTodo)
        }
        
        toast({
          title: 'Task updated',
          description: 'Changes saved successfully'
        })
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      toast({
        title: 'Update failed',
        description: 'Could not save changes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim() || !localTodo || !projectName) return

    setLoading(true)
    try {
      const subtask = await hierarchicalTodoClientService.createTodo(
        projectName,
        {
          title: newSubtaskTitle,
          type: 'SUBTASK',
          status: 'PLANNED',
          priority: localTodo.priority,
          functionalArea: localTodo.functionalArea
        },
        localTodo.id
      )
      
      setSubtasks(prev => [...prev, subtask])
      setNewSubtaskTitle('')
      
      if (onSubtaskCreate) {
        onSubtaskCreate(subtask)
      }
      
      toast({
        title: 'Subtask created',
        description: `"${subtask.title}" added successfully`
      })
    } catch (error) {
      console.error('Failed to create subtask:', error)
      toast({
        title: 'Creation failed',
        description: 'Could not create subtask',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubtaskStatusToggle = async (subtaskId: string, completed: boolean) => {
    try {
      await hierarchicalTodoClientService.updateTodo(projectName, subtaskId, {
        status: completed ? 'DONE' : 'PLANNED'
      })
      
      // Reload subtasks
      await loadSubtasks()
    } catch (error) {
      console.error('Failed to update subtask:', error)
    }
  }

  const handleStartWork = async () => {
    if (!localTodo || !projectName) return

    setLoading(true)
    try {
      console.log('Starting work for task:', localTodo.id, 'in project:', projectName)
      
      // Call API to create worktree and start agent work
      const response = await fetch(`/api/projects/${projectName}/tasks/${localTodo.id}/start-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Ensure cookies/session are included
      })

      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        
        // Update task status to IN_PROGRESS
        await handleUpdate({ status: 'IN_PROGRESS' })
        
        toast({
          title: '🤖 Agent Work Started!',
          description: `AI agent assigned with screenshot/video capture enabled`
        })
      } else {
        const error = await response.json()
        console.error('API error response:', error)
        toast({
          title: 'Failed to start work',
          description: error.error || error.message || 'Could not create worktree',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to start work:', error)
      toast({
        title: 'Start work failed',
        description: 'An error occurred while starting work',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewWorktree = async () => {
    if (!localTodo || !projectName) return

    try {
      // Call API to get worktree status and progress
      const response = await fetch(`/api/projects/${projectName}/tasks/${localTodo.id}/worktree-status`)
      
      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: 'Worktree Status',
          description: `Branch: ${data.branchName} | Progress: ${data.progress}%`
        })
        
        // Could open a modal or navigate to worktree view
        // For now, just show status
      } else {
        toast({
          title: 'No active worktree',
          description: 'This task is not currently being worked on',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to get worktree status:', error)
      toast({
        title: 'Status check failed',
        description: 'Could not get worktree status',
        variant: 'destructive'
      })
    }
  }

  if (!localTodo) {
    return null
  }

  return (
    <div className="fixed right-0 top-0 w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-50 transform transition-all duration-200 ease-out animate-in slide-in-from-right">
      {/* Header */}
      <div className="border-b border-gray-200">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-600 overflow-x-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-150 flex-shrink-0"
              >
                <Home className="w-3 h-3" />
                Tasks
              </button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => onNavigateToTask?.(crumb.id)}
                    className="hover:text-blue-600 transition-colors duration-150 truncate max-w-24"
                    title={crumb.title}
                  >
                    {crumb.title}
                  </button>
                </div>
              ))}
              <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 font-medium truncate">{localTodo.title}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between p-4">
          <h2 className="font-medium text-gray-900">Task Details</h2>
          <div className="flex items-center gap-2">
            {onViewFullDetails && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onViewFullDetails(localTodo)}
                className="text-xs text-gray-600 hover:text-blue-600 transition-colors duration-150"
              >
                <FileText className="w-3 h-3 mr-1" />
                Full Details
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Task Title */}
        <div className="space-y-2">
          {editingTitle ? (
            <Input
              value={localTodo.title}
              onChange={(e) => setLocalTodo(prev => prev ? { ...prev, title: e.target.value } : null)}
              onBlur={() => {
                setEditingTitle(false)
                handleUpdate({ title: localTodo.title })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingTitle(false)
                  handleUpdate({ title: localTodo.title })
                }
              }}
              className="text-lg font-medium"
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-medium text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => setEditingTitle(true)}
            >
              {localTodo.title}
            </h3>
          )}
        </div>

        {/* Task Actions */}
        {localTodo.status === 'PLANNED' && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleStartWork()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Work in Worktree
            </Button>
            <p className="text-xs text-gray-500 text-center">
              🤖 Assigns AI agent with screenshot/video capture
            </p>
          </div>
        )}

        {localTodo.status === 'IN_PROGRESS' && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => handleViewWorktree()}
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-150"
              disabled={loading}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              View Worktree Progress
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Monitor AI agent work in isolated branch
            </p>
          </div>
        )}

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Status</Label>
            <select
              value={localTodo.status}
              onChange={(e) => handleUpdate({ status: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-150 focus:border-blue-500 focus:shadow-sm hover:border-gray-400"
              disabled={loading}
            >
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
              <option value="DEFERRED">Deferred</option>
            </select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Priority</Label>
            <select
              value={localTodo.priority}
              onChange={(e) => handleUpdate({ priority: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-150 focus:border-blue-500 focus:shadow-sm hover:border-gray-400"
              disabled={loading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Type & Functional Area */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Type</Label>
            <select
              value={localTodo.type}
              onChange={(e) => handleUpdate({ type: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={loading}
            >
              <option value="TASK">Task</option>
              <option value="SUBTASK">Subtask</option>
              <option value="STORY">Story</option>
              <option value="FEATURE">Feature</option>
              <option value="BUG">Bug</option>
              <option value="EPIC">Epic</option>
            </select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Area</Label>
            <select
              value={localTodo.functionalArea}
              onChange={(e) => handleUpdate({ functionalArea: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={loading}
            >
              <option value="SOFTWARE">Software</option>
              <option value="MARKETING">Marketing</option>
              <option value="LEGAL">Legal</option>
              <option value="OPERATIONS">Operations</option>
            </select>
          </div>
        </div>

        {/* Estimated Effort */}
        <div>
          <Label className="text-sm font-medium text-gray-600">Estimated Effort</Label>
          <select
            value={localTodo.estimatedEffort || ''}
            onChange={(e) => handleUpdate({ estimatedEffort: e.target.value as any })}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-150 focus:border-blue-500 focus:shadow-sm hover:border-gray-400"
            disabled={loading}
          >
            <option value="">Not specified</option>
            <option value="XS">XS - Quick fix or tiny task</option>
            <option value="S">S - Small task, couple hours</option>
            <option value="M">M - Medium task, half day</option>
            <option value="L">L - Large task, 1-2 days</option>
            <option value="XL">XL - Very large, 3-5 days</option>
            <option value="XXL">XXL - Epic-sized, 1+ weeks</option>
          </select>
        </div>

        {/* Parent Task */}
        {parentTask && (
          <div className="border-t border-gray-200 pt-4">
            <Label className="text-sm font-medium text-gray-600">Parent Task</Label>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => onNavigateToTask?.(parentTask.id)}
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group transition-all duration-150 hover:shadow-sm w-full text-left"
              >
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {parentTask.type === 'FEATURE' ? (
                      <Zap className="w-4 h-4 text-blue-600" />
                    ) : parentTask.type === 'BUG' ? (
                      <Bug className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {parentTask.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {parentTask.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {parentTask.description}
                    </p>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <Label className="text-sm font-medium text-gray-600">Description</Label>
          {editingDescription ? (
            <Textarea
              value={localTodo.description || ''}
              onChange={(e) => setLocalTodo(prev => prev ? { ...prev, description: e.target.value } : null)}
              onBlur={() => {
                setEditingDescription(false)
                handleUpdate({ description: localTodo.description })
              }}
              placeholder="What is this task about?"
              className="mt-1 min-h-[80px]"
              autoFocus
            />
          ) : (
            <div
              className="mt-1 min-h-[80px] p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
              onClick={() => setEditingDescription(true)}
            >
              {localTodo.description || (
                <span className="text-gray-500">What is this task about?</span>
              )}
            </div>
          )}
        </div>

        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowingSubtasks(!showingSubtasks)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showingSubtasks ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Subtasks ({subtasks.length})
            </button>
            
            {showingSubtasks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewSubtaskTitle('New subtask')}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            )}
          </div>

          {showingSubtasks && (
            <div className="space-y-2">
              {/* Add new subtask */}
              <div className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateSubtask()
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCreateSubtask}
                  disabled={!newSubtaskTitle.trim() || loading}
                  className="transition-all duration-150 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-3 h-3 transition-transform duration-150 hover:rotate-90" />
                </Button>
              </div>

              {/* Subtask list */}
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 group transition-all duration-150 hover:shadow-sm animate-in slide-in-from-left"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSubtaskStatusToggle(subtask.id, subtask.status !== 'DONE')
                    }}
                    className="flex-shrink-0"
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      subtask.status === 'DONE'
                        ? 'bg-orange-100 border-orange-300 text-orange-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {subtask.status === 'DONE' && <Check className="w-2 h-2" />}
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => onNavigateToTask?.(subtask.id)}
                    className={`flex-1 text-sm text-left hover:text-blue-600 transition-colors duration-150 ${
                      subtask.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {subtask.title}
                  </button>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {subtask.priority === 'HIGH' && (
                      <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        H
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigateToTask?.(subtask.id)
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {subtasks.length === 0 && (
                <p className="text-sm text-gray-500 italic">No subtasks yet</p>
              )}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <MessageSquare className="w-4 h-4" />
              Task Chat
              {showChat ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {showChat && (
            <div className="h-80 border border-gray-200 rounded-lg overflow-hidden">
              <ContextualChat
                scope={{
                  type: 'task',
                  id: localTodo.id,
                  title: localTodo.title,
                  projectName: projectName,
                  workingDirectory: localTodo.status === 'IN_PROGRESS' && localTodo.worktreeName 
                    ? `/tmp/repos/${projectName}/${localTodo.worktreeName}`
                    : `/tmp/repos/${projectName}/main`,
                  branchName: localTodo.worktreeName || 'main',
                  context: {
                    task: localTodo
                  }
                }}
                compact={true}
                onAction={(action) => {
                  toast({
                    title: 'Action Executed',
                    description: action.title
                  })
                }}
              />
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-500">
          <div>Created: {new Date(localTodo.createdAt).toLocaleDateString()}</div>
          <div>Updated: {new Date(localTodo.updatedAt).toLocaleDateString()}</div>
          {localTodo.depth > 0 && (
            <div>Depth: Level {localTodo.depth}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetailsSidebar