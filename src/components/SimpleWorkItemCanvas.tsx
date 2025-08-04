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
  ArrowRight
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WorkItemDetailSidebar } from '@/components/WorkItemDetailSidebar'
import { WorkItemDetailView } from '@/components/WorkItemDetailView'
import { SubtaskDetailView } from '@/components/SubtaskDetailView'

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'BLOCKED' | 'DEFERRED'
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
  const [viewMode, setViewMode] = useState<'board' | 'detail' | 'subtask'>('board')
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null)
  const [parentWorkItem, setParentWorkItem] = useState<WorkItem | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

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
        } else if (sidebarOpen) {
          setSidebarOpen(false)
          setSelectedWorkItem(null)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, sidebarOpen])

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
      default:
        return 'bg-background-tertiary text-text-muted'
    }
  }

  // Group work items by lifecycle stages for better organization
  const stageGroups = {
    'Plan': workItems.filter(item => 
      item.status === 'PLANNED' || 
      (item.type === 'EPIC' && item.status !== 'DONE' && item.status !== 'DEFERRED')
    ),
    'Execute': workItems.filter(item => 
      item.status === 'IN_PROGRESS' || 
      (item.type === 'FEATURE' && item.status !== 'DONE' && item.status !== 'PLANNED' && item.status !== 'DEFERRED')
    ),
    'Review': workItems.filter(item => 
      item.status === 'IN_REVIEW' || item.status === 'TESTING'
    ),
    'Complete': workItems.filter(item => item.status === 'DONE'),
    'Deferred': workItems.filter(item => item.status === 'DEFERRED')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      createWorkItem()
    }
  }

  const handleWorkItemClick = (workItem: WorkItem) => {
    // Add projectName to the work item for the sidebar
    const workItemWithProject = {
      ...workItem,
      projectName: project.name
    }
    setSelectedWorkItem(workItemWithProject)
    setSidebarOpen(true)
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Canvas</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{workItems.length} items</Badge>
            {stageGroups['Complete'].length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs"
              >
                {showCompleted ? 'Hide' : 'Show'} Completed ({stageGroups['Complete'].length})
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
              className="flex-1 text-base py-3 px-4 border-2 focus:border-blue-500 transition-colors"
            />
            <Button 
              onClick={createWorkItem} 
              disabled={creating || !newItemText.trim()}
            >
              {creating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Smart capture: Just describe what you want to accomplish</span>
          </p>
        </div>

        {/* Stage-based Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 h-96">
          {Object.entries(stageGroups).map(([stage, items]) => (
            <div key={stage} className="space-y-3 h-full flex flex-col">
              <div className="flex items-center gap-2 flex-shrink-0">
                <h3 className="font-medium text-sm text-text-primary">
                  {stage}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {items.length}
                </Badge>
              </div>
              
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer ${
                      item.status === 'DEFERRED' 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-background-secondary'
                    }`}
                    onClick={() => handleWorkItemClick(item)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getTypeIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-text-primary truncate">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-text-muted line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {item.worktreeName && (
                          <div className="flex items-center gap-1 text-text-muted">
                            <GitBranch className="w-3 h-3" />
                            <span className="truncate max-w-20">{item.worktreeName}</span>
                          </div>
                        )}
                        {item.functionalArea !== 'SOFTWARE' && (
                          <Badge variant="outline" className="text-xs">
                            {item.functionalArea}
                          </Badge>
                        )}
                      </div>
                      
                      <button className="p-1 hover:bg-background-tertiary rounded">
                        <MoreHorizontal className="w-3 h-3 text-text-muted" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {items.length === 0 && (
                  <div className="p-4 border-2 border-dashed border-border-subtle rounded-lg text-center">
                    <p className="text-xs text-text-muted">
                      {stage === 'Plan' ? 'Add items above' : `No ${stage.toLowerCase()} items`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
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
    </Card>
  )
}