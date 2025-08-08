'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MaverickMarkdownRenderer } from '@/components/MaverickMarkdownRenderer'
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
  ArrowLeft,
  Rocket,
  AlertCircle,
  Loader2
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

export default function MaverickBootstrap() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [questionThreads, setQuestionThreads] = useState<QuestionThread[]>([])
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [currentAgentRole, setCurrentAgentRole] = useState<string>('Bootstrap Agent')
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [claudeTerminalLogs, setClaudeTerminalLogs] = useState<string[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'connecting' | 'connected' | 'error'>('initializing')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Direct HTTP communication - no session management needed

  const handleWebSocketMessage = (terminalMessage: any) => {
    // Log all messages from Claude Terminal
    const logEntry = `[${new Date().toLocaleTimeString()}] [${terminalMessage.type?.toUpperCase() || 'UNKNOWN'}] ${terminalMessage.data || JSON.stringify(terminalMessage)}`
    setClaudeTerminalLogs(prev => [...prev.slice(-20), logEntry]) // Keep last 20 logs

    if (terminalMessage.type === 'output' && terminalMessage.data?.trim()) {
      // This is actual output from Claude Code CLI
      console.log('🤖 Claude Code CLI Output:', terminalMessage.data)
      
      if (streamingMessageId) {
        // Update the streaming message with Claude's response
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: terminalMessage.data, agentRole: 'Claude Code CLI' }
              : msg
          )
          // Persist updated history
          localStorage.setItem('maverick-bootstrap-history', JSON.stringify(updatedMessages))
          return updatedMessages
        })
        setStreamingMessageId(null)
        setIsStreaming(false)
      } else {
        // Create new message from Claude
        const claudeMessage: Message = {
          id: `claude-${Date.now()}`,
          role: 'assistant',
          content: terminalMessage.data,
          timestamp: new Date().toISOString(),
          agentRole: 'Claude Code CLI'
        }
        setMessages(prev => {
          const newMessages = [...prev, claudeMessage]
          // Persist updated history
          localStorage.setItem('maverick-bootstrap-history', JSON.stringify(newMessages))
          return newMessages
        })
      }
    }
  }

  // Initialize bootstrap interface
  useEffect(() => {
    console.log('🔄 Initializing bootstrap interface...')
    
    // Load conversation history from localStorage
    const existingHistory = localStorage.getItem('maverick-bootstrap-history')
    if (existingHistory) {
      try {
        const parsedHistory = JSON.parse(existingHistory)
        console.log('📜 Loaded', parsedHistory.length, 'messages from history')
        setMessages(parsedHistory)
      } catch (error) {
        console.error('❌ Error parsing stored history:', error)
      }
    }
    
    // Set up interface as ready - no session management needed
    console.log('✅ Bootstrap interface ready')
    setConnectionStatus('connected')
    setSessionId('bootstrap-' + Date.now().toString().slice(-8))
    setIsSessionActive(true)
    setIsConnecting(false)
    
    // Initialize current session todos
    setTodos([
      {
        id: 'bootstrap-interface',
        content: 'Create Maverick bootstrap interface',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'claude-cli-integration',
        content: 'Connect to Claude Code CLI for real-time development',
        status: 'in_progress', 
        priority: 'high'
      },
      {
        id: 'agent-framework',
        content: 'Implement specialized agent coordination system',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 'work-item-evolution',
        content: 'Apply evolution tracking to existing work items',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: 'dogfood-validation', 
        content: 'Use Maverick to build Maverick features',
        status: 'in_progress',
        priority: 'high'
      }
    ])

    // Bootstrap-specific artifacts
    setArtifacts([
      {
        id: 'ai-orchestration-spec',
        name: 'AI Orchestration System Specification',
        type: 'work_item',
        content: 'Complete specification from our planning session...',
        lastModified: new Date().toISOString()
      },
      {
        id: 'bootstrap-interface',
        name: 'Bootstrap Interface (this page)',
        type: 'code_file',
        content: 'Self-referential bootstrap interface for Maverick development...',
        lastModified: new Date().toISOString()
      }
    ])

    // Bootstrap question threads
    setQuestionThreads([
      {
        id: 'claude-integration',
        question: 'How should we integrate Claude Code CLI with the browser interface?',
        messages: [],
        status: 'open',
        priority: 'high'
      },
      {
        id: 'agent-specialization',
        question: 'What\'s the best way to implement agent role switching?',
        messages: [],
        status: 'open', 
        priority: 'high'
      },
      {
        id: 'user-qualification',
        question: 'How should we qualify worktree paths with user identification?',
        messages: [],
        status: 'open',
        priority: 'medium'
      }
    ])
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'human',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      // Persist updated history
      localStorage.setItem('maverick-bootstrap-history', JSON.stringify(newMessages))
      return newMessages
    })
    const messageToSend = input
    setInput('')
    setIsStreaming(true)
    setError(null)
    setDebugInfo(null)

    // Try WebSocket first if we have a session and connection
    if (sessionId && wsConnection?.readyState === WebSocket.OPEN) {
      console.log('🔌 Sending via WebSocket to Claude Terminal')
      
      // Create placeholder streaming message
      const streamingId = `streaming-${Date.now()}`
      setStreamingMessageId(streamingId)
      
      const streamingMessage: Message = {
        id: streamingId,
        role: 'assistant',
        content: '...',
        timestamp: new Date().toISOString(),
        agentRole: 'Claude Code CLI (Processing...)'
      }
      setMessages(prev => [...prev, streamingMessage])
      
      // Send via WebSocket
      wsConnection.send(JSON.stringify({
        type: 'input',
        data: messageToSend,
        sessionId: sessionId
      }))
      
      return
    }

    try {
      // Send to bootstrap-specific API that handles Maverick development
      const response = await fetch('/api/projects/maverick/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_history: messages.slice(-10),
          user: 'tim', // User qualification for worktree paths
          project: 'maverick',
          mode: 'bootstrap',
          sessionId: sessionId // Include current session ID for persistence
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        setDebugInfo({ 
          status: response.status, 
          statusText: response.statusText,
          error: errorData 
        })
        throw new Error(`Bootstrap Agent error (${response.status}): ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Bootstrap response:', data)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        agentRole: data.agentRole || currentAgentRole,
        toolCalls: data.toolCalls || []
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Update session ID if provided and establish WebSocket
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
        setIsSessionActive(true)
        console.log('🔄 Connected to Claude Code session:', data.sessionId)
      }
      
      // Update todos if TodoWrite was called
      if (data.toolCalls?.some((tool: ToolCall) => tool.name === 'TodoWrite')) {
        console.log('TodoWrite called - would update todos in real implementation')
      }
      
    } catch (error) {
      console.error('❌ Error communicating with Bootstrap Agent:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      
      // Enhanced error response with debug info
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Bootstrap Agent Error**

I encountered an issue while processing your request: **"${input}"**

**Error Details:**
- ${error instanceof Error ? error.message : 'Unknown error'}

**What I was trying to do:**
1. Connect to Claude Code CLI session (ID: ${sessionId || 'not set'})
2. Process your request through the bootstrap API
3. Generate proper Maverick development response

**Debug Information:**
- Session Active: ${isSessionActive ? '✅ Yes' : '❌ No'}
- API Endpoint: \`/api/projects/maverick/bootstrap\`
- Current User: tim
- Project Context: maverick (self-bootstrapping)

**Next Steps:**
Please check the browser console for detailed error information. The bootstrap system is designed to fail gracefully and provide detailed debugging.

You can also try:
- Refreshing the page to reset the session
- Checking if the development server is running properly
- Looking at the network tab for API response details

*This error has been logged for debugging purposes.*`,
        timestamp: new Date().toISOString(),
        agentRole: 'Error Handler',
        toolCalls: []
      }
      
      setMessages(prev => [...prev, errorMessage])
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
                href="/projects/maverick"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Maverick
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-blue-600" />
                  Maverick Bootstrap
                </h1>
                <div className="text-sm text-gray-600 flex items-center gap-3">
                  <span>User: tim</span>
                  <div className="h-4 border-l border-gray-300" />
                  {sessionId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-700 font-medium">Claude CLI Connected</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {sessionId.slice(-8)}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-yellow-700">Connecting...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {connectionStatus === 'connected' ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Session
                </Badge>
              ) : connectionStatus === 'connecting' ? (
                <Badge variant="outline" className="text-yellow-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Connecting
                </Badge>
              ) : connectionStatus === 'error' ? (
                <Badge variant="outline" className="text-red-600">
                  Connection Error
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  Initializing...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Main Conversation */}
          <div className="col-span-3">
            {isConnecting ? (
              <Card className="h-full flex flex-col shadow-sm">
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-md">
                    <div className="flex justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {connectionStatus === 'initializing' && 'Initializing Bootstrap...'}
                        {connectionStatus === 'connecting' && 'Connecting...'}
                        {connectionStatus === 'connected' && 'Bootstrap Ready'}
                        {connectionStatus === 'error' && 'Connection Error'}
                      </h3>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {connectionStatus === 'initializing' && (
                          <>
                            <p>🔍 Checking for existing bootstrap session...</p>
                            <p>📂 Loading conversation history from localStorage</p>
                          </>
                        )}
                        {connectionStatus === 'connecting' && (
                          <p>🔄 Initializing interface...</p>
                        )}
                        {connectionStatus === 'connected' && (
                          <>
                            <p>✅ Bootstrap interface ready</p>
                            <p>💬 Chat with Claude to build Maverick features</p>
                          </>
                        )}
                        {connectionStatus === 'error' && (
                          <>
                            <p className="text-red-600">❌ Failed to establish connection</p>
                            <p>Check server logs for details</p>
                          </>
                        )}
                      </div>
                      
                      {sessionId && (
                        <div className="text-xs text-gray-500 font-mono">
                          Session: {sessionId.slice(-12)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex flex-col shadow-sm">
              <CardContent className="flex-1 flex flex-col p-0">
                {error && (
                  <Alert className="m-6 mb-0 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="font-medium">Bootstrap Agent Error</div>
                      <div className="text-sm mt-1">{error}</div>
                      {debugInfo && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium">Debug Information</summary>
                          <pre className="text-xs mt-1 bg-red-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(debugInfo, null, 2)}
                          </pre>
                        </details>
                      )}
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
                            {message.role === 'human' ? 'Tim' : message.agentRole || 'Agent'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="prose prose-sm max-w-none">
                          <MaverickMarkdownRenderer 
                            markdown={message.content}
                            context={{
                              projectName: 'maverick',
                              userRole: message.role === 'human' ? 'owner' : 'agent'
                            }}
                          />
                          
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
                          <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Bootstrap Agent is coordinating...</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {sessionId ? (
                                <>
                                  <span className="text-green-600">✓</span> Connected to Claude CLI session: {sessionId.slice(-8)}
                                </>
                              ) : (
                                <>
                                  <span className="text-yellow-600">●</span> Initializing Claude Code CLI connection...
                                </>
                              )}
                            </div>
                          </div>
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
                      placeholder="What should we build for Maverick? (Example: 'implement the Claude Code CLI integration')"
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={isStreaming}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={isStreaming || !input.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <p className="text-xs text-gray-500 flex-1">
                      Describe features to build, ask questions, or coordinate agents • Shift+Enter for new line
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-6"
                      onClick={() => {
                        setSessionId('5d483732-eeb4-4e88-9107-a7d2c9819b10')
                        setIsSessionActive(true)
                      }}
                    >
                      Connect to Current Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1 space-y-4">
            {/* Bootstrap Tasks */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Rocket className="w-5 h-5 text-blue-600" />
                  Bootstrap Tasks
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
              </CardContent>
            </Card>

            {/* Architecture Questions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Architecture Questions
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
                      <div className="border-t p-3 bg-gray-50">
                        <p className="text-sm text-gray-500 italic">
                          Click to start discussing this architecture question
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Claude Terminal Logs */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Claude Terminal Logs
                  {claudeTerminalLogs.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {claudeTerminalLogs.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {claudeTerminalLogs.length === 0 ? (
                  <div className="text-xs text-gray-500 italic">
                    No logs yet. Start a conversation to see Claude Code CLI output.
                  </div>
                ) : (
                  claudeTerminalLogs.map((log, i) => {
                    const logString = typeof log === 'string' ? log : JSON.stringify(log)
                    return (
                      <div key={i} className="text-xs font-mono bg-gray-50 p-2 rounded border">
                        <div className={`${
                          logString.includes('[OUTPUT]') ? 'text-green-700' :
                          logString.includes('[INPUT]') ? 'text-blue-700' :
                          logString.includes('[ERROR]') ? 'text-red-700' :
                          logString.includes('[SYSTEM]') ? 'text-purple-700' :
                          'text-gray-700'
                        }`}>
                        {logString}
                      </div>
                    </div>
                  )
                  })
                )}
              </CardContent>
            </Card>

            {/* Generated Artifacts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                  Generated Files
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}