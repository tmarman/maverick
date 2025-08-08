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
  Brain,
  GitBranch,
  FolderOpen,
  MessageSquare,
  Settings,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MaverickMarkdownRenderer } from '@/components/MaverickMarkdownRenderer'

export interface ChatScope {
  type: 'project' | 'task' | 'feature' | 'epic'
  id?: string
  title?: string
  projectName: string
  workingDirectory?: string
  branchName?: string
  worktreePath?: string
  context?: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  scope: ChatScope
  actions?: ChatAction[]
  metadata?: Record<string, any>
}

export interface ChatAction {
  id: string
  type: 'create_task' | 'update_task' | 'run_command' | 'create_file' | 'commit_changes'
  title: string
  description?: string
  status: 'pending' | 'completed' | 'failed'
  data?: Record<string, any>
}

interface ContextualChatProps {
  scope: ChatScope
  className?: string
  compact?: boolean
  initialMessages?: ChatMessage[]
  onAction?: (action: ChatAction) => void
  onMessageSent?: (message: ChatMessage) => void
}

export function ContextualChat({ 
  scope, 
  className = '', 
  compact = false,
  initialMessages = [],
  onAction,
  onMessageSent
}: ContextualChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('claude')
  const [availableProviders, setAvailableProviders] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load existing chat history for this scope
    loadChatHistory()
    loadAvailableProviders()
  }, [scope])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const loadAvailableProviders = async () => {
    try {
      const response = await fetch('/api/chat/providers')
      if (response.ok) {
        const data = await response.json()
        setAvailableProviders(data.providers || [])
        
        // Set default provider to first available one
        const availableProvider = data.providers.find((p: any) => p.available)
        if (availableProvider) {
          setSelectedProvider(availableProvider.provider)
        }
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }

  const getScopeIcon = () => {
    switch (scope.type) {
      case 'project':
        return <FolderOpen className="w-4 h-4 text-blue-500" />
      case 'task':
        return <MessageSquare className="w-4 h-4 text-green-500" />
      case 'feature':
        return <Brain className="w-4 h-4 text-purple-500" />
      case 'epic':
        return <Settings className="w-4 h-4 text-orange-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const getScopeTitle = () => {
    if (scope.title) return scope.title
    
    switch (scope.type) {
      case 'project':
        return `Project: ${scope.projectName}`
      case 'task':
        return `Task Chat`
      case 'feature':
        return `Feature Chat`
      case 'epic':
        return `Epic Chat`
      default:
        return 'Chat'
    }
  }

  const getScopeContext = () => {
    const parts = []
    
    if (scope.branchName) {
      parts.push(
        <Badge key="branch" variant="outline" className="text-xs">
          <GitBranch className="w-3 h-3 mr-1" />
          {scope.branchName}
        </Badge>
      )
    }
    
    if (scope.workingDirectory) {
      parts.push(
        <Badge key="dir" variant="outline" className="text-xs">
          <FolderOpen className="w-3 h-3 mr-1" />
          {scope.workingDirectory.split('/').pop()}
        </Badge>
      )
    }
    
    return parts
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      scope
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setIsStreaming(true)

    // Notify parent component
    if (onMessageSent) {
      onMessageSent(userMessage)
    }

    try {
      // Create streaming assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        scope,
        actions: []
      }

      setMessages(prev => [...prev, assistantMessage])

      // Call streaming Claude API
      console.log('Calling Claude stream API with:', { 
        message: userMessage.content, 
        scope,
        historyLength: messages.slice(-10).length 
      })
      
      const response = await fetch('/api/chat/claude-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          scope,
          provider: selectedProvider,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
          projectContext: {
            name: scope.projectName,
            workingDirectory: scope.workingDirectory,
            branchName: scope.branchName,
            worktreePath: scope.worktreePath
          }
        })
      })
      
      console.log('Stream response status:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              console.log('Received streaming data:', data)
              
              if (data.type === 'content') {
                // Update the assistant message content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ))
              } else if (data.type === 'action') {
                // Add action to the assistant message
                const action: ChatAction = {
                  id: data.action.id,
                  type: data.action.type,
                  title: data.action.title,
                  description: data.action.description,
                  status: 'pending',
                  data: data.action.data
                }

                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, actions: [...(msg.actions || []), action] }
                    : msg
                ))

                // Notify parent component of action
                if (onAction) {
                  onAction(action)
                }
              } else if (data.type === 'done') {
                setIsStreaming(false)
              }
            } catch (e) {
              console.error('Failed to parse streaming data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I'm having trouble processing that right now. Could you try again?",
        timestamp: new Date(),
        scope
      }
      
      setMessages(prev => [...prev.slice(0, -1), errorMessage])
      
      toast({
        title: 'Chat Error',
        description: 'Failed to get response from Claude',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleActionClick = async (action: ChatAction) => {
    // Execute the action
    try {
      const response = await fetch('/api/chat/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, scope })
      })

      if (response.ok) {
        // Update action status
        setMessages(prev => prev.map(msg => ({
          ...msg,
          actions: msg.actions?.map(a => 
            a.id === action.id ? { ...a, status: 'completed' } : a
          )
        })))
        
        toast({
          title: 'Action Completed',
          description: action.title
        })
      } else {
        throw new Error('Action failed')
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        actions: msg.actions?.map(a => 
          a.id === action.id ? { ...a, status: 'failed' } : a
        )
      })))
      
      toast({
        title: 'Action Failed',
        description: action.title,
        variant: 'destructive'
      })
    }
  }

  if (compact) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Compact header */}
        <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
          {getScopeIcon()}
          <span className="text-sm font-medium truncate">{getScopeTitle()}</span>
          <div className="flex items-center gap-1 ml-auto">
            {/* Provider selector */}
            {availableProviders.length > 1 && (
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="text-xs border border-gray-300 rounded px-1 py-0.5"
              >
                {availableProviders.map((provider) => (
                  <option key={provider.provider} value={provider.provider} disabled={!provider.available}>
                    {provider.name} {provider.available ? '' : '(unavailable)'}
                  </option>
                ))}
              </select>
            )}
            {getScopeContext()}
          </div>
        </div>

        {/* Messages - compact */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-2 text-sm ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <MaverickMarkdownRenderer 
                  markdown={message.content}
                  context={{
                    projectName: scope.projectName,
                    taskId: scope.id,
                    userRole: 'user'
                  }}
                  onSnippetAction={async (snippet) => {
                    // Handle snippet actions
                    console.log('Snippet action:', snippet)
                    if (typeof snippet === 'object' && snippet !== null && 'action' in snippet) {
                      const action = (snippet as any).action
                      if (action?.type === 'create_task') {
                        // Handle task creation
                        toast({
                          title: "Creating task...",
                          description: action.data?.title || "New task"
                        })
                      }
                    }
                  }}
                  className="text-sm"
                />
                
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(action)}
                        disabled={action.status === 'completed'}
                        className="h-6 text-xs"
                      >
                        {action.status === 'pending' && <Send className="w-3 h-3 mr-1" />}
                        {action.status === 'completed' && '✓ '}
                        {action.status === 'failed' && '✗ '}
                        {action.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-lg p-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-gray-600">
                  {isStreaming ? 'Claude is responding...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input - compact */}
        <div className="border-t p-2">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Claude..."
              className="flex-1 h-8 text-sm"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputText.trim()}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          {getScopeIcon()}
          {getScopeTitle()}
          <Badge variant="secondary">{messages.length} messages</Badge>
          <div className="flex items-center gap-2 ml-auto">
            {/* Provider selector */}
            {availableProviders.length > 0 && (
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {availableProviders.map((provider) => (
                  <option key={provider.provider} value={provider.provider} disabled={!provider.available}>
                    {provider.name} {provider.available ? '' : '(unavailable)'}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              {getScopeContext()}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <MaverickMarkdownRenderer 
                  markdown={message.content}
                  context={{
                    projectName: scope.projectName,
                    taskId: scope.id,
                    userRole: 'user'
                  }}
                  onSnippetAction={async (snippet) => {
                    // Handle snippet actions
                    console.log('Snippet action:', snippet)
                    if (typeof snippet === 'object' && snippet !== null && 'action' in snippet) {
                      const action = (snippet as any).action
                      if (action?.type === 'create_task') {
                        // Handle task creation
                        toast({
                          title: "Creating task...",
                          description: action.data?.title || "New task"
                        })
                      }
                    }
                  }}
                  className="text-sm"
                />
                
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(action)}
                        disabled={action.status === 'completed'}
                        className="mr-2"
                      >
                        {action.status === 'pending' && <Send className="w-3 h-3 mr-1" />}
                        {action.status === 'completed' && '✓ '}
                        {action.status === 'failed' && '✗ '}
                        {action.title}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-2 opacity-75 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
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
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-gray-600">
                    {isStreaming ? 'Claude is responding...' : 'Thinking...'}
                  </span>
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
              placeholder={`Chat with Claude about ${scope.type === 'project' ? 'the project' : 'this ' + scope.type}...`}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}