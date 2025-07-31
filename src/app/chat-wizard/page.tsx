'use client'

import { useState, useRef, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  formUpdates?: any
}

interface WizardData {
  businessName: string
  businessType: string
  industry: string
  description: string
  location: string
  legalStructure: string
  state: string
  squareServices: string[]
  appType: string
  features: string[]
  currentStep: string
  completionPercentage: number
}

export default function ChatWizard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm Goose, your AI business mentor. I'm here to help you turn your idea into a complete, legally formed business with custom software.\n\nLet's start simple - what's your business idea? Tell me about the problem you want to solve or the service you want to offer.",
      timestamp: new Date()
    }
  ])
  
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [wizardData, setWizardData] = useState<WizardData>({
    businessName: '',
    businessType: '',
    industry: '',
    description: '',
    location: '',
    legalStructure: '',
    state: '',
    squareServices: [],
    appType: '',
    features: [],
    currentStep: 'business-idea',
    completionPercentage: 0
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      // Call our chat API with the message and current wizard data
      const response = await fetch('/api/chat-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage.trim(),
          wizardData,
          messageHistory: messages
        }),
      })

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        formUpdates: data.formUpdates
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update wizard data if AI extracted information
      if (data.formUpdates) {
        setWizardData(prev => ({
          ...prev,
          ...data.formUpdates,
          completionPercentage: data.completionPercentage || prev.completionPercentage
        }))
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Let me try to help you in a different way. Can you tell me more about your business idea?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getStepColor = (step: string) => {
    switch (step) {
      case 'business-idea': return 'bg-blue-500'
      case 'business-details': return 'bg-green-500'
      case 'legal-structure': return 'bg-purple-500'
      case 'square-setup': return 'bg-yellow-500'
      case 'app-generation': return 'bg-pink-500'
      case 'review-launch': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const proceedToWizard = () => {
    // Pass the chat data to the wizard
    const wizardUrl = `/wizard?data=${encodeURIComponent(JSON.stringify(wizardData))}`
    window.location.href = wizardUrl
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-background-secondary rounded-2xl border border-border-subtle overflow-hidden">
              {/* Chat Header */}
              <div className="bg-accent-primary p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Goose AI Business Mentor</h2>
                    <p className="text-blue-100 text-sm">Let's build your business together</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-accent-primary text-white'
                          : 'bg-background-tertiary text-text-primary border border-border-subtle'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.formUpdates && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="text-green-700 font-medium">✓ Information captured:</div>
                          <div className="text-green-600 text-xs mt-1">
                            {Object.entries(message.formUpdates).map(([key, value]) => (
                              <div key={key}>{key}: {typeof value === 'string' ? value : JSON.stringify(value)}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-background-tertiary text-text-primary border border-border-subtle rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-text-secondary">Goose is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border-subtle">
                <div className="flex space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me about your business idea..."
                    className="flex-1 px-4 py-3 bg-background-primary border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Business Formation Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">Overall Progress</span>
                    <span className="text-sm font-medium text-text-primary">{wizardData.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-background-tertiary rounded-full h-2">
                    <div 
                      className="bg-accent-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${wizardData.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'business-idea', label: 'Business Idea', completed: !!wizardData.description },
                    { id: 'business-details', label: 'Business Details', completed: !!(wizardData.businessName && wizardData.businessType) },
                    { id: 'legal-structure', label: 'Legal Structure', completed: !!wizardData.legalStructure },
                    { id: 'square-setup', label: 'Square Setup', completed: wizardData.squareServices.length > 0 },
                    { id: 'app-generation', label: 'App Generation', completed: !!wizardData.appType },
                  ].map((step) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${step.completed ? 'bg-green-500' : 'bg-border-standard'}`}></div>
                      <span className={`text-sm ${step.completed ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Captured Information */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Information Captured</h3>
              
              <div className="space-y-3 text-sm">
                {wizardData.businessName && (
                  <div>
                    <span className="text-text-secondary">Business Name:</span>
                    <div className="font-medium text-text-primary">{wizardData.businessName}</div>
                  </div>
                )}
                {wizardData.industry && (
                  <div>
                    <span className="text-text-secondary">Industry:</span>
                    <div className="font-medium text-text-primary">{wizardData.industry}</div>
                  </div>
                )}
                {wizardData.businessType && (
                  <div>
                    <span className="text-text-secondary">Business Type:</span>
                    <div className="font-medium text-text-primary">{wizardData.businessType}</div>
                  </div>
                )}
                {wizardData.location && (
                  <div>
                    <span className="text-text-secondary">Location:</span>
                    <div className="font-medium text-text-primary">{wizardData.location}</div>
                  </div>
                )}
                {wizardData.legalStructure && (
                  <div>
                    <span className="text-text-secondary">Legal Structure:</span>
                    <div className="font-medium text-text-primary">{wizardData.legalStructure.toUpperCase()}</div>
                  </div>
                )}
              </div>

              {wizardData.completionPercentage > 50 && (
                <button
                  onClick={proceedToWizard}
                  className="w-full mt-4 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
                >
                  Continue to Detailed Wizard →
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-accent-primary hover:bg-background-tertiary rounded-lg transition-colors">
                  💡 Get business idea suggestions
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-accent-primary hover:bg-background-tertiary rounded-lg transition-colors">
                  📊 Analyze market opportunity
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-accent-primary hover:bg-background-tertiary rounded-lg transition-colors">
                  🏢 Compare legal structures
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-accent-primary hover:bg-background-tertiary rounded-lg transition-colors">
                  💰 Estimate startup costs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}