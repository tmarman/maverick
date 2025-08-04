'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { 
  Plus,
  Bug,
  Zap,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  GitBranch,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  PlayCircle,
  XCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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
  githubIssueNumber?: number
  githubPRNumber?: number
  estimatedEffort?: string
  assignedToId?: string
  createdAt: string
  updatedAt: string
  children?: WorkItem[]
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

interface WorkItemManagerProps {
  project: Project
  className?: string
}

export function WorkItemManager({ project, className }: WorkItemManagerProps) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Create work item form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FEATURE' as WorkItem['type'],
    priority: 'MEDIUM' as WorkItem['priority'],
    functionalArea: 'SOFTWARE' as WorkItem['functionalArea'],
    parentId: '',
    estimatedEffort: ''
  })

  useEffect(() => {
    loadWorkItems()
  }, [project.id])

  const loadWorkItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.id}/work-items`)
      
      if (response.ok) {
        const data = await response.json()
        setWorkItems(buildHierarchy(data.workItems || []))
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

  const buildHierarchy = (items: WorkItem[]): WorkItem[] => {
    const itemMap = new Map<string, WorkItem>()
    const rootItems: WorkItem[] = []

    // First pass: create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    // Second pass: build hierarchy
    items.forEach(item => {
      const itemWithChildren = itemMap.get(item.id)!
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!
        if (!parent.children) parent.children = []
        parent.children.push(itemWithChildren)
      } else {
        rootItems.push(itemWithChildren)
      }
    })

    // Sort by orderIndex at each level
    const sortChildren = (items: WorkItem[]) => {
      items.sort((a, b) => a.orderIndex - b.orderIndex)
      items.forEach(item => {
        if (item.children) sortChildren(item.children)
      })
    }
    sortChildren(rootItems)

    return rootItems
  }

  const createWorkItem = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for the work item.',
        variant: 'destructive'
      })
      return
    }

    try {
      setCreating(true)
      
      const response = await fetch(`/api/projects/${project.id}/work-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
          createWorktree: formData.type === 'FEATURE' || formData.type === 'BUG'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Work item created',
          description: data.message || `Created ${formData.type.toLowerCase()}: ${data.workItem.title}`
        })
        
        // Reset form and close dialog
        setFormData({
          title: '',
          description: '',
          type: 'FEATURE',
          priority: 'MEDIUM',
          functionalArea: 'SOFTWARE',
          parentId: '',
          estimatedEffort: ''
        })
        setShowCreateDialog(false)
        
        // Reload work items
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

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const createWorktreeForItem = async (workItem: WorkItem) => {
    if (!project.repositoryUrl) {
      toast({
        title: 'Repository not configured',
        description: 'This project needs a connected repository to create worktrees.',
        variant: 'destructive'
      })
      return
    }

    try {
      // Extract owner/repo from repository URL
      const repoMatch = project.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!repoMatch) {
        toast({
          title: 'Invalid repository URL',
          description: 'Could not parse GitHub repository URL.',
          variant: 'destructive'
        })
        return
      }

      const [, owner, repo] = repoMatch
      const worktreeName = `${workItem.type.toLowerCase()}/${workItem.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 50)}`

      const response = await fetch(`/repositories/${owner}/${repo}/worktrees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: worktreeName,
          description: workItem.description,
          baseBranch: project.defaultBranch || 'main',
          purpose: workItem.type.toLowerCase(),
          createBranch: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update work item with worktree information
        const updateResponse = await fetch(`/api/projects/${project.id}/work-items/${workItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worktreeName,
            worktreeStatus: 'ACTIVE',
            worktreePath: data.worktree?.path,
            githubBranch: worktreeName
          })
        })

        if (updateResponse.ok) {
          toast({
            title: 'Worktree created',
            description: `Created worktree: ${worktreeName}`
          })
          await loadWorkItems()
        }
      } else {
        const error = await response.json()
        toast({
          title: 'Failed to create worktree',
          description: error.message || 'An error occurred',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating worktree:', error)
      toast({
        title: 'Worktree creation failed',
        description: 'Failed to create worktree for work item',
        variant: 'destructive'
      })
    }
  }

  const getTypeIcon = (type: WorkItem['type']) => {
    switch (type) {
      case 'FEATURE':
        return <Zap className="w-4 h-4 text-blue-600" />
      case 'BUG':
        return <Bug className="w-4 h-4 text-red-600" />
      case 'EPIC':
        return <AlertCircle className="w-4 h-4 text-purple-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: WorkItem['status']) => {
    switch (status) {
      case 'PLANNED':
        return <Calendar className="w-4 h-4 text-gray-500" />
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4 text-blue-500" />
      case 'IN_REVIEW':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'TESTING':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'DONE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'BLOCKED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: WorkItem['status']) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-background-tertiary text-text-muted'
      case 'IN_PROGRESS':
        return 'bg-background-tertiary text-text-primary'
      case 'IN_REVIEW':
        return 'bg-background-secondary text-text-secondary'
      case 'TESTING':
        return 'bg-background-secondary text-text-secondary'
      case 'DONE':
        return 'bg-background-secondary text-text-primary'
      case 'CANCELLED':
        return 'bg-background-tertiary text-text-muted'
      case 'BLOCKED':
        return 'bg-background-tertiary text-text-muted'
      default:
        return 'bg-background-tertiary text-text-muted'
    }
  }

  const getPriorityColor = (priority: WorkItem['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-background-tertiary text-text-muted'
      case 'MEDIUM':
        return 'bg-background-secondary text-text-secondary'
      case 'HIGH':
        return 'bg-background-secondary text-text-primary'
      case 'URGENT':
        return 'bg-background-secondary text-text-primary'
      case 'CRITICAL':
        return 'bg-background-secondary text-text-primary'
      default:
        return 'bg-background-tertiary text-text-muted'
    }
  }

  const renderWorkItem = (item: WorkItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const indentClass = level > 0 ? `ml-${level * 4}` : ''

    return (
      <div key={item.id} className="space-y-2">
        <div className={`flex items-center justify-between p-3 border rounded-lg hover:bg-background-secondary ${indentClass}`}>
          <div className="flex items-center gap-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(item.id)}
                className="flex items-center justify-center w-5 h-5 hover:bg-background-tertiary rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="w-5 h-5" />
            )}
            
            {getTypeIcon(item.type)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{item.title}</span>
                <Badge className={getStatusColor(item.status)} variant="outline">
                  {item.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(item.priority)} variant="outline">
                  {item.priority}
                </Badge>
                {item.functionalArea !== 'SOFTWARE' && (
                  <Badge variant="outline">{item.functionalArea}</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-text-muted">
                {item.worktreeName && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {item.worktreeName}
                  </span>
                )}
                {item.estimatedEffort && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.estimatedEffort}
                  </span>
                )}
                {item.githubIssueNumber && (
                  <span>#{item.githubIssueNumber}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(item.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child Item
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Assign
                </DropdownMenuItem>
                {(item.type === 'FEATURE' || item.type === 'BUG') && !item.worktreeName && (
                  <DropdownMenuItem onClick={() => createWorktreeForItem(item)}>
                    <GitBranch className="w-4 h-4 mr-2" />
                    Create Worktree
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {item.children!.map(child => renderWorkItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Work Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Work Items
            <Badge variant="secondary">{workItems.length}</Badge>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Work Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      className="w-full p-2 border rounded"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as WorkItem['type'] }))}
                    >
                      <option value="FEATURE">Feature</option>
                      <option value="BUG">Bug</option>
                      <option value="EPIC">Epic</option>
                      <option value="STORY">Story</option>
                      <option value="TASK">Task</option>
                      <option value="SUBTASK">Subtask</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      className="w-full p-2 border rounded"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as WorkItem['priority'] }))}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., User authentication system"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work item in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="functionalArea">Functional Area</Label>
                    <select
                      id="functionalArea"
                      className="w-full p-2 border rounded"
                      value={formData.functionalArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, functionalArea: e.target.value as WorkItem['functionalArea'] }))}
                    >
                      <option value="SOFTWARE">Software</option>
                      <option value="LEGAL">Legal</option>
                      <option value="OPERATIONS">Operations</option>
                      <option value="MARKETING">Marketing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedEffort">Estimated Effort</Label>
                    <Input
                      id="estimatedEffort"
                      placeholder="e.g., 1d, 1w, 1m"
                      value={formData.estimatedEffort}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedEffort: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createWorkItem}
                    disabled={creating || !formData.title.trim()}
                  >
                    {creating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                    Create Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No work items found</p>
            <p className="text-sm mb-4">Create your first feature or bug to get started</p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Work Item
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-2">
            {workItems.map(item => renderWorkItem(item))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}