'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  businessId: string | null
  projectId: string | null
  documentId: string | null
}

export function AIAssistant({ businessId, projectId, documentId }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiService, setAiService] = useState<'ollama' | 'lmstudio' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check AI service availability
    checkAIService()
    
    // Add welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI assistant powered by ${aiService || 'local AI'}. I can help you with:

• Business strategy and planning
• Project management and features
• Document creation and editing
• Code generation and reviews
• Square integration setup

What would you like to work on?`,
      timestamp: new Date()
    }])
  }, [aiService])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAIService = async () => {
    try {
      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'ping',
          type: 'health_check'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiService(data.provider || 'ollama')
      }
    } catch (error) {
      console.error('AI service not available:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const context = {
        businessId,
        projectId,
        documentId,
        hasSquareIntegration: true,
        currentContext: getCurrentContext()
      }

      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          type: 'business_guidance',
          context
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'I apologize, but I had trouble processing your request.',
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting to the AI service. Please check that Ollama or LM Studio is running.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const getCurrentContext = () => {
    if (documentId) return 'document'
    if (projectId) return 'project'
    if (businessId) return 'business'
    return 'general'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col bg-background-secondary">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">AI Assistant</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${aiService ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-text-muted">
              {aiService ? aiService.toUpperCase() : 'Offline'}
            </span>
          </div>
        </div>
        {getCurrentContext() !== 'general' && (
          <p className="text-xs text-text-secondary mt-1">
            Context: {getCurrentContext()}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-accent-primary text-white'
                  : 'bg-background-tertiary text-text-primary'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-white opacity-70' : 'text-text-muted'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background-tertiary p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your business, projects, or code..."
            className="flex-1 p-3 border border-border-subtle rounded-lg resize-none bg-background-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            Send
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {!aiService && (
            <span className="text-red-500">AI service offline</span>
          )}
        </div>
      </div>
    </div>
  )
}