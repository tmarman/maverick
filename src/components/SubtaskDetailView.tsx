'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  CheckSquare,
  Clock,
  Target,
  FileText,
  User,
  Calendar
} from 'lucide-react'

interface SubTask {
  title: string
  description: string
  category: string
  priority: string
  duration: string
  completed?: boolean
}

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'BLOCKED'
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

interface SubtaskDetailViewProps {
  subtask: SubTask
  parentWorkItem: WorkItem
  onBack: () => void
  onBackToBoard: () => void
  className?: string
}

export function SubtaskDetailView({ 
  subtask, 
  parentWorkItem,
  onBack, 
  onBackToBoard,
  className 
}: SubtaskDetailViewProps) {
  const [isCompleted, setIsCompleted] = useState(subtask.completed || false)

  const toggleCompletion = () => {
    setIsCompleted(!isCompleted)
    // TODO: Save completion status to parent work item
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'LOW':
        return 'bg-gray-100 text-gray-600'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-600'
      case 'HIGH':
        return 'bg-orange-100 text-orange-600'
      case 'URGENT':
        return 'bg-red-100 text-red-600'
      case 'CRITICAL':
        return 'bg-red-200 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'development':
        return '💻'
      case 'design':
        return '🎨'
      case 'testing':
        return '🧪'
      case 'documentation':
        return '📚'
      case 'planning':
        return '📋'
      case 'backend':
        return '⚙️'
      case 'frontend':
        return '🌐'
      default:
        return '📝'
    }
  }

  // Generate practical implementation guidance based on subtask
  const getImplementationGuidance = () => {
    const title = subtask.title.toLowerCase()
    const category = subtask.category.toLowerCase()
    
    if (category === 'development' || category === 'backend' || category === 'frontend') {
      return {
        title: '👨‍💻 Implementation Approach',
        items: [
          'Start with a simple, working version',
          'Write unit tests as you go',
          'Follow existing code patterns in the project',
          'Consider edge cases and error handling',
          'Document any new APIs or functions'
        ]
      }
    } else if (category === 'testing') {
      return {
        title: '🧪 Testing Strategy',
        items: [
          'Cover happy path scenarios first',
          'Test edge cases and error conditions', 
          'Include integration tests for API endpoints',
          'Verify user experience flows',
          'Check performance under load'
        ]
      }
    } else if (category === 'design') {
      return {
        title: '🎨 Design Considerations',
        items: [
          'Ensure consistency with existing UI patterns',
          'Consider mobile and responsive layouts',
          'Test with real data and content',
          'Verify accessibility standards',
          'Get feedback from users early'
        ]
      }
    } else if (category === 'documentation') {
      return {
        title: '📚 Documentation Best Practices',
        items: [
          'Write for your audience (technical vs. non-technical)',
          'Include practical examples and code snippets',
          'Keep it up-to-date with code changes',
          'Make it searchable and well-organized',
          'Include troubleshooting guides'
        ]
      }
    } else {
      return {
        title: '📋 General Approach',
        items: [
          'Break down complex work into smaller steps',
          'Set up clear success criteria',
          'Get early feedback and iterate',
          'Document decisions and trade-offs',
          'Plan for maintenance and updates'
        ]
      }
    }
  }

  const implementationGuidance = getImplementationGuidance()

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-border-standard p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {parentWorkItem.title}
          </Button>
          <Button variant="ghost" size="sm" onClick={onBackToBoard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Board
          </Button>
        </div>
        
        <div className="flex items-start gap-4">
          <button
            onClick={toggleCompletion}
            className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
              isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {isCompleted && <CheckSquare className="w-4 h-4" />}
          </button>
          
          <div className="flex-1">
            <h1 className={`text-2xl font-semibold mb-2 ${isCompleted ? 'line-through text-text-muted' : ''}`}>
              {getCategoryIcon(subtask.category)} {subtask.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Part of {parentWorkItem.title}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {subtask.duration}
              </span>
              <Badge className={getPriorityColor(subtask.priority)}>
                {subtask.priority} Priority
              </Badge>
              <Badge variant="secondary">
                {subtask.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          
          {/* Description */}
          <div>
            <h2 className="text-lg font-medium mb-3">📋 What needs to be done</h2>
            <div className="bg-background-secondary rounded-lg p-4">
              <p className="text-text-secondary leading-relaxed">
                {subtask.description || 'No detailed description provided.'}
              </p>
            </div>
          </div>

          {/* Parent Context */}
          <div>
            <h2 className="text-lg font-medium mb-3">🔗 Context</h2>
            <div className="border border-border-standard rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {parentWorkItem.type === 'FEATURE' ? '⚡' : 
                   parentWorkItem.type === 'BUG' ? '🐛' : '✅'}
                </span>
                <h3 className="font-medium">{parentWorkItem.title}</h3>
              </div>
              <p className="text-sm text-text-secondary">
                {parentWorkItem.description || 'This subtask is part of the work item above.'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {parentWorkItem.type}
                </Badge>
                <Badge variant="outline">
                  {parentWorkItem.priority}
                </Badge>
                {parentWorkItem.estimatedEffort && (
                  <Badge variant="outline">
                    {parentWorkItem.estimatedEffort}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Implementation Guidance */}
          <div>
            <h2 className="text-lg font-medium mb-3">{implementationGuidance.title}</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="space-y-2">
                {implementationGuidance.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <h2 className="text-lg font-medium mb-3">🎯 Definition of Done</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 border border-border-standard rounded-lg">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm">Task is completed as described</span>
              </div>
              <div className="flex items-center gap-2 p-3 border border-border-standard rounded-lg">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm">Changes are tested and working</span>
              </div>
              <div className="flex items-center gap-2 p-3 border border-border-standard rounded-lg">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm">Documentation is updated if needed</span>
              </div>
              <div className="flex items-center gap-2 p-3 border border-border-standard rounded-lg">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm">Code follows project standards</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h2 className="text-lg font-medium mb-3">🚀 Getting Started</h2>
            <div className="bg-green-50 rounded-lg p-4">
              <ol className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                  <span>Review the context and requirements carefully</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                  <span>Set up your development environment</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                  <span>Break this down further if it's still too complex</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                  <span>Start with the simplest working solution</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">5</span>
                  <span>Test thoroughly and mark as complete</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Git Integration */}
          {parentWorkItem.worktreeName && (
            <div>
              <h2 className="text-lg font-medium mb-3">🔧 Development Branch</h2>
              <div className="bg-background-secondary rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{parentWorkItem.worktreeName}</span>
                  {parentWorkItem.worktreeStatus && (
                    <Badge variant="outline">
                      {parentWorkItem.worktreeStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Work on this subtask should be done in the branch above
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}