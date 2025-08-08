'use client'

import { useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import ProjectShell from '@/components/CockpitShell'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MaverickMarkdownRenderer } from '@/components/MaverickMarkdownRenderer'
import { 
  Send, 
  Bot,
  User,
  Rocket,
  AlertCircle,
  CheckSquare,
  Clock,
  PlayCircle
} from 'lucide-react'

interface Message {
  id: string
  role: 'human' | 'assistant'
  content: string
  timestamp: string
  agentRole?: string
}

interface TodoItem {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  priority?: 'high' | 'medium' | 'low'
}

export default function BootstrapPage() {
  const params = useParams()
  const projectName = params.name as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [todos, setTodos] = useState<TodoItem[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize interface
  useEffect(() => {
    console.log('🚀 Bootstrap interface ready for project:', projectName)
    
    // Load conversation history from localStorage
    const storageKey = `maverick-bootstrap-history-${projectName}`
    const existingHistory = localStorage.getItem(storageKey)
    if (existingHistory) {
      try {
        const parsedHistory = JSON.parse(existingHistory)
        console.log('📜 Loaded', parsedHistory.length, 'messages from history')
        setMessages(parsedHistory)
      } catch (error) {
        console.error('❌ Error parsing stored history:', error)
      }
    }
    
    setSessionId(`bootstrap-${projectName}-${Date.now().toString().slice(-8)}`)
    
    // Initialize todos
    setTodos([
      {
        id: 'bootstrap-ready',
        content: 'Bootstrap interface initialized',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'chat-ready',
        content: 'Ready to chat with Claude Code CLI',
        status: 'pending',
        priority: 'high'
      }
    ])
  }, [projectName])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'human', 
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)
    setError(null)

    // Store in localStorage
    const storageKey = `maverick-bootstrap-history-${projectName}`
    localStorage.setItem(storageKey, JSON.stringify(newMessages))

    try {
      const response = await fetch(`/api/projects/${projectName}/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: newMessages,
          user: 'tim',
          project: projectName,
          mode: 'bootstrap',
          sessionId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'Response received',
          timestamp: new Date().toISOString(),
          agentRole: 'Bootstrap Agent'
        }

        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages))
        
        // Update session if provided
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId)
        }
        
      } else {
        throw new Error(`Bootstrap request failed: ${response.status}`)
      }
      
    } catch (error) {
      console.error('❌ Error communicating with Bootstrap Agent:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Bootstrap Agent Error**\n\nI encountered an issue while processing your request.\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        agentRole: 'Error Handler'
      }
      
      const updatedMessages = [...newMessages, errorMessage]
      setMessages(updatedMessages)
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages))
      
    } finally {
      setIsStreaming(false)
    }
  }

  const sidebarContent = (
    <ProjectTreeSidebar 
      project={{ 
        id: projectName, 
        name: projectName, 
        description: 'AI-powered development workspace',
        type: 'software',
        status: 'active'
      }} 
      currentPage="bootstrap" 
    />
  )

  return (
    <ProjectShell 
      title={`${projectName} • Chat`}
      sidebarContent={sidebarContent}
    >
      <div className="h-full flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium">Bootstrap Error</div>
                  <div className="text-sm mt-1">{error}</div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 h-6 text-xs border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {messages.length === 0 && (
              <div className="text-center py-12">
                <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Build {projectName}</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Start a conversation with Claude to build features, debug issues, or plan your next development steps.
                </p>
              </div>
            )}

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
                      {message.role === 'human' ? 'Tim' : message.agentRole || 'Bootstrap Agent'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <MaverickMarkdownRenderer 
                      markdown={message.content}
                      context={{
                        projectName,
                        userRole: message.role === 'human' ? 'owner' : 'agent'
                      }}
                    />
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
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="text-sm font-medium">Bootstrap Agent is processing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-none border-t border-gray-200 bg-white p-6">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Chat with Claude about ${projectName} development...`}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isStreaming}
                className="flex-1"
              />
              <Button 
                onClick={handleSend} 
                disabled={isStreaming || !input.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Tasks & Info */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 space-y-4">
          {/* Session Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Rocket className="w-4 h-4 text-blue-600" />
                Session Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </Badge>
              </div>
              {sessionId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Session:</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {sessionId.slice(-8)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bootstrap Tasks */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="w-4 h-4 text-green-600" />
                Active Tasks
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-start gap-2 p-2 rounded border hover:bg-white">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    todo.status === 'completed' ? 'bg-green-500' :
                    todo.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${
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
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PlayCircle className="w-4 h-4 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Clock className="w-3 h-3 mr-2" />
                View Recent Changes
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <CheckSquare className="w-3 h-3 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProjectShell>
  )
}