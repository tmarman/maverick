'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  FileText, 
  Edit3, 
  CheckSquare, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Bot,
  User,
  Settings,
  Code,
  Eye,
  GitBranch,
  Clock,
  PlayCircle,
  Lightbulb,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'human' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  agentRole?: string
}

interface ToolCall {
  id: string
  name: string
  parameters: any
  result?: any
  status: 'executing' | 'completed' | 'error'
  timestamp: string
}

interface Artifact {
  id: string
  name: string
  type: 'work_item' | 'code_file' | 'todo_list'
  content: string
  lastModified: string
}

interface QuestionThread {
  id: string
  question: string
  messages: Message[]
  status: 'open' | 'resolved'
  priority: 'high' | 'medium' | 'low'
}

interface TodoItem {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  assignedTo?: string
  priority?: 'high' | 'medium' | 'low'
}

interface ConversationCapture {
  fullTranscript: string
  toolCalls: ToolCall[]
  artifacts: Artifact[]
  decisions: string[]
  nextSteps: string[]
}

export default function ProjectChat() {
  const params = useParams()
  const projectName = params.name as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [questionThreads, setQuestionThreads] = useState<QuestionThread[]>([])
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [currentAgentRole, setCurrentAgentRole] = useState<string>('Planning Agent')
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [conversationCapture, setConversationCapture] = useState<ConversationCapture>({
    fullTranscript: '',
    toolCalls: [],
    artifacts: [],
    decisions: [],
    nextSteps: []
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with conversation context
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to the AI Orchestration Chat for **${projectName}**! This is where you can collaborate with specialized AI agents to plan, build, and manage your project features.

I'm your **Planning Agent**, ready to help you break down ideas into implementable tasks, create technical specifications, and coordinate with other specialized agents.

What would you like to work on today?`,
        timestamp: new Date().toISOString(),
        agentRole: 'Planning Agent'
      }
    ]
    
    setMessages(initialMessages)
    
    // Initialize todos for this project
    setTodos([
      {
        id: 'ai-orchestration-setup',
        content: 'Set up AI orchestration chat interface',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'claude-cli-integration',
        content: 'Connect to Claude Code CLI session',
        status: 'in_progress',
        priority: 'high'
      },
      {
        id: 'agent-specialization',
        content: 'Implement specialized agent roles',
        status: 'pending',
        priority: 'medium'
      }
    ])

    // Sample artifacts for this project
    setArtifacts([
      {
        id: 'project-spec',
        name: `${projectName} Specification`,
        type: 'work_item',
        content: 'Project requirements and technical specifications...',
        lastModified: new Date().toISOString()
      }
    ])

    // Sample question threads
    setQuestionThreads([
      {
        id: 'tech-approach',
        question: 'What technical approach should we take for this project?',
        messages: [],
        status: 'open',
        priority: 'high'
      }
    ])
  }, [projectName])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'human',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    try {
      // Send to our API route that interfaces with Claude Code CLI
      const response = await fetch(`/api/projects/${projectName}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_history: messages.slice(-10),
          project_name: projectName
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Claude Code')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        agentRole: data.agentRole || currentAgentRole,
        toolCalls: data.toolCalls || []
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Update todos if TodoWrite was called
      if (data.toolCalls?.some((tool: ToolCall) => tool.name === 'TodoWrite')) {
        console.log('TodoWrite called, should update todos')
      }
      
    } catch (error) {
      console.error('Error communicating with Claude Code:', error)
      
      // Fallback to demonstration mode
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about: "${input}". 

For the ${projectName} project, this would trigger:
1. **Analysis** of your request in the context of the project
2. **Tool calls** to read relevant files or update project state  
3. **Specialized agent coordination** if needed (Spec Writer, Implementation, etc.)
4. **Concrete next steps** and task creation

*Currently in demo mode while Claude Code CLI integration is being finalized.*`,
        timestamp: new Date().toISOString(),
        agentRole: currentAgentRole,
        toolCalls: [
          {
            id: `demo-${Date.now()}`,
            name: 'TodoWrite',
            parameters: { todos: [`Analyze request for ${projectName} project`] },
            status: 'completed',
            timestamp: new Date().toISOString(),
            result: 'Todo added to project backlog'
          }
        ]
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsStreaming(false)
    }
  }

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'Read': return <Eye className="w-4 h-4" />
      case 'Edit': return <Edit3 className="w-4 h-4" />
      case 'TodoWrite': return <CheckSquare className="w-4 h-4" />
      case 'Write': return <FileText className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getToolColor = (toolName: string) => {
    switch (toolName) {
      case 'Read': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Edit': return 'bg-green-100 text-green-800 border-green-200'
      case 'TodoWrite': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Write': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/projects/${projectName}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Project
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Orchestration Chat</h1>
                <p className="text-sm text-gray-600">Project: {projectName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center gap-2">
                <Bot className="w-3 h-3" />
                {currentAgentRole}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Active Session</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Main Conversation */}
          <div className="col-span-3">
            <Card className="h-full flex flex-col shadow-sm">
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        {message.role === 'human' ? (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {message.role === 'human' ? 'You' : message.agentRole || 'Assistant'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="prose prose-sm max-w-none">
                          <div className="text-gray-800 whitespace-pre-wrap">
                            {message.content}
                          </div>
                          
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Tool Actions
                              </p>
                              {message.toolCalls.map((toolCall) => (
                                <div 
                                  key={toolCall.id} 
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getToolColor(toolCall.name)}`}
                                >
                                  {getToolIcon(toolCall.name)}
                                  <span>{toolCall.name}</span>
                                  {toolCall.status === 'completed' && (
                                    <CheckSquare className="w-4 h-4" />
                                  )}
                                  {toolCall.status === 'executing' && (
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isStreaming && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                          <span className="text-sm font-medium">Agent is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="border-t border-gray-200 p-6">
                  <div className="flex gap-3">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe what you want to build or ask for help..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={isStreaming}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={isStreaming || !input.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1 space-y-4">
            {/* Active Todos */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  Active Tasks
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {todos.map((todo) => (
                  <div 
                    key={todo.id} 
                    className={`p-3 rounded-lg border ${
                      todo.status === 'completed' ? 'bg-green-50 border-green-200' :
                      todo.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-3 h-3 rounded-full ${
                        todo.status === 'completed' ? 'bg-green-500' :
                        todo.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {todo.content}
                        </p>
                        {todo.priority && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 ${
                              todo.priority === 'high' ? 'border-red-300 text-red-600' :
                              todo.priority === 'medium' ? 'border-yellow-300 text-yellow-600' :
                              'border-gray-300 text-gray-600'
                            }`}
                          >
                            {todo.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <PlayCircle className="w-4 h-4 mx-auto mb-1" />
                  New tasks will appear here
                </button>
              </CardContent>
            </Card>

            {/* Question Threads */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Questions ({questionThreads.filter(t => t.status === 'open').length})
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3 max-h-48 overflow-y-auto">
                {questionThreads.map((thread) => (
                  <div key={thread.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleThread(thread.id)}
                      className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={thread.status === 'resolved' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {thread.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {thread.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {thread.question}
                        </p>
                      </div>
                      {expandedThreads.has(thread.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedThreads.has(thread.id) && (
                      <div className="border-t p-3 bg-gray-50 space-y-2">
                        {thread.messages.length > 0 ? (
                          thread.messages.map((msg) => (
                            <div key={msg.id} className="text-sm">
                              <span className="font-medium text-gray-800">{msg.agentRole}:</span>
                              <p className="text-gray-700 mt-1">{msg.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Ready for discussion</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {questionThreads.length === 0 && (
                  <div className="text-center py-6">
                    <Lightbulb className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Questions will appear here as we collaborate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Artifacts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Created Files
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {artifacts.map((artifact) => (
                  <div key={artifact.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      {artifact.type === 'work_item' && <FileText className="w-4 h-4 text-blue-500" />}
                      {artifact.type === 'code_file' && <Code className="w-4 h-4 text-green-500" />}
                      {artifact.type === 'todo_list' && <CheckSquare className="w-4 h-4 text-purple-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{artifact.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(artifact.lastModified).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {artifacts.length === 0 && (
                  <div className="text-center py-6">
                    <GitBranch className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Files will appear as they're created
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}