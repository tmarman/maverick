'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  FileText, 
  Calendar, 
  User, 
  Flag, 
  Clock,
  GitBranch,
  MessageSquare,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react'
import { HierarchicalTodo, hierarchicalTodoClientService } from '@/lib/hierarchical-todos-client'
import { toast } from '@/hooks/use-toast'

interface TaskFullDetailViewProps {
  todo: HierarchicalTodo
  projectName: string
  onBack: () => void
  onUpdate?: (todo: HierarchicalTodo) => void
  className?: string
}

export function TaskFullDetailView({ 
  todo, 
  projectName, 
  onBack, 
  onUpdate,
  className = ''
}: TaskFullDetailViewProps) {
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editingMode, setEditingMode] = useState(false)
  const [subtasks, setSubtasks] = useState<HierarchicalTodo[]>([])
  const [showSubtasks, setShowSubtasks] = useState(true)

  useEffect(() => {
    loadFullTaskDetails()
    loadSubtasks()
  }, [todo.id, projectName])

  const loadFullTaskDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectName}/hierarchical-todos/${todo.id}/markdown`)
      
      if (response.ok) {
        const data = await response.json()
        setMarkdownContent(data.markdown || '')
      } else {
        toast({
          title: 'Failed to load task details',
          description: 'Could not load the full task documentation',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading task details:', error)
      toast({
        title: 'Error loading task',
        description: 'An error occurred while loading task details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSubtasks = async () => {
    try {
      const children = await hierarchicalTodoClientService.getChildTodos(projectName, todo.id)
      setSubtasks(children)
    } catch (error) {
      console.error('Failed to load subtasks:', error)
    }
  }

  const saveMarkdown = async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}/hierarchical-todos/${todo.id}/markdown`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: markdownContent })
      })

      if (response.ok) {
        setEditingMode(false)
        toast({
          title: 'Task updated',
          description: 'Full task documentation saved successfully'
        })
      } else {
        toast({
          title: 'Save failed',
          description: 'Could not save the task documentation',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast({
        title: 'Save error',
        description: 'An error occurred while saving',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: HierarchicalTodo['status']) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'IN_PROGRESS':
        return <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'IN_REVIEW':
        return <MessageSquare className="w-5 h-5 text-purple-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: HierarchicalTodo['status']) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'IN_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'DEFERRED':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: HierarchicalTodo['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Loading Task Details...</CardTitle>
          </div>
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
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              {getStatusIcon(todo.status)}
              <CardTitle className="text-xl">{todo.title}</CardTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {editingMode ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingMode(false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={saveMarkdown}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditingMode(true)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Task Metadata */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Badge className={`${getStatusColor(todo.status)} border transition-all duration-150`}>
            {todo.status.replace('_', ' ').toLowerCase()}
          </Badge>
          
          <Badge className={`${getPriorityColor(todo.priority)} border transition-all duration-150`}>
            <Flag className="w-3 h-3 mr-1" />
            {todo.priority.toLowerCase()}
          </Badge>
          
          {todo.estimatedEffort && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Clock className="w-3 h-3 mr-1" />
              {todo.estimatedEffort}
            </Badge>
          )}
          
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            {todo.functionalArea.toLowerCase()}
          </Badge>
          
          {todo.type !== 'TASK' && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {todo.type.toLowerCase()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Task Documentation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium">Full Documentation</h3>
            </div>

            {editingMode ? (
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your task documentation in Markdown format..."
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                {markdownContent ? (
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border text-sm">
                    {markdownContent}
                  </pre>
                ) : (
                  <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border">
                    No detailed documentation available. Click Edit to add structured documentation.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtasks Section */}
          {(subtasks.length > 0 || todo.depth === 0) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {showSubtasks ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  Subtasks ({subtasks.length})
                </button>
              </div>

              {showSubtasks && (
                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      {getStatusIcon(subtask.status)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            subtask.status === 'DONE' ? 'line-through text-gray-500' : ''
                          }`}>
                            {subtask.title}
                          </span>
                          
                          {subtask.priority === 'HIGH' && (
                            <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                              High
                            </Badge>
                          )}
                          
                          {subtask.estimatedEffort && (
                            <Badge variant="outline" className="text-xs">
                              {subtask.estimatedEffort}
                            </Badge>
                          )}
                        </div>
                        
                        {subtask.description && (
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {subtask.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {subtasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No subtasks yet</p>
                      <p className="text-sm">Break this task down into smaller steps</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Task Metadata */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Created</h4>
              <p className="text-sm text-gray-600">
                {new Date(todo.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Last Updated</h4>
              <p className="text-sm text-gray-600">
                {new Date(todo.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            {todo.depth > 0 && (
              <>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Hierarchy Level</h4>
                  <p className="text-sm text-gray-600">Level {todo.depth}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Task Type</h4>
                  <p className="text-sm text-gray-600">
                    {todo.depth > 0 ? 'Subtask' : 'Parent Task'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskFullDetailView