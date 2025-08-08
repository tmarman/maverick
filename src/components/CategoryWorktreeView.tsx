'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  MessageSquare,
  Code,
  FileText,
  Lightbulb,
  Send,
  User,
  Bot,
  GitBranch,
  PlayCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PENDING' | 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'BLOCKED' | 'DEFERRED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING'
  worktreeStatus?: 'PENDING' | 'ACTIVE' | 'STALE' | 'MERGED' | 'REMOVED'
  estimatedEffort?: string
  createdAt: string
  updatedAt: string
}

interface CategoryWorktreeProps {
  category: {
    id: string
    name: string
    color: string
    items: WorkItem[]
  }
  projectName: string
  onBack: () => void
  className?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const getStatusIcon = (status: WorkItem['status']) => {
  switch (status) {
    case 'DONE': return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'IN_PROGRESS': return <PlayCircle className="w-4 h-4 text-blue-600" />
    case 'BLOCKED': return <Clock className="w-4 h-4 text-red-600" />
    default: return <FileText className="w-4 h-4 text-gray-600" />
  }
}

const getTypeIcon = (type: WorkItem['type']) => {
  switch (type) {
    case 'FEATURE': return <Lightbulb className="w-4 h-4 text-blue-600" />
    case 'BUG': return <FileText className="w-4 h-4 text-red-600" />
    case 'EPIC': return <GitBranch className="w-4 h-4 text-purple-600" />
    default: return <FileText className="w-4 h-4 text-gray-600" />
  }
}

export function CategoryWorktreeView({ category, projectName, onBack, className }: CategoryWorktreeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null)

  // Initialize with a welcome message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to the **${category.name}** worktree! 🚀

I'm your focused assistant for all ${category.name.toLowerCase()} related work. I can see ${category.items.length} task${category.items.length !== 1 ? 's' : ''} in this category.

I can help you with:
- Planning and breaking down tasks
- Writing code and implementations  
- Code reviews and optimizations
- Architecture decisions
- Best practices and recommendations

What would you like to work on first?`,
        timestamp: new Date()
      }
    ])
  }, [category])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // TODO: Implement actual AI chat with category context
    // For now, simulate a response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: `I understand you want to work on "${inputMessage.trim()}" in the ${category.name} category. 

Based on the ${category.items.length} tasks I can see in this category, I can help you:

1. **Plan the implementation** - Break this down into smaller, manageable tasks
2. **Write the code** - Generate implementation code with best practices
3. **Review and optimize** - Analyze existing code and suggest improvements
4. **Connect to existing work** - Link this to related tasks in the category

Which approach would you prefer? I can also show you relevant tasks from this category that might be related.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`h-full flex ${className}`}>
      {/* Left Side - Chat */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Code 
                  className="w-5 h-5" 
                  style={{ color: category.color }}
                />
                <CardTitle className="text-lg">{category.name} Worktree</CardTitle>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                    border: `1px solid ${category.color}40`
                  }}
                >
                  {category.items.length} tasks
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: category.color }}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: category.color }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask about ${category.name.toLowerCase()} work...`}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Filtered Task List */}
      <div className="w-80 flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-gray-200 pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">
              Category Tasks ({category.items.length})
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="space-y-1">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedWorkItem(selectedWorkItem?.id === item.id ? null : item)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                    selectedWorkItem?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </span>
                        {item.worktreeStatus === 'ACTIVE' && (
                          <GitBranch className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(item.status)}
                        <span className="text-xs text-gray-500 capitalize">
                          {item.status.toLowerCase().replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {item.priority.toLowerCase()}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {category.items.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No tasks in this category yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}