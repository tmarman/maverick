'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Send,
  Bot,
  User,
  CheckCircle,
  Clock,
  PlayCircle,
  ArrowRight,
  Filter,
  Plus,
  Brain,
  Zap,
  Target,
  AlertTriangle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { MentionText, MentionInput } from '@/components/MentionText'
import { defaultProjectUsers, getMentionedUsers, formatMentionsForStorage } from '@/lib/username-mentions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  workItemsGenerated?: string[]
  mentionedUsers?: string[]
}

interface TaskItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'TASK' | 'SUBTASK'
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | 'DEFERRED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
  duration?: string
  createdAt: Date
  needsAction?: boolean
  chatMessageId?: string
  mentionedUsers?: string[]
}

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
}

interface VibeChatProps {
  project: Project
  className?: string
}

export function VibeChat({ project, className }: VibeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [taskFilter, setTaskFilter] = useState<'all' | 'in_progress' | 'needs_action' | 'planned' | 'deferred'>('all')
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load existing work items and convert to tasks
    loadExistingTasks()
    
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hey! 👋 I'm here to help you build ${project.name}. Just tell me what you're thinking about, what needs to be done, or any ideas you have. I'll help organize everything into actionable tasks and features.

Try saying something like:
• "I need to fix the user login flow"
• "Let's add a dashboard for analytics" 
• "The mobile app is running slow"
• "I want to integrate with Stripe"`,
      timestamp: new Date()
    }])
  }, [project.name])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadExistingTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${project.name}/work-items`)
      if (response.ok) {
        const data = await response.json()
        const convertedTasks: TaskItem[] = data.workItems?.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status === 'ACTIVE' ? 'IN_PROGRESS' : item.status,
          priority: item.priority,
          category: item.category || item.functionalArea || 'General',
          duration: item.estimatedEffort,
          createdAt: new Date(item.createdAt),
          needsAction: item.status === 'PLANNED' || item.status === 'BLOCKED'
        })) || []
        
        setTasks(convertedTasks)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const handleTaskSelect = (task: TaskItem) => {
    setSelectedTask(task)
    // Context is now displayed in the UI below without adding chat messages
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    // Process mentions and format for storage
    const formattedContent = formatMentionsForStorage(inputText.trim(), defaultProjectUsers)
    const mentionedUsers = getMentionedUsers(inputText.trim(), defaultProjectUsers)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: formattedContent,
      timestamp: new Date(),
      mentionedUsers: mentionedUsers.map(u => u.username)
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Build request body with optional selected task context
      const requestBody = {
        description: userMessage.content,
        chatMode: true,
        projectContext: project,
        existingTasks: tasks.slice(0, 10),
        conversationHistory: messages.slice(-3),
        mentionedUsers: userMessage.mentionedUsers,
        // Include selected task context if available
        ...(selectedTask && {
          selectedTaskContext: {
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            type: selectedTask.type,
            status: selectedTask.status,
            priority: selectedTask.priority,
            category: selectedTask.category
          }
        })
      }

      // Use the working smart-create endpoint with chat mode
      const response = await fetch(`/api/projects/${project.name}/work-items/smart-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Vibe chat response:', data) // Debug log
        
        // Create assistant response
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.assistantResponse || "I've analyzed your request and created some tasks. Check the panel on the right to see what I've organized for you!",
          timestamp: new Date(),
          workItemsGenerated: data.workItemsCreated?.map((item: any) => item.id) || []
        }

        setMessages(prev => [...prev, assistantMessage])

        // Add new tasks to the task list
        if (data.workItemsCreated?.length > 0) {
          const newTasks: TaskItem[] = data.workItemsCreated.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type,
            status: item.status || 'PLANNED',
            priority: item.priority || 'MEDIUM',
            category: item.category || 'General',
            duration: item.estimatedEffort,
            createdAt: new Date(),
            needsAction: true,
            chatMessageId: userMessage.id,
            mentionedUsers: userMessage.mentionedUsers
          }))
          
          setTasks(prev => [...newTasks, ...prev])
          
          toast({
            title: 'Tasks created!',
            description: `Generated ${newTasks.length} new tasks from your message`
          })
        }
      } else {
        console.error('Vibe chat API error:', response.status, await response.text())
        // Fallback response
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I understand what you're looking for. Let me break that down into actionable tasks. What specific aspect would you like to tackle first?",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing that right now. Could you try rephrasing or breaking it down into smaller pieces?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'PLANNED':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4 text-blue-500" />
      case 'IN_REVIEW':
        return <ArrowRight className="w-4 h-4 text-yellow-500" />
      case 'DONE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'BLOCKED':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'DEFERRED':
        return <ArrowRight className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TaskItem['status']) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'DONE':
        return 'bg-green-100 text-green-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      case 'DEFERRED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-600'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-600'
      case 'HIGH':
        return 'bg-orange-100 text-orange-600'
      case 'URGENT':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getTypeIcon = (type: TaskItem['type']) => {
    switch (type) {
      case 'FEATURE':
        return <Zap className="w-4 h-4 text-blue-500" />
      case 'BUG':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'TASK':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'SUBTASK':
        return <Target className="w-4 h-4 text-purple-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredTasks = tasks.filter(task => {
    switch (taskFilter) {
      case 'in_progress':
        return task.status === 'IN_PROGRESS'
      case 'needs_action':
        return task.needsAction || task.status === 'PLANNED' || task.status === 'BLOCKED'
      case 'planned':
        return task.status === 'PLANNED'
      case 'deferred':
        return task.status === 'DEFERRED'
      default:
        return true
    }
  })

  // Sort tasks: in progress first, then needs action, then by priority and date
  const sortedTasks = filteredTasks.sort((a, b) => {
    if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1
    if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1
    if (a.needsAction && !b.needsAction) return -1
    if (b.needsAction && !a.needsAction) return 1
    
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    const aPriority = priorityOrder[a.priority] || 2
    const bPriority = priorityOrder[b.priority] || 2
    
    if (aPriority !== bPriority) return bPriority - aPriority
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className={`h-full flex ${className} overflow-hidden`}>
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Project Vibe
              <Badge variant="secondary">{messages.length - 1} messages</Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.workItemsGenerated && message.workItemsGenerated.length > 0 && (
                      <div className="mt-2 text-xs opacity-75">
                        ✨ Generated {message.workItemsGenerated.length} tasks
                      </div>
                    )}
                    <div
                      className={`text-xs mt-1 opacity-75 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="border-t p-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What's on your mind? Describe what you want to build or fix..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !inputText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {/* Show mentioned users in current input */}
              {inputText && getMentionedUsers(inputText, defaultProjectUsers).length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <span>Mentioning:</span>
                  {getMentionedUsers(inputText, defaultProjectUsers).map(user => (
                    <Badge key={user.username} variant="secondary" className="text-xs">
                      @{user.username}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Show selected task context */}
              {selectedTask && (
                <div className="mt-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" />
                    <span className="font-medium">Context: {selectedTask.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTask(null)}
                      className="ml-auto h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </Button>
                  </div>
                  {selectedTask.description && (
                    <div className="text-blue-600 text-xs max-h-20 overflow-y-auto prose prose-xs prose-blue max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-1">{children}</ol>,
                          li: ({ children }) => <li className="mb-0.5">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => <code className="bg-blue-100 px-1 rounded text-xs">{children}</code>
                        }}
                      >
                        {selectedTask.description}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Panel */}
      <div className="w-80 border-l border-border-standard flex-shrink-0">
        <Card className="h-full rounded-l-none flex flex-col">
          <CardHeader className="border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Tasks & Actions</CardTitle>
              <Badge variant="secondary">{filteredTasks.length}</Badge>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-1 mt-2">
              <Button
                variant={taskFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('all')}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant={taskFilter === 'in_progress' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('in_progress')}
                className="text-xs"
              >
                Active
              </Button>
              <Button
                variant={taskFilter === 'needs_action' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('needs_action')}
                className="text-xs"
              >
                Needs Action
              </Button>
              <Button
                variant={taskFilter === 'deferred' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('deferred')}
                className="text-xs"
              >
                Deferred
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="overflow-y-auto h-full min-h-0">
              {sortedTasks.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks yet.</p>
                  <p className="text-xs">Start chatting to create some!</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskSelect(task)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTask?.id === task.id 
                          ? 'border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                          : task.needsAction 
                            ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' 
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getTypeIcon(task.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.duration && (
                              <Badge variant="outline">
                                {task.duration}
                              </Badge>
                            )}
                          </div>
                          
                          {task.needsAction && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-orange-600">Needs attention</span>
                            </div>
                          )}
                          
                          {task.mentionedUsers && task.mentionedUsers.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <div className="flex gap-1">
                                {task.mentionedUsers.map(username => (
                                  <Badge key={username} variant="outline" className="text-xs px-1 py-0">
                                    @{username}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}