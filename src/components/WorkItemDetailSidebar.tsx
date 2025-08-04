'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Edit3, 
  Save, 
  GitBranch, 
  Clock, 
  User, 
  Calendar,
  CheckSquare,
  MoreHorizontal,
  ExternalLink,
  MessageSquare,
  Brain,
  Loader2,
  ListTodo,
  Terminal
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

interface WorkItemDetailSidebarProps {
  workItem: WorkItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (workItem: WorkItem) => void
  onViewFullPlan?: (workItem: WorkItem) => void
  onOpenDevelopmentChat?: (workItem: WorkItem) => void
  className?: string
}

export function WorkItemDetailSidebar({ 
  workItem, 
  isOpen, 
  onClose, 
  onUpdate,
  onViewFullPlan,
  onOpenDevelopmentChat,
  className 
}: WorkItemDetailSidebarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedStatus, setEditedStatus] = useState<WorkItem['status']>('PLANNED')
  const [editedPriority, setEditedPriority] = useState<WorkItem['priority']>('MEDIUM')
  const [loading, setLoading] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [aiPlanning, setAiPlanning] = useState(false)
  const [subtasks, setSubtasks] = useState<Array<{ title: string; description: string; category: string; completed?: boolean }>>([])
  const [actionPlan, setActionPlan] = useState<Array<{ title: string; description: string; duration: string }>>([])
  const [hasAiPlan, setHasAiPlan] = useState(false)

  useEffect(() => {
    if (workItem) {
      setEditedTitle(workItem.title)
      setEditedDescription(workItem.description || '')
      setEditedStatus(workItem.status)
      setEditedPriority(workItem.priority)
      setMarkdownContent(workItem.markdownContent || '')
      
      // Parse markdown content for subtasks and action plan
      if (workItem.markdownContent) {
        const parsedData = parseMarkdownForPlanData(workItem.markdownContent)
        setSubtasks(parsedData.subtasks)
        setActionPlan(parsedData.actionPlan)
        setHasAiPlan(parsedData.hasAiPlan)
      } else {
        setSubtasks([])
        setActionPlan([])
        setHasAiPlan(false)
      }
    }
  }, [workItem])

  const handleSave = async () => {
    if (!workItem) return

    try {
      setLoading(true)
      
      // TODO: Implement work item update API
      const response = await fetch(`/api/projects/${workItem.projectName}/work-items/${workItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
          status: editedStatus,
          priority: editedPriority
        })
      })

      if (response.ok) {
        const updatedWorkItem = { 
          ...workItem, 
          title: editedTitle,
          description: editedDescription,
          status: editedStatus,
          priority: editedPriority,
          updatedAt: new Date().toISOString()
        }
        
        onUpdate?.(updatedWorkItem)
        setIsEditing(false)
        
        toast({
          title: 'Work item updated',
          description: 'Changes saved successfully'
        })
      } else {
        throw new Error('Failed to update work item')
      }
    } catch (error) {
      console.error('Error updating work item:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to save changes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAiPlanning = async () => {
    if (!workItem) return

    try {
      setAiPlanning(true)
      
      // Call the AI planning API with git repo context
      const response = await fetch(`/api/projects/${workItem.projectName}/work-items/${workItem.id}/ai-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: workItem.title,
          description: workItem.description,
          type: workItem.type
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update work item with new AI-generated content
        setMarkdownContent(data.updatedMarkdown)
        setSubtasks(data.subtasks || [])
        setActionPlan(data.actionPlan || [])
        setHasAiPlan(true)
        
        // Update the work item in the parent component
        onUpdate?.({ ...workItem, markdownContent: data.updatedMarkdown })
        
        toast({
          title: 'AI planning complete',
          description: 'Generated detailed action plan and subtasks'
        })
      } else {
        throw new Error('Failed to generate AI plan')
      }
    } catch (error) {
      console.error('Error generating AI plan:', error)
      toast({
        title: 'AI planning failed',
        description: 'Failed to generate plan. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setAiPlanning(false)
    }
  }

  const parseMarkdownForPlanData = (markdown: string) => {
    const subtasks: Array<{ title: string; description: string; category: string; completed?: boolean }> = []
    const actionPlan: Array<{ title: string; description: string; duration: string }> = []
    let hasAiPlan = false

    const lines = markdown.split('\n')
    let inSubtasks = false
    let inActionPlan = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Check for AI-generated content markers
      if (line.includes('✨') || line.includes('Generated by AI') || line.includes('Maverick AI')) {
        hasAiPlan = true
      }

      // Parse subtasks section
      if (line === '## ✅ Subtasks') {
        inSubtasks = true
        inActionPlan = false
        continue
      }

      // Parse action plan section
      if (line === '## 🎯 Action Plan') {
        inActionPlan = true
        inSubtasks = false
        continue
      }

      // End sections
      if (line.startsWith('## ') && line !== '## ✅ Subtasks' && line !== '## 🎯 Action Plan') {
        inSubtasks = false
        inActionPlan = false
        continue
      }

      // Parse subtask items
      if (inSubtasks && line.startsWith('- [ ]')) {
        const title = line.replace('- [ ]', '').trim()
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
        const description = nextLine.startsWith('- ') ? nextLine.replace('- ', '') : ''
        const categoryLine = i + 2 < lines.length ? lines[i + 2].trim() : ''
        const category = categoryLine.startsWith('- _') ? categoryLine.replace('- _', '').replace('_', '') : 'General'
        
        subtasks.push({ title, description, category, completed: false })
      }

      // Parse action plan items
      if (inActionPlan && /^\d+\.\s\*\*/.test(line)) {
        const match = line.match(/^\d+\.\s\*\*(.+?)\*\*/)
        if (match) {
          const title = match[1]
          const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
          const description = nextLine.startsWith('- ') ? nextLine.replace('- ', '') : ''
          const durationLine = i + 2 < lines.length ? lines[i + 2].trim() : ''
          const durationMatch = durationLine.match(/_Estimated: (.+?)_/)
          const duration = durationMatch ? durationMatch[1] : '1h'
          
          actionPlan.push({ title, description, duration })
        }
      }
    }

    return { subtasks, actionPlan, hasAiPlan }
  }

  const getTypeIcon = (type: WorkItem['type']) => {
    switch (type) {
      case 'FEATURE': return '⚡'
      case 'BUG': return '🐛'
      case 'EPIC': return '🎯'
      case 'STORY': return '📖'
      case 'TASK': return '✅'
      case 'SUBTASK': return '📝'
      default: return '📋'
    }
  }

  const getStatusColor = (status: WorkItem['status']) => {
    switch (status) {
      case 'PLANNED': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'TESTING': return 'bg-purple-100 text-purple-800'
      case 'DONE': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'BLOCKED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: WorkItem['priority']) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-600'
      case 'MEDIUM': return 'bg-blue-100 text-blue-600'
      case 'HIGH': return 'bg-orange-100 text-orange-600'
      case 'URGENT': return 'bg-red-100 text-red-600'
      case 'CRITICAL': return 'bg-red-200 text-red-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (!isOpen || !workItem) return null

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-border-standard shadow-xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-standard">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(workItem.type)}</span>
            <h2 className="font-semibold text-lg truncate">Work Item Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title and Status */}
          <div className="space-y-3">
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-lg font-medium"
                placeholder="Work item title..."
              />
            ) : (
              <h1 className="text-lg font-medium leading-tight">{workItem.title}</h1>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(workItem.status)}>
                {workItem.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(workItem.priority)}>
                {workItem.priority}
              </Badge>
              <Badge variant="outline">
                {workItem.functionalArea}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Description</h3>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Describe what needs to be done..."
                rows={4}
              />
            ) : (
              <div className="text-sm text-text-secondary prose prose-sm max-w-none">
                {workItem.description ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {workItem.description}
                  </ReactMarkdown>
                ) : (
                  <p>No description provided.</p>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Type</span>
                <span className="flex items-center gap-1">
                  {getTypeIcon(workItem.type)}
                  {workItem.type}
                </span>
              </div>
              
              {workItem.estimatedEffort && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Estimated Effort</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {workItem.estimatedEffort}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Created</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(workItem.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Updated</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(workItem.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Git Integration */}
          {workItem.worktreeName && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Development</h3>
              <div className="p-3 bg-background-secondary rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Branch</span>
                  <span className="flex items-center gap-1 text-sm font-mono">
                    <GitBranch className="w-3 h-3" />
                    {workItem.worktreeName}
                  </span>
                </div>
                {workItem.worktreeStatus && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-text-muted">Status</span>
                    <Badge variant="outline" className="text-xs">
                      {workItem.worktreeStatus}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Planning Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">AI Planning</h3>
              {!hasAiPlan && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAiPlanning}
                  disabled={aiPlanning}
                  className="text-xs"
                >
                  {aiPlanning ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Brain className="w-3 h-3 mr-1" />
                  )}
                  {aiPlanning ? 'Planning...' : 'Generate Plan'}
                </Button>
              )}
            </div>
            
            {hasAiPlan ? (
              <div className="space-y-3">
                {/* Action Plan Preview */}
                {actionPlan.length > 0 && (
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-medium">🎯 Action Plan</h4>
                      <Badge variant="secondary" className="text-xs">
                        {actionPlan.length} steps
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {actionPlan.slice(0, 3).map((step, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="text-text-muted">{idx + 1}.</span> {step.title}
                          <span className="text-text-muted ml-2">({step.duration})</span>
                        </div>
                      ))}
                      {actionPlan.length > 3 && (
                        <div className="text-xs text-text-muted">
                          + {actionPlan.length - 3} more steps
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {subtasks.length > 0 && (
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-medium">✅ Subtasks</h4>
                      <Badge variant="secondary" className="text-xs">
                        {subtasks.length} tasks
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {subtasks.slice(0, 4).map((task, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <CheckSquare className="w-3 h-3 mt-0.5 text-text-muted" />
                          <div>
                            <div>{task.title}</div>
                            <div className="text-text-muted">{task.category}</div>
                          </div>
                        </div>
                      ))}
                      {subtasks.length > 4 && (
                        <div className="text-xs text-text-muted">
                          + {subtasks.length - 4} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs w-full"
                  onClick={() => onViewFullPlan?.(workItem)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Full Plan
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-background-secondary rounded-lg">
                <p className="text-xs text-text-muted">
                  {aiPlanning 
                    ? '🤖 AI is analyzing your project context and generating a detailed plan...'
                    : '💡 Generate a detailed action plan and subtasks with AI using your project context'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Actions</h3>
            <div className="space-y-2">
              {onOpenDevelopmentChat && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => onOpenDevelopmentChat(workItem)}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Development Chat
                </Button>
              )}
              <Button variant="outline" size="sm" className="w-full justify-start">
                <GitBranch className="w-4 h-4 mr-2" />
                Create Branch
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Comment
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CheckSquare className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="p-4 border-t border-border-standard">
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}