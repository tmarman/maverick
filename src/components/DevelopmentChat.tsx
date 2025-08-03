'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Send,
  Terminal,
  User,
  Code,
  ArrowRight,
  Filter,
  GitBranch,
  FileCode,
  Zap,
  MessageSquare,
  ExternalLink,
  Layers,
  Settings
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  messageType: 'planning' | 'technical' | 'code' | 'architecture'
  workItemId?: string
  claudeSessionId?: string
  codeGenerated?: boolean
  filesModified?: string[]
}

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'TASK' | 'SUBTASK'
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
}

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
  defaultBranch?: string
}

interface DevelopmentChatProps {
  project: Project
  workItem?: WorkItem
  className?: string
}

export function DevelopmentChat({ project, workItem, className }: DevelopmentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeThread, setActiveThread] = useState<'planning' | 'technical' | 'implementation'>('planning')
  const [claudeSessionActive, setClaudeSessionActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeDevelopmentChat()
  }, [project.name, workItem?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeDevelopmentChat = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'system',
      content: workItem 
        ? `🔧 **Development Planning for: ${workItem.title}**\n\nThis is your technical workspace for planning and implementing this work item. I can help you:\n\n• **Plan** the technical approach and architecture\n• **Code** with Claude Code integration for hands-on development  \n• **Review** implementation decisions and code quality\n\nWhat would you like to work on first?`
        : `🔧 **Development Workspace for ${project.name}**\n\nThis is your technical planning space. I can help with:\n\n• **Architecture** discussions and technical decisions\n• **Implementation** planning with Claude Code integration\n• **Code review** and technical guidance\n\nWhat are you working on?`,
      timestamp: new Date(),
      messageType: 'planning'
    }
    
    setMessages([welcomeMessage])
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      messageType: activeThread,
      workItemId: workItem?.id
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      let endpoint = '/api/development-chat'
      let payload = {
        message: userMessage.content,
        thread: activeThread,
        projectName: project.name,
        workItemId: workItem?.id,
        projectContext: {
          name: project.name,
          type: project.type,
          repositoryUrl: project.repositoryUrl,
          defaultBranch: project.defaultBranch
        },
        workItemContext: workItem,
        conversationHistory: messages.slice(-5) // Last 5 messages for context
      }

      // For implementation thread, use Claude Code integration
      if (activeThread === 'implementation') {
        endpoint = '/api/claude-code/development'
        setClaudeSessionActive(true)
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || "I understand. Let me help you with that.",
          timestamp: new Date(),
          messageType: activeThread,
          claudeSessionId: data.sessionId,
          codeGenerated: data.codeGenerated || false,
          filesModified: data.filesModified || []
        }

        setMessages(prev => [...prev, assistantMessage])

        if (data.codeGenerated) {
          toast({
            title: 'Code Generated!',
            description: `Modified ${data.filesModified?.length || 0} files`
          })
        }
      } else {
        throw new Error('Failed to process message')
      }
    } catch (error) {
      console.error('Error processing development message:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble with that request. Could you try rephrasing or breaking it down into smaller steps?",
        timestamp: new Date(),
        messageType: activeThread
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setClaudeSessionActive(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getThreadIcon = (thread: string) => {
    switch (thread) {
      case 'planning':
        return <Layers className="w-4 h-4" />
      case 'technical':
        return <Settings className="w-4 h-4" />
      case 'implementation':
        return <Terminal className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'technical':
        return 'bg-purple-100 text-purple-800'
      case 'code':
      case 'implementation':
        return 'bg-green-100 text-green-800'
      case 'architecture':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header with Thread Switcher */}
      <Card className="rounded-b-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-500" />
              Development Chat
              {claudeSessionActive && (
                <Badge variant="secondary" className="animate-pulse">
                  Claude Code Active
                </Badge>
              )}
            </CardTitle>
            
            {workItem && (
              <Badge variant="outline" className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {workItem.title}
              </Badge>
            )}
          </div>
          
          {/* Thread Selector */}
          <div className="flex gap-1 mt-2">
            <Button
              variant={activeThread === 'planning' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveThread('planning')}
              className="text-xs"
            >
              <Layers className="w-3 h-3 mr-1" />
              Planning
            </Button>
            <Button
              variant={activeThread === 'technical' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveThread('technical')}
              className="text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Architecture
            </Button>
            <Button
              variant={activeThread === 'implementation' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveThread('implementation')}
              className="text-xs"
            >
              <Terminal className="w-3 h-3 mr-1" />
              Implementation
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col rounded-t-none">
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {(message.role === 'assistant' || message.role === 'system') && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'system' ? 'bg-gray-100' : 'bg-green-100'
                  }`}>
                    {message.role === 'system' ? (
                      <Settings className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Terminal className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-gray-100 text-gray-900 border border-gray-200'
                      : 'bg-green-50 text-gray-900 border border-green-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Message metadata */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getMessageTypeColor(message.messageType)} size="sm">
                      {getThreadIcon(message.messageType)}
                      {message.messageType}
                    </Badge>
                    
                    {message.codeGenerated && (
                      <Badge variant="secondary" size="sm">
                        <FileCode className="w-3 h-3 mr-1" />
                        Code Generated
                      </Badge>
                    )}
                    
                    {message.filesModified && message.filesModified.length > 0 && (
                      <Badge variant="outline" size="sm">
                        {message.filesModified.length} files
                      </Badge>
                    )}
                    
                    <span
                      className={`text-xs opacity-75 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </span>
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
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Terminal className="w-4 h-4 text-green-600" />
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-gray-600">
                      {activeThread === 'implementation' ? 'Running Claude Code...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeThread === 'planning' 
                    ? "Discuss technical approach, architecture decisions..."
                    : activeThread === 'technical'
                    ? "Ask about patterns, design decisions, tech choices..."
                    : "Write code, run commands, make changes..."
                }
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !inputText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-xs text-text-muted mt-2">
              {activeThread === 'implementation' 
                ? '🔧 Implementation mode: Direct Claude Code integration for hands-on development'
                : activeThread === 'technical'
                ? '⚙️ Architecture mode: Technical decisions and system design discussions'
                : '📋 Planning mode: High-level technical strategy and approach'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}