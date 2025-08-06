'use client'

import { useState, useEffect, useRef } from 'react'
import { Navigation } from '@/components/Navigation'

interface ChatMessage {
  id: string
  type: 'user' | 'goose' | 'system'
  message: string
  timestamp: Date
  actions?: ActionButton[]
}

interface ActionButton {
  label: string
  action: string
  variant?: 'primary' | 'secondary'
}

interface LocalAIStatus {
  available: boolean
  provider: string | null
  models: string[]
  recommendations: string[]
}

export default function GooseDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [demoStage, setDemoStage] = useState(0)
  const [aiStatus, setAIStatus] = useState<LocalAIStatus | null>(null)
  const [useLocalAI, setUseLocalAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check local AI availability on component mount
  useEffect(() => {
    checkLocalAIStatus()
  }, [])

  useEffect(() => {
    // Start the demo automatically
    if (messages.length === 0) {
      setTimeout(() => {
        const connectionMessage = useLocalAI && aiStatus?.available
          ? `Goose AI is connecting to local ${aiStatus.provider} service...`
          : 'Goose AI is connecting to Maverick business formation platform...'
        
        addMessage('system', connectionMessage)
        setTimeout(() => {
          const aiProvider = useLocalAI && aiStatus?.available ? ` (powered by local ${aiStatus.provider})` : ''
          addMessage('goose', `👋 Hi! I'm Goose, your AI business formation assistant${aiProvider}. I'm integrated with Maverick to help you build a complete business from idea to revenue.

What kind of business would you like to create today?`)
        }, 1000)
      }, 500)
    }
  }, [useLocalAI, aiStatus])

  const checkLocalAIStatus = async () => {
    try {
      const response = await fetch('/api/local-ai')
      const status = await response.json()
      setAIStatus(status)
      
      // Auto-enable local AI if available
      if (status.available && status.models.length > 0) {
        setUseLocalAI(true)
      }
    } catch (error) {
      console.warn('Could not check local AI status:', error)
      setAIStatus({
        available: false,
        provider: null,
        models: [],
        recommendations: ['Local AI not available - using demo responses']
      })
    }
  }

  const addMessage = (type: 'user' | 'goose' | 'system', message: string, actions?: ActionButton[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      actions
    }
    setMessages(prev => [...prev, newMessage])
  }

  const simulateTyping = (callback: () => void, delay = 2000) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      callback()
    }, delay)
  }

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend) return

    addMessage('user', messageToSend)
    setInputValue('')
    
    // Simulate Goose response based on demo stage
    simulateTyping(() => {
      handleGooseResponse(messageToSend)
    })
  }

  const handleGooseResponse = async (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Use local AI if available and enabled
    if (useLocalAI && aiStatus?.available) {
      try {
        const response = await fetch('/api/local-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'chat-response',
            data: {
              messages: [
                ...messages.filter(m => m.type !== 'system').map(m => ({
                  role: m.type === 'user' ? 'user' : 'assistant',
                  content: m.message
                })),
                { role: 'user', content: userMessage }
              ],
              context: `You are Goose, an AI business formation assistant. You help entrepreneurs create businesses through Maverick. Current conversation stage: ${demoStage}. Be enthusiastic and action-oriented. If user mentions coffee/cafe, analyze the business idea. If they want to start formation, begin the process.`,
              provider: aiStatus.provider,
              model: aiStatus.models[0]
            }
          })
        })

        const result = await response.json()
        if (result.success) {
          addMessage('goose', result.data.response)
          
          // Auto-advance demo stages based on response content
          if (result.data.response.toLowerCase().includes('market analysis') && demoStage === 0) {
            setDemoStage(1)
          } else if (result.data.response.toLowerCase().includes('formation') && demoStage === 1) {
            setDemoStage(2)
          }
          
          return
        }
      } catch (error) {
        console.warn('Local AI failed, falling back to demo responses:', error)
      }
    }
    
    // Fallback to hardcoded demo responses
    if (demoStage === 0 || lowerMessage.includes('coffee') || lowerMessage.includes('cafe')) {
      setDemoStage(1)
      addMessage('goose', `☕ Great choice! A coffee shop is a fantastic business idea. Let me analyze the market opportunity for you.

*Analyzing market data...*

📊 **Market Analysis Results:**
• Coffee market size: $45B annually in the US
• Local competition: Moderate (3-4 competitors within 2 miles)
• Target demographic: Young professionals, students, remote workers
• Profit margins: 15-20% for specialty coffee
• Break-even timeline: 8-12 months

This looks promising! Shall I start the business formation process for your coffee shop?`, [
        { label: '🚀 Yes, start formation', action: 'start-formation', variant: 'primary' },
        { label: '📋 Tell me more about the process', action: 'explain-process', variant: 'secondary' }
      ])
    } else if (lowerMessage.includes('start') || lowerMessage.includes('formation')) {
      setDemoStage(2)
      addMessage('goose', `🏢 Perfect! I'm initiating the business formation process through Maverick. Let me gather some details:

**Business Name:** What would you like to call your coffee shop?

While you think, I'm already:
• Checking name availability across all states
• Preparing legal documents (LLC recommended for coffee shops)
• Setting up your Square merchant account pre-approval
• Analyzing ideal locations based on your target market

Just give me a name and I'll handle the rest!`)
    } else {
      // Generic response for other inputs
      addMessage('goose', `I understand you're interested in ${userMessage}. Let me help you explore this business opportunity! 

Would you like me to:
• Analyze the market potential for this idea
• Discuss business formation options
• Start the legal formation process
• Connect with Square for payment processing

What would be most helpful?`, [
        { label: '📊 Analyze market potential', action: 'analyze-market', variant: 'primary' },
        { label: '🚀 Start formation process', action: 'start-formation', variant: 'secondary' }
      ])
    }
  }

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'start-formation':
        handleSendMessage('Yes, please start the business formation process')
        break
      case 'explain-process':
        addMessage('goose', `📋 Here's exactly what happens when I create your business:

**Day 1-2: Legal Formation**
• I generate all legal documents (Articles of Organization, Operating Agreement, etc.)
• File with your chosen state (Delaware recommended for tax benefits)
• Obtain Federal EIN (Tax ID number)
• Set up business licenses and permits

**Day 3-4: Square Integration**
• Create Square business banking account (free, no minimums)
• Set up payment processing (2.9% + 30¢ per transaction)
• Configure Point-of-Sale system for in-store orders
• Integrate online ordering capabilities

**Day 5-6: Custom App Development**
• Claude Code generates your complete business application
• Customer-facing website with online ordering
• Admin dashboard with analytics and inventory
• Mobile-responsive design optimized for coffee shops

**Day 7: Go Live**
• Deploy everything to production
• Test all payment flows
• Train you on the system
• Launch your business! 🚀

Ready to begin?`, [
          { label: '🚀 Yes, let\'s do this!', action: 'start-formation', variant: 'primary' }
        ])
        break
    }
  }

  const quickStartOptions = [
    'I want to start a coffee shop',
    'Help me build a SaaS platform',
    'I need an e-commerce store',
    'Create a service-based business'
  ]

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            🤖 Goose × Maverick Integration Demo
          </h1>
          <p className="text-text-secondary">
            Experience how AI can create your entire business through natural conversation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-background-secondary rounded-2xl border border-border-subtle h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border-subtle">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center">
                    <span className="text-text-inverse font-bold">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Goose AI Assistant</h3>
                    <p className="text-sm text-green-500">● Connected to Maverick</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${
                      message.type === 'user' 
                        ? 'bg-accent-primary text-text-inverse' 
                        : message.type === 'system'
                        ? 'bg-background-tertiary text-text-muted text-center'
                        : 'bg-background-primary text-text-primary'
                    } rounded-lg p-3 ${message.type === 'system' ? 'italic text-sm' : ''}`}>
                      <div className="whitespace-pre-line">{message.message}</div>
                      {message.actions && (
                        <div className="mt-3 space-y-2">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleActionClick(action.action)}
                              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                action.variant === 'primary'
                                  ? 'bg-accent-primary text-text-inverse hover:bg-accent-hover'
                                  : 'border border-border-standard text-text-primary hover:bg-background-secondary'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-background-primary text-text-primary rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border-subtle">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Describe your business idea..."
                    className="flex-1 px-4 py-2 bg-background-primary border border-border-standard rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="px-6 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Start Options */}
            <div className="mt-4">
              <p className="text-sm text-text-secondary mb-3">Quick start options:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickStartOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(option)}
                    className="p-3 text-left bg-background-secondary border border-border-subtle rounded-lg text-text-primary hover:bg-background-tertiary transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Local AI Status */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary">🤖 Local AI Status</h3>
                <button
                  onClick={checkLocalAIStatus}
                  className="text-xs px-2 py-1 bg-background-tertiary rounded text-text-secondary hover:bg-background-primary transition-colors"
                >
                  Refresh
                </button>
              </div>
              
              {aiStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Local AI Service</span>
                    <span className={aiStatus.available ? "text-green-500" : "text-red-500"}>
                      {aiStatus.available ? `● ${aiStatus.provider}` : "○ Offline"}
                    </span>
                  </div>
                  
                  {aiStatus.available && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Available Models</span>
                        <span className="text-text-primary">{aiStatus.models.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Using Local AI</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useLocalAI}
                            onChange={(e) => setUseLocalAI(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-background-tertiary rounded-full peer peer-checked:bg-accent-primary peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                      </div>
                    </>
                  )}
                  
                  {aiStatus.recommendations.length > 0 && (
                    <div className="mt-3 p-3 bg-background-tertiary rounded-lg">
                      <h4 className="text-xs font-semibold text-text-primary mb-2">Setup Notes:</h4>
                      <div className="space-y-1">
                        {aiStatus.recommendations.map((rec, index) => (
                          <div key={index} className="text-xs text-text-secondary">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-text-secondary text-sm">Checking AI status...</div>
              )}
            </div>

            {/* Integration Status */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <h3 className="font-semibold text-text-primary mb-4">🔗 Integration Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Goose AI</span>
                  <span className="text-green-500">● Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Maverick API</span>
                  <span className="text-green-500">● Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Square Services</span>
                  <span className="text-green-500">● Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Claude Code</span>
                  <span className="text-green-500">● Active</span>
                </div>
              </div>
            </div>

            {/* Demo Progress */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <h3 className="font-semibold text-text-primary mb-4">📊 Demo Progress</h3>
              <div className="space-y-3">
                <div className={`flex items-center space-x-3 ${demoStage >= 1 ? 'text-green-500' : 'text-text-muted'}`}>
                  <div className={`w-2 h-2 rounded-full ${demoStage >= 1 ? 'bg-green-500' : 'bg-border-standard'}`}></div>
                  <span className="text-sm">Business idea analysis</span>
                </div>
                <div className={`flex items-center space-x-3 ${demoStage >= 2 ? 'text-green-500' : 'text-text-muted'}`}>
                  <div className={`w-2 h-2 rounded-full ${demoStage >= 2 ? 'bg-green-500' : 'bg-border-standard'}`}></div>
                  <span className="text-sm">Formation initiation</span>
                </div>
                <div className={`flex items-center space-x-3 ${demoStage >= 3 ? 'text-green-500' : 'text-text-muted'}`}>
                  <div className={`w-2 h-2 rounded-full ${demoStage >= 3 ? 'bg-green-500' : 'bg-border-standard'}`}></div>
                  <span className="text-sm">Legal document generation</span>
                </div>
                <div className={`flex items-center space-x-3 ${demoStage >= 4 ? 'text-green-500' : 'text-text-muted'}`}>
                  <div className={`w-2 h-2 rounded-full ${demoStage >= 4 ? 'bg-green-500' : 'bg-border-standard'}`}></div>
                  <span className="text-sm">Square integration setup</span>
                </div>
                <div className={`flex items-center space-x-3 ${demoStage >= 5 ? 'text-green-500' : 'text-text-muted'}`}>
                  <div className={`w-2 h-2 rounded-full ${demoStage >= 5 ? 'bg-green-500' : 'bg-border-standard'}`}></div>
                  <span className="text-sm">App generation</span>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <h3 className="font-semibold text-text-primary mb-4">🎯 AI Capabilities</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                <div>• Natural language business planning</div>
                <div>• Real-time market analysis</div>
                <div>• Automated legal document generation</div>
                <div>• Square API integration</div>
                <div>• Custom app development with Claude Code</div>
                <div>• End-to-end business deployment</div>
              </div>
            </div>

            {/* Demo Info */}  
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Demo Information</h3>
              <p className="text-blue-700 text-sm">
                This is a simulated demo showing how Goose AI would interact with Maverick. 
                In the real system, all integrations would be live and actions would actually 
                create your business.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}