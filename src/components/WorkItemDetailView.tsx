'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  GitBranch, 
  Clock, 
  Calendar,
  CheckSquare,
  Brain,
  Loader2,
  FileText,
  Target,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING'
  worktreeName?: string
  worktreeStatus?: string
  estimatedEffort?: string
  createdAt: string
  updatedAt: string
  markdownContent?: string
  projectName: string
}

interface SubTask {
  title: string
  description: string
  category: string
  priority: string
  duration: string
  completed?: boolean
}

interface Opportunity {
  title: string
  type: string
  impact: string
  effort: string
  timeline: string
  description: string
}

interface Risk {
  title: string
  severity: string
  probability: string
  description: string
  mitigation?: string
}

interface WorkItemDetailViewProps {
  workItem: WorkItem
  onBack: () => void
  onUpdate?: (workItem: WorkItem) => void
  onViewSubtask?: (subtask: SubTask, workItem: WorkItem) => void
  className?: string
}

export function WorkItemDetailView({ 
  workItem, 
  onBack, 
  onUpdate,
  onViewSubtask,
  className 
}: WorkItemDetailViewProps) {
  const [loading, setLoading] = useState(false)
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([])
  const [completedSubtasks, setCompletedSubtasks] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (workItem?.markdownContent) {
      const parsedData = parseFullMarkdownContent(workItem.markdownContent)
      setSubtasks(parsedData.subtasks)
      setOpportunities(parsedData.opportunities)
      setRisks(parsedData.risks)
      setAcceptanceCriteria(parsedData.acceptanceCriteria)
    }
  }, [workItem])

  const parseFullMarkdownContent = (markdown: string) => {
    const subtasks: SubTask[] = []
    const opportunities: Opportunity[] = []
    const risks: Risk[] = []
    const acceptanceCriteria: string[] = []

    const lines = markdown.split('\n')
    let currentSection = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Detect sections
      if (line.includes('AI-Generated Tasks')) {
        currentSection = 'tasks'
        continue
      } else if (line.includes('Identified Opportunities')) {
        currentSection = 'opportunities'
        continue
      } else if (line.includes('Potential Risks')) {
        currentSection = 'risks'
        continue
      } else if (line.includes('Acceptance Criteria')) {
        currentSection = 'acceptance'
        continue
      } else if (line.startsWith('## ') || line.startsWith('# ')) {
        currentSection = ''
        continue
      }

      // Parse tasks
      if (currentSection === 'tasks' && line.startsWith('### ')) {
        const titleMatch = line.match(/###\s+\d+\.\s+(.+)/)
        if (titleMatch) {
          const title = titleMatch[1]
          let description = ''
          let category = 'DEVELOPMENT'
          let priority = 'MEDIUM'
          let duration = '1d'

          // Look ahead for task details
          for (let j = i + 1; j < lines.length && j < i + 10; j++) {
            const nextLine = lines[j].trim()
            if (nextLine.startsWith('**Priority:**')) {
              priority = nextLine.split('**Priority:**')[1].split('|')[0].trim()
            }
            if (nextLine.startsWith('**Duration:**')) {
              duration = nextLine.split('**Duration:**')[1].split('|')[0].trim()
            }
            if (nextLine.startsWith('**Category:**')) {
              category = nextLine.split('**Category:**')[1].trim()
            }
            if (nextLine.startsWith('Build ') || nextLine.startsWith('Add ') || nextLine.startsWith('Create ')) {
              description = nextLine
            }
            if (nextLine.startsWith('### ') || nextLine.startsWith('## ')) break
          }

          subtasks.push({ title, description, category, priority, duration, completed: false })
        }
      }

      // Parse opportunities
      if (currentSection === 'opportunities' && line.startsWith('### ')) {
        const title = line.replace('### ', '')
        let type = 'FEATURE_ENHANCEMENT'
        let impact = 'MEDIUM'
        let effort = 'MEDIUM'
        let timeline = 'Next quarter'
        let description = ''

        for (let j = i + 1; j < lines.length && j < i + 8; j++) {
          const nextLine = lines[j].trim()
          if (nextLine.startsWith('**Type:**')) {
            type = nextLine.split('**Type:**')[1].split('|')[0].trim()
          }
          if (nextLine.startsWith('**Impact:**')) {
            impact = nextLine.split('**Impact:**')[1].split('|')[0].trim()
          }
          if (nextLine.startsWith('**Effort:**')) {
            effort = nextLine.split('**Effort:**')[1].split('|')[0].trim()
          }
          if (nextLine.startsWith('**Timeline:**')) {
            timeline = nextLine.split('**Timeline:**')[1].trim()
          }
          if (nextLine.startsWith('Add ') || nextLine.startsWith('Implement ')) {
            description = nextLine
          }
          if (nextLine.startsWith('### ') || nextLine.startsWith('## ')) break
        }

        opportunities.push({ title, type, impact, effort, timeline, description })
      }

      // Parse risks
      if (currentSection === 'risks' && line.startsWith('### ')) {
        const title = line.replace('### ', '')
        let severity = 'MEDIUM'
        let probability = 'MEDIUM'
        let description = ''
        let mitigation = ''

        for (let j = i + 1; j < lines.length && j < i + 8; j++) {
          const nextLine = lines[j].trim()
          if (nextLine.startsWith('**Severity:**')) {
            severity = nextLine.split('**Severity:**')[1].split('|')[0].trim()
          }
          if (nextLine.startsWith('**Probability:**')) {
            probability = nextLine.split('**Probability:**')[1].trim()
          }
          if (nextLine.startsWith('Current implementation') || nextLine.startsWith('May not scale')) {
            description = nextLine
          }
          if (nextLine.startsWith('**Mitigation Strategy:**')) {
            mitigation = nextLine.split('**Mitigation Strategy:**')[1].trim()
          }
          if (nextLine.startsWith('### ') || nextLine.startsWith('## ')) break
        }

        risks.push({ title, severity, probability, description, mitigation })
      }

      // Parse acceptance criteria
      if (currentSection === 'acceptance' && line.startsWith('- [ ]')) {
        const criterion = line.replace('- [ ]', '').trim()
        acceptanceCriteria.push(criterion)
      }
    }

    return { subtasks, opportunities, risks, acceptanceCriteria }
  }

  const getCleanMarkdownContent = (markdown: string) => {
    const lines = markdown.split('\n')
    const cleanLines: string[] = []
    let inFrontmatter = false
    let skipSection = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip YAML frontmatter
      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
          continue
        } else {
          inFrontmatter = false
          continue
        }
      }
      if (inFrontmatter) continue

      // Skip metadata sections
      if (line.startsWith('## Metadata') || 
          line.startsWith('## 📁 Implementation Details') ||
          line.startsWith('## 💬 Feature Analysis Notes') ||
          line.includes('Generated by Maverick AI') ||
          line.includes('_This is an existing Maverick platform feature_')) {
        skipSection = true
        continue
      }

      // Stop skipping when we hit a new section
      if (skipSection && line.startsWith('## ') && 
          !line.includes('Metadata') && 
          !line.includes('Implementation Details') &&
          !line.includes('Feature Analysis')) {
        skipSection = false
      }

      // Only include technical sections
      if (!skipSection && (
        line.startsWith('## 🔧 Technical Considerations') ||
        line.startsWith('## 🎢 Architecture') ||
        line.startsWith('## 🔌 Integration') ||
        line.startsWith('## 🚪 API') ||
        line.startsWith('## 📊 Performance') ||
        line.includes('Implementation') && !line.includes('Details') ||
        (!line.startsWith('## ') && cleanLines.length > 0 && !skipSection)
      )) {
        cleanLines.push(lines[i])
      } else if (line.startsWith('## 🔧 Technical Considerations')) {
        cleanLines.push(lines[i])
        skipSection = false
      }
    }

    // If no technical content found, show a clean summary
    if (cleanLines.length === 0) {
      return `## Technical Implementation

This feature involves ${workItem.type.toLowerCase()} development focusing on ${workItem.functionalArea?.toLowerCase()} functionality.

### Key Areas
- Component architecture and design patterns
- Integration with existing systems
- Performance and scalability considerations
- Testing and quality assurance

### Development Approach
- Follow established coding patterns
- Maintain backward compatibility  
- Consider security implications
- Implement proper error handling`
    }

    return cleanLines.join('\n')
  }

  const toggleSubtask = (index: number) => {
    const newCompleted = new Set(completedSubtasks)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedSubtasks(newCompleted)
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'LOW': return 'bg-gray-100 text-gray-600'
      case 'MEDIUM': return 'bg-blue-100 text-blue-600'
      case 'HIGH': return 'bg-orange-100 text-orange-600'
      case 'URGENT': return 'bg-red-100 text-red-600'
      case 'CRITICAL': return 'bg-red-200 text-red-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const completedCount = completedSubtasks.size
  const totalCount = subtasks.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-border-standard p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Board
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getTypeIcon(workItem.type)}</span>
            <Badge className={getStatusColor(workItem.status)}>
              {workItem.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">{workItem.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Created {new Date(workItem.createdAt).toLocaleDateString()}
          </span>
          {workItem.estimatedEffort && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {workItem.estimatedEffort}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {workItem.functionalArea}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          
          {/* Description */}
          {workItem.description && (
            <div>
              <h2 className="text-lg font-medium mb-3">📋 Description</h2>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {workItem.description}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Progress Overview */}
          {subtasks.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">📊 Progress Overview</h2>
              <div className="bg-background-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Task Completion</span>
                  <span className="text-sm text-text-muted">{completedCount} of {totalCount} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm text-text-muted mt-1">
                  {progressPercentage}% complete
                </div>
              </div>
            </div>
          )}

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">✅ Tasks & Subtasks</h2>
              <div className="space-y-3">
                {subtasks.map((task, index) => (
                  <div 
                    key={index} 
                    className={`border border-border-standard rounded-lg p-4 transition-all ${
                      completedSubtasks.has(index) ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSubtask(index)}
                        className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          completedSubtasks.has(index) 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {completedSubtasks.has(index) && <CheckSquare className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <button
                            onClick={() => onViewSubtask?.(task, workItem)}
                            className={`font-medium text-left hover:text-blue-600 transition-colors ${completedSubtasks.has(index) ? 'line-through text-text-muted' : ''}`}
                          >
                            {task.title}
                          </button>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge className={getPriorityColor(task.priority)} size="sm">
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {task.duration}
                            </Badge>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className={`text-sm mt-1 ${completedSubtasks.has(index) ? 'text-text-muted' : 'text-text-secondary'}`}>
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" size="sm">
                            {task.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          {acceptanceCriteria.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">🎯 Acceptance Criteria</h2>
              <div className="bg-background-secondary rounded-lg p-4">
                <ul className="space-y-2">
                  {acceptanceCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-blue-500" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">🚀 Opportunities</h2>
              <div className="space-y-3">
                {opportunities.map((opportunity, index) => (
                  <div key={index} className="border border-border-standard rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{opportunity.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">{opportunity.impact} Impact</Badge>
                        <Badge variant="outline" size="sm">{opportunity.effort} Effort</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{opportunity.description}</p>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-text-muted">{opportunity.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">⚠️ Risks & Mitigation</h2>
              <div className="space-y-3">
                {risks.map((risk, index) => (
                  <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{risk.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800" size="sm">
                          {risk.severity} Severity
                        </Badge>
                        <Badge variant="outline" size="sm">{risk.probability} Probability</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{risk.description}</p>
                    {risk.mitigation && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                        <span className="text-sm text-text-muted">{risk.mitigation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Git Integration */}
          {workItem.worktreeName && (
            <div>
              <h2 className="text-lg font-medium mb-3">🔧 Development</h2>
              <div className="bg-background-secondary rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-mono text-sm">{workItem.worktreeName}</span>
                  </div>
                  {workItem.worktreeStatus && (
                    <Badge variant="outline">
                      {workItem.worktreeStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Full Markdown Content */}
          {workItem.markdownContent && (
            <div>
              <h2 className="text-lg font-medium mb-3">📄 Technical Considerations</h2>
              <div className="border border-border-standard rounded-lg p-6 bg-white">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {getCleanMarkdownContent(workItem.markdownContent)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}