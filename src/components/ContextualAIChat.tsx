'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bot, 
  Send, 
  X, 
  ChevronDown, 
  MessageCircle,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target
} from 'lucide-react'
import { MaverickMarkdownRenderer } from '@/components/MaverickMarkdownRenderer'

interface ContextualAIChatProps {
  context: {
    type: 'project-tasks' | 'single-task' | 'team' | 'general' | 'feature-planning'
    projectName: string
    data?: any // Task data, team data, etc.
    workItems?: any[] // For project-level analysis
  }
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'advice' | 'suggestion' | 'analysis'
}

export function ContextualAIChat({ context, isOpen, onClose, className }: ContextualAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat()
    }
  }, [isOpen, context])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeChat = async () => {
    setIsAnalyzing(true)
    
    // Generate initial analysis based on context
    const initialAnalysis = await generateContextualAnalysis()
    
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: getContextIntro(),
      timestamp: new Date(),
      type: 'advice'
    }

    const analysisMessage: ChatMessage = {
      id: `analysis-${Date.now()}`,
      role: 'assistant', 
      content: initialAnalysis,
      timestamp: new Date(),
      type: 'analysis'
    }

    setMessages([systemMessage, analysisMessage])
    setIsAnalyzing(false)
  }

  const getContextIntro = (): string => {
    switch (context.type) {
      case 'project-tasks':
        return `🎯 **Project Tasks Analysis**\n\nI'm analyzing your current roadmap for **${context.projectName}** to provide strategic advice on task prioritization, workflow optimization, and potential improvements.`
      
      case 'single-task':
        const task = context.data
        const taskTitle = task?.title || 'this task'
        return `🚀 **Feature Planning: ${taskTitle}**\n\nI'm creating a comprehensive implementation plan including subtasks, estimates, risk assessment, and resource requirements. This will break down the feature into actionable steps.`
      
      case 'team':
        return `👥 **Team Optimization**\n\nI'm analyzing your team composition and suggesting improvements for collaboration, role assignments, and productivity.`
      
      default:
        return `🤖 **AI Assistant**\n\nI'm here to help with contextual advice for your project.`
    }
  }

  const generateContextualAnalysis = async (): Promise<string> => {
    // Simulate API call for AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    switch (context.type) {
      case 'project-tasks':
        return generateProjectTasksAnalysis()
      
      case 'single-task':
        return generateSingleTaskReview()
        
      case 'team':
        return generateTeamAnalysis()
        
      default:
        return 'I need more context to provide specific advice.'
    }
  }

  const generateProjectTasksAnalysis = (): string => {
    const workItems = context.workItems || []
    const completedItems = workItems.filter((item: any) => item.status === 'DONE').length
    const inProgressItems = workItems.filter((item: any) => item.status === 'IN_PROGRESS').length
    const plannedItems = workItems.filter((item: any) => item.status === 'PLANNED').length
    const blockedItems = workItems.filter((item: any) => item.status === 'BLOCKED').length

    return `## 📊 Roadmap Analysis

**Current Status:** ${workItems.length} total items tracked
- ✅ ${completedItems} completed
- 🔄 ${inProgressItems} in progress  
- 📋 ${plannedItems} planned
${blockedItems > 0 ? `- ⚠️ ${blockedItems} blocked` : ''}

## 💡 Strategic Recommendations

::task[Consolidate UI improvements into single worktree]{priority="high", category="Optimization", rationale="3 separate UI tasks could be combined for efficiency"}

::worktree-suggestion[frontend-optimization]{
  tasks=["responsive-navigation", "button-styling", "mobile-layout"],
  estimated_time="6-8 hours",
  rationale="These UI changes share components and can be tested together"
}

## ⚡ Quick Wins Identified

::task[Update documentation]{priority="low", category="Documentation", rationale="Several completed features need docs"}

::task[Clean up completed task branches]{priority="low", category="Maintenance", rationale="5 merged branches can be cleaned up"}

## 🎯 Focus Areas

**Next Sprint Priority:**
1. **Infrastructure** - ${workItems.filter((i: any) => i.functionalArea === 'SOFTWARE' && i.status === 'PLANNED').length} items ready
2. **User Experience** - UI improvements showing high impact potential
3. **Team Velocity** - Consider adding AI agents for routine tasks

::smart-section[Sprint Planning]{prompt="Create an optimized 2-week sprint plan based on current tasks and team capacity", body="Generate a detailed sprint plan with task assignments and timeline"}

Would you like me to dive deeper into any of these recommendations?`
  }

  const generateSingleTaskReview = (): string => {
    const task = context.data
    if (!task) return 'No task data available for review.'

    if (task.status === 'DONE') {
      return `## ✅ Task Complete: ${task.title}

**Status:** Complete ✅
**Priority:** ${task.priority}
**Effort:** ${task.estimatedEffort || 'Not tracked'}

This task appears to be finished. Consider:
::task[Create follow-up documentation]{priority="low", parent="${task.id}"}
::task[Validate user acceptance]{priority="medium", parent="${task.id}"}
::task[Archive and clean up branches]{priority="low", parent="${task.id}"}

Great work completing this feature!`
    }

    // Comprehensive Feature Planning
    return `## 🚀 Feature Planning: ${task.title}

**Current Status:** ${task.status}
**Priority:** ${task.priority}  
**Estimated Effort:** ${task.estimatedEffort || 'TBD'}

## 📋 Implementation Breakdown

### Core Tasks
::task[Design system architecture]{priority="high", parent="${task.id}", estimated_effort="2-3 hours"}
::task[Create data models and APIs]{priority="high", parent="${task.id}", estimated_effort="4-6 hours"}
::task[Implement frontend components]{priority="medium", parent="${task.id}", estimated_effort="6-8 hours"}
::task[Add comprehensive testing]{priority="medium", parent="${task.id}", estimated_effort="3-4 hours"}
::task[Integration and deployment]{priority="high", parent="${task.id}", estimated_effort="2-3 hours"}

### Quality Assurance
::task[Code review and refactoring]{priority="medium", parent="${task.id}", estimated_effort="2 hours"}
::task[Performance testing and optimization]{priority="low", parent="${task.id}", estimated_effort="2-3 hours"}
::task[Documentation and user guides]{priority="medium", parent="${task.id}", estimated_effort="1-2 hours"}

## ⚠️ Risk Assessment

**High Risk Areas:**
- **Database Integration:** May require schema changes
- **Authentication:** Security implications need careful review  
- **Performance:** Large datasets could impact load times

**Mitigation Strategies:**
::task[Create database migration plan]{priority="high", parent="${task.id}", rationale="Prevent data loss during schema updates"}
::task[Security review with team lead]{priority="high", parent="${task.id}", rationale="Ensure authentication meets security standards"}
::task[Performance benchmark baseline]{priority="medium", parent="${task.id}", rationale="Establish metrics for optimization"}

## 📊 Resource Planning

**Estimated Total Effort:** 20-27 hours
**Recommended Team Size:** 2-3 developers
**Timeline:** 1-2 weeks

**Skill Requirements:**
- Frontend development (React/TypeScript)
- Backend API development
- Database design
- Testing and QA

::smart-section[Team Assignment]{prompt="Recommend optimal team composition and task assignments based on current team capabilities", body="Analyze team skills and availability for this feature"}

## 🎯 Success Criteria

**Definition of Done:**
- [ ] All core functionality implemented
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests created
- [ ] Code reviewed and approved
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User acceptance testing passed

## 🔄 Dependencies & Blockers

::related-task[Identify prerequisite tasks]
::task[Review dependent systems]{priority="medium", parent="${task.id}", rationale="Ensure no breaking changes"}

**Potential Blockers:**
- API rate limits on external services
- Database migration timing
- Third-party library compatibility

## 🚀 Quick Wins & Optimizations  

::worktree-suggestion[${task.title.toLowerCase().replace(/\s+/g, '-')}-implementation]{
  tasks=["architecture-design", "data-models", "frontend-components"],
  estimated_time="1 week",
  rationale="Parallel development of core components for faster delivery"
}

Ready to dive into any specific aspect of this plan?`
  }

  const generateTeamAnalysis = (): string => {
    return `## 👥 Team Composition Analysis

**Current Team:** Mixed human + AI agent collaboration

## 🎯 Optimization Suggestions

::add-agent[DevOps Engineer]{specialization="CI/CD automation", rationale="Could automate deployment tasks"}
::add-agent[Technical Writer]{specialization="Documentation", rationale="Several features need documentation"}

::smart-section[Workload Analysis]{prompt="Analyze current team workload and suggest optimal task assignments", body="Review team capacity and suggest improvements"}

## 🚀 Productivity Opportunities

- **Automation Potential:** 3 routine tasks could be automated
- **Collaboration:** Consider pairing human + AI on complex tasks
- **Specialization:** Assign domain-specific work to specialist agents

Would you like specific recommendations for your team structure?`
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: generateContextualResponse(userMessage.content),
      timestamp: new Date(),
      type: 'suggestion'
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsTyping(false)
  }

  const generateContextualResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes('priority') || input.includes('important')) {
      return `Based on your current roadmap, here's my priority assessment:

## 🎯 High Priority (Do First)
::task[Fix critical navigation bug]{priority="urgent", rationale="Blocking user workflows"}
::task[Complete authentication system]{priority="high", rationale="Required for other features"}

## ⚡ Medium Priority (Do Soon)  
::task[Improve UI responsiveness]{priority="medium", rationale="User experience impact"}

::worktree-suggestion[critical-fixes]{
  tasks=["navigation-bug", "auth-system"],
  rationale="Both are blocking other work"
}

Would you like me to create a detailed priority matrix?`
    }

    if (input.includes('complete') || input.includes('done') || input.includes('finished')) {
      return `## ✅ Completion Analysis

Looking at your tasks, I found several that might be ready to close:

::task[Review completed login system]{priority="low", action="mark-complete", rationale="All acceptance criteria met"}
::task[Validate mobile layout fixes]{priority="medium", action="user-test", rationale="Technical work done, needs validation"}

::smart-section[Completion Audit]{prompt="Review all in-progress tasks and identify candidates for completion", body="Analyze task status and suggest completion actions"}

Should I help you review any specific tasks for completion?`
    }

    return `I can help you with:

- **Priority Assessment** - Ask "what's most important?"  
- **Task Review** - Ask "what can I complete?"
- **Workflow Optimization** - Ask "how can we improve?"
- **Team Planning** - Ask "who should work on what?"

::smart-section[Custom Analysis]{prompt="Provide specific advice based on: ${userInput}", body="Generate targeted recommendations"}

What specific aspect would you like to explore?`
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-end ${className}`}>
      <div className="w-full max-w-4xl mx-auto bg-white rounded-t-xl shadow-2xl transform transition-all duration-300 ease-out animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Advisor</h3>
              <p className="text-sm text-gray-600">
                {context.type === 'project-tasks' && 'Analyzing your project roadmap'}
                {context.type === 'single-task' && context.data && `Planning feature: ${context.data.title}`} 
                {context.type === 'team' && 'Optimizing team structure'}
              </p>
            </div>
            {isAnalyzing && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Analyzing...
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role !== 'user' && (
                <div className="flex items-start gap-3 max-w-3xl">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    {message.type === 'analysis' ? (
                      <TrendingUp className="w-3 h-3 text-white" />
                    ) : message.type === 'advice' ? (
                      <Lightbulb className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <MaverickMarkdownRenderer
                      markdown={message.content}
                      context={{
                        projectName: context.projectName,
                        userRole: 'admin'
                      }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </div>
              )}
              
              {message.role === 'user' && (
                <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl max-w-xs">
                  {message.content}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-3">
            <Input
              placeholder="Ask for specific advice..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isTyping}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <MessageCircle className="w-3 h-3" />
            <span>Ask about priorities, completions, optimizations, or team planning</span>
          </div>
        </div>
      </div>
    </div>
  )
}