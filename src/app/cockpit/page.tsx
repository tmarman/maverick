'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { marked } from 'marked'

// Company = Repository structure
interface Company {
  id: string
  name: string
  description?: string
  repositoryUrl?: string
  products: Product[]
}

// Product = Subdirectory with submodule
interface Product {
  id: string
  name: string
  description?: string
  submoduleUrl?: string // Points to actual code repo
  path: string // e.g., /products/App/
  features: Feature[]
}

// Features organized by functional areas
interface Feature {
  id: string
  title: string
  description?: string
  status: 'planned' | 'in_progress' | 'in_review' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  functionalArea: 'Software' | 'Legal' | 'Operations' | 'Marketing'
  githubIssue?: number
  chatHistory: ChatMessage[]
  estimatedEffort?: string
  assignee?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ViewMode = 'dashboard' | 'board' | 'list' | 'chat'

// Project Onboarding Chat Interface
interface ProjectOnboardingChatProps {
  companyName: string
  onProjectCreated: (project: any) => void
}

function ProjectOnboardingChat({ companyName, onProjectCreated }: ProjectOnboardingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm Maverick, your AI project architect. I'm here to help you create your first project for ${companyName}.

Let's start with a conversation about what you want to build. I'll help you define your project and then generate comprehensive specifications, requirements, and design documents.

**What kind of project would you like to create?** Some examples:
• A mobile app for your customers
• A marketing website or landing page  
• An e-commerce platform
• A business management system
• An internal workflow tool

Just describe your idea in your own words!`,
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectData, setProjectData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsGenerating(true)

    try {
      // If we don't have project data yet, we're still in discovery phase
      if (!projectData) {
        // First, let Claude help define the project
        const response = await fetch('/api/cockpit/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            phase: 'discovery'
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          const assistantMessage: ChatMessage = {
            id: Date.now().toString() + '_assistant',
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }

          setMessages(prev => [...prev, assistantMessage])

          // Check if Claude thinks we're ready to create the project
          if (data.readyToCreate && data.projectSuggestion) {
            setProjectData(data.projectSuggestion)
          }
        }
      } else {
        // We have project data, now we're refining or ready to create
        const response = await fetch('/api/cockpit/onboarding/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectData,
            userInput: currentMessage,
            conversationHistory: messages
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.project) {
            // Project was created successfully
            const successMessage: ChatMessage = {
              id: Date.now().toString() + '_success',
              role: 'assistant',
              content: `🎉 **Project Created Successfully!**

**${data.project.name}** has been created with the following documents:

📋 **specifications.md** - Complete project specifications and scope
📄 **requirements.md** - Detailed functional and technical requirements  
🎨 **design.md** - UI/UX design guidelines and mockups
🏗️ **architecture.md** - Technical architecture and implementation plan

Your project is now ready! You can start adding features and building your vision.`,
              timestamp: new Date()
            }

            setMessages(prev => [...prev, successMessage])
            
            // Call the callback to refresh the parent component
            setTimeout(() => {
              onProjectCreated(data.project)
            }, 2000)
          } else {
            // Claude provided more guidance
            const assistantMessage: ChatMessage = {
              id: Date.now().toString() + '_assistant',
              role: 'assistant',
              content: data.message,
              timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
          }
        }
      }
    } catch (error) {
      console.error('Error in onboarding chat:', error)
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or refresh the page.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Configure marked for safe rendering
  const renderMarkdown = (content: string) => {
    try {
      // Use marked.parse() which is the synchronous method
      const html = marked.parse(content, {
        breaks: true,
        gfm: true
      })
      
      // Ensure we have a string
      const htmlString = typeof html === 'string' ? html : String(html)
      
      // Apply styling to the generated HTML
      return htmlString
        .replace(/<h([1-6])>/g, '<h$1 class="font-bold mt-4 mb-2">')
        .replace(/<p>/g, '<p class="mb-3 leading-relaxed">')
        .replace(/<ul>/g, '<ul class="list-disc ml-6 mb-4 space-y-1">')
        .replace(/<ol>/g, '<ol class="list-decimal ml-6 mb-4 space-y-1">')
        .replace(/<li>/g, '<li class="leading-relaxed">')
        .replace(/<strong>/g, '<strong class="font-semibold">')
        .replace(/<code>/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">')
        .replace(/<pre><code>/g, '<pre class="bg-gray-100 text-gray-800 rounded p-3 my-3 overflow-x-auto"><code class="text-sm font-mono">')
        .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-blue-400 pl-4 italic my-3">')
    } catch (error) {
      console.error('Markdown parsing error:', error)
      // Fallback to plain text with line breaks
      return content.replace(/\n/g, '<br>')
    }
  }

  return (
    <div className="h-full flex flex-col bg-background-primary">
      {/* Header */}
      <div className="border-b border-border-subtle p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            🚀 Create Your First Project
          </h1>
          <p className="text-text-secondary">
            Let's have a conversation about your project idea. I'll help you define it and generate all the necessary documents.
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : 'bg-background-secondary border border-border-subtle mr-12'
                }`}
              >
                <div 
                  className={`prose prose-sm max-w-none ${
                    message.role === 'user' 
                      ? 'prose-invert' 
                      : 'prose-gray'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                />
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-text-muted'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-2xl px-6 py-4 bg-background-secondary border border-border-subtle mr-12">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-text-muted text-sm">Maverick is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border-subtle p-6 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your project idea..."
                className="w-full px-4 py-3 border border-border-standard rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                disabled={isGenerating}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isGenerating}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
          
          {projectData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-600">✅</span>
                <span className="font-medium text-green-800">Project Ready to Create</span>
              </div>
              <p className="text-sm text-green-700">
                <strong>{projectData.name}</strong> - {projectData.description}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Say "create the project" or ask me to refine anything first.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CockpitContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNewFeatureModal, setShowNewFeatureModal] = useState(false)
  const [newFeatureTitle, setNewFeatureTitle] = useState('')
  const [newFeatureDescription, setNewFeatureDescription] = useState('')
  const [newFeaturePriority, setNewFeaturePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [newFeatureFunctionalArea, setNewFeatureFunctionalArea] = useState<'Software' | 'Legal' | 'Operations' | 'Marketing'>('Software')
  const [generatingSpecs, setGeneratingSpecs] = useState(false)
  const [showGitHubImportModal, setShowGitHubImportModal] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')
  const [importingFromGitHub, setImportingFromGitHub] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectType, setNewProjectType] = useState<'SOFTWARE' | 'MARKETING' | 'OPERATIONS' | 'LEGAL'>('SOFTWARE')
  const [creatingProject, setCreatingProject] = useState(false)

  // Initialize from URL parameters
  useEffect(() => {
    const company = searchParams.get('company')
    const project = searchParams.get('project')
    const feature = searchParams.get('feature')
    const view = searchParams.get('view') as ViewMode

    if (company) setSelectedCompany(company)
    if (project) setSelectedProduct(project)
    if (feature) setSelectedFeature(feature)
    if (view && ['dashboard', 'board', 'list', 'chat'].includes(view)) {
      setViewMode(view)
    }
  }, [searchParams])

  // Fetch real data from database
  useEffect(() => {
    fetchCompanies()
  }, [])

  // Update URL when state changes
  const updateURL = (updates: {
    company?: string | null
    project?: string | null
    feature?: string | null
    view?: ViewMode
  }) => {
    const current = new URLSearchParams(window.location.search)
    
    if (updates.company !== undefined) {
      if (updates.company) current.set('company', updates.company)
      else current.delete('company')
    }
    if (updates.project !== undefined) {
      if (updates.project) current.set('project', updates.project)
      else current.delete('project')
    }
    if (updates.feature !== undefined) {
      if (updates.feature) current.set('feature', updates.feature)
      else current.delete('feature')
    }
    if (updates.view !== undefined) {
      if (updates.view !== 'dashboard') current.set('view', updates.view)
      else current.delete('view')
    }

    const newURL = `/cockpit${current.toString() ? '?' + current.toString() : ''}`
    router.replace(newURL, { scroll: false })
  }

  // Wrapper functions for state updates that also update URL
  const selectCompany = (companyId: string | null) => {
    setSelectedCompany(companyId)
    setSelectedProduct(null)
    setSelectedFeature(null)
    setViewMode('dashboard')
    updateURL({ 
      company: companyId, 
      project: null, 
      feature: null, 
      view: 'dashboard' 
    })
  }

  const selectProduct = (projectId: string | null) => {
    setSelectedProduct(projectId)
    setSelectedFeature(null)
    setViewMode('dashboard')
    updateURL({ 
      project: projectId, 
      feature: null, 
      view: 'dashboard' 
    })
  }

  const selectFeature = (featureId: string | null) => {
    setSelectedFeature(featureId)
    if (featureId) {
      setViewMode('chat')
      updateURL({ feature: featureId, view: 'chat' })
    } else {
      updateURL({ feature: null })
    }
  }

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    updateURL({ view: mode })
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/cockpit/companies')
      if (response.ok) {
        const companiesData = await response.json()
        setCompanies(companiesData)
        if (companiesData.length > 0 && !searchParams.get('company')) {
          const firstCompanyId = companiesData[0].id
          setSelectedCompany(firstCompanyId)
          updateURL({ company: firstCompanyId })
        }
      } else {
        console.error('Failed to fetch companies - using fallback demo data')
        loadFallbackData()
      }
    } catch (error) {
      console.error('Error fetching companies - using fallback demo data:', error)
      loadFallbackData()
    } finally {
      setLoading(false)
    }
  }

  const loadFallbackData = () => {
    const mockCompany: Company = {
      id: 'maverick-company-demo',
      name: 'Maverick (Demo Mode)',
      description: 'AI-native founder platform - Database unavailable, showing demo data',
      repositoryUrl: 'https://github.com/user/maverick',
      products: [
        {
          id: 'main-app',
          name: 'App',
          description: 'Main Maverick application',
          path: '/products/App/',
          submoduleUrl: 'https://github.com/user/maverick-app',
          features: [
            {
              id: 'auth-system',
              title: 'Magic Link Authentication System',
              description: 'Implement passwordless authentication using Azure Communication Services',
              status: 'done',
              priority: 'high',
              functionalArea: 'Software',
              estimatedEffort: '1w',
              assignee: 'Claude',
              chatHistory: [
                {
                  id: '1',
                  role: 'user',
                  content: 'I need to implement magic link authentication',
                  timestamp: new Date('2025-08-01T10:00:00Z')
                },
                {
                  id: '2', 
                  role: 'assistant',
                  content: 'I can help you implement magic link authentication. We should use Azure Communication Services for reliable email delivery. Let me break this down into steps...',
                  timestamp: new Date('2025-08-01T10:01:00Z')
                }
              ]
            },
            {
              id: 'cockpit-interface',
              title: 'Product Building Cockpit Interface',
              description: 'Chat-centric interface for managing Company → Product → Feature hierarchy',
              status: 'in_progress',
              priority: 'high',
              functionalArea: 'Software',
              estimatedEffort: '2w',
              assignee: 'Claude',
              chatHistory: [
                {
                  id: '3',
                  role: 'user',
                  content: 'We need a cockpit interface to manage product development',
                  timestamp: new Date('2025-08-01T11:00:00Z')
                },
                {
                  id: '4',
                  role: 'assistant',
                  content: 'Perfect! Let me create a comprehensive cockpit interface with Company → Product → Feature hierarchy...',
                  timestamp: new Date('2025-08-01T11:01:00Z')
                }
              ]
            },
            {
              id: 'square-payments',
              title: 'Square Payment Integration',
              description: 'Integrate Square Web Payments SDK for business formation payments',
              status: 'done',
              priority: 'high',
              functionalArea: 'Software',
              estimatedEffort: '2w',
              assignee: 'Claude',
              chatHistory: []
            },
            {
              id: 'legal-docs',
              title: 'Privacy Policy & Terms of Service',
              description: 'Generate compliant legal documents for the platform',
              status: 'done',
              priority: 'medium',
              functionalArea: 'Legal',
              estimatedEffort: '1w',
              assignee: 'Claude',
              chatHistory: []
            },
            {
              id: 'github-ops',
              title: 'GitHub Repository Operations',
              description: 'Automated repository management, deployments, and code synchronization',
              status: 'done',
              priority: 'medium',
              functionalArea: 'Operations',
              estimatedEffort: '2w',
              assignee: 'Claude',
              chatHistory: []
            },
            {
              id: 'marketing-optimization',
              title: 'Landing Page Conversion Optimization',
              description: 'Improve conversion rates and messaging clarity on homepage',
              status: 'planned',
              priority: 'medium',
              functionalArea: 'Marketing',
              estimatedEffort: '1w',
              assignee: 'Unassigned',
              chatHistory: []
            }
          ]
        }
      ]
    }
    
    setCompanies([mockCompany])
    setSelectedCompany(mockCompany.id)
    updateURL({ company: mockCompany.id })
  }

  const user = session?.user || { 
    name: 'Anonymous User', 
    email: 'anonymous@localhost',
    id: 'anonymous' 
  }

  const selectedCompanyData = companies.find(c => c.id === selectedCompany)
  const selectedProductData = selectedCompanyData?.products.find(p => p.id === selectedProduct)
  const selectedFeatureData = selectedProductData?.features.find(f => f.id === selectedFeature)

  const getFeaturesByArea = (area: string) => {
    if (!selectedProductData) return []
    return selectedProductData.features.filter(f => f.functionalArea === area)
  }

  const getFeaturesByStatus = (status: string) => {
    if (!selectedProductData) return []
    return selectedProductData.features.filter(f => f.status === status)
  }

  const getTotalFeatures = () => selectedProductData?.features.length || 0
  const getCompletedFeatures = () => selectedProductData?.features.filter(f => f.status === 'done').length || 0
  const getInProgressFeatures = () => selectedProductData?.features.filter(f => f.status === 'in_progress').length || 0

  const createNewFeature = async () => {
    if (!newFeatureTitle.trim() || !selectedProduct) return

    setGeneratingSpecs(true)
    try {
      const newFeature: Feature = {
        id: `feature-${Date.now()}`,
        title: newFeatureTitle.trim(),
        description: newFeatureDescription.trim() || `New ${newFeatureFunctionalArea.toLowerCase()} feature`,
        status: 'planned',
        priority: newFeaturePriority,
        functionalArea: newFeatureFunctionalArea,
        chatHistory: [],
        estimatedEffort: 'TBD',
        assignee: 'Claude'
      }

      // Create feature with AI-generated specs
      const response = await fetch('/api/cockpit/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          feature: newFeature,
          generateSpecs: true
        })
      })

      if (response.ok) {
        const { feature: createdFeature } = await response.json()
        
        // Update local state
        setCompanies(prevCompanies =>
          prevCompanies.map(company => ({
            ...company,
            products: company.products.map(product =>
              product.id === selectedProduct
                ? { ...product, features: [...product.features, createdFeature] }
                : product
            )
          }))
        )
        
        // Close modal and reset form
        setShowNewFeatureModal(false)
        setNewFeatureTitle('')
        setNewFeatureDescription('')
        setNewFeaturePriority('medium')
        setNewFeatureFunctionalArea('Software')
        
        // Navigate to the new feature
        selectFeature(createdFeature.id)
        
      } else {
        console.error('Failed to create feature')
        // Fallback: create feature locally without AI specs
        const fallbackFeature = {
          ...newFeature,
          chatHistory: [{
            id: '1',
            role: 'assistant' as const,
            content: `I'll help you build "${newFeature.title}". Let's start by discussing the requirements and breaking this down into actionable steps.`,
            timestamp: new Date()
          }]
        }
        
        setCompanies(prevCompanies =>
          prevCompanies.map(company => ({
            ...company,
            products: company.products.map(product =>
              product.id === selectedProduct
                ? { ...product, features: [...product.features, fallbackFeature] }
                : product
            )
          }))
        )
        
        setShowNewFeatureModal(false)
        setNewFeatureTitle('')
        setNewFeatureDescription('')
        setNewFeaturePriority('medium')
        setNewFeatureFunctionalArea('Software')
        selectFeature(fallbackFeature.id)
      }
    } catch (error) {
      console.error('Error creating feature:', error)
    } finally {
      setGeneratingSpecs(false)
    }
  }

  const generateFeatureCode = async (feature: Feature) => {
    if (!feature || sendingMessage) return

    const codeGenerationPrompt = `Based on our conversation about "${feature.title}", please generate the implementation code.

Feature Context:
- Description: ${feature.description}
- Functional Area: ${feature.functionalArea}
- Priority: ${feature.priority}
- Status: ${feature.status}

Conversation History:
${feature.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Please generate production-ready code with:
1. Implementation files
2. Tests
3. Documentation
4. Integration instructions

Focus on clean, maintainable code that follows best practices.`

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/cockpit/features/${feature.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: codeGenerationPrompt })
      })

      if (response.ok) {
        const { chatHistory } = await response.json()
        
        setCompanies(prevCompanies =>
          prevCompanies.map(company => ({
            ...company,
            products: company.products.map(product => ({
              ...product,
              features: product.features.map(f =>
                f.id === feature.id
                  ? { ...f, chatHistory }
                  : f
              )
            }))
          }))
        )
      }
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const generateFeatureSpecs = async (feature: Feature) => {
    if (!feature || sendingMessage) return

    const specsGenerationPrompt = `Please create detailed technical specifications for "${feature.title}".

Current Context:
- Description: ${feature.description}
- Functional Area: ${feature.functionalArea}
- Priority: ${feature.priority}

Please provide:
1. Detailed requirements and acceptance criteria
2. User stories and use cases
3. Technical architecture and approach
4. API specifications (if applicable)
5. Database schema changes (if needed)
6. Security considerations
7. Performance requirements
8. Testing strategy

Format as a comprehensive specification document.`

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/cockpit/features/${feature.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: specsGenerationPrompt })
      })

      if (response.ok) {
        const { chatHistory } = await response.json()
        
        setCompanies(prevCompanies =>
          prevCompanies.map(company => ({
            ...company,
            products: company.products.map(product => ({
              ...product,
              features: product.features.map(f =>
                f.id === feature.id
                  ? { ...f, chatHistory }
                  : f
              )
            }))
          }))
        )
      }
    } catch (error) {
      console.error('Error generating specs:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const generateFeatureTests = async (feature: Feature) => {
    if (!feature || sendingMessage) return

    const testsGenerationPrompt = `Generate comprehensive tests for "${feature.title}".

Feature Context:
- Description: ${feature.description}
- Functional Area: ${feature.functionalArea}

Please create:
1. Unit tests
2. Integration tests
3. End-to-end tests
4. Test data and fixtures
5. Test utilities and helpers
6. Performance tests (if applicable)
7. Security tests (if applicable)

Include setup instructions and testing guidelines.`

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/cockpit/features/${feature.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testsGenerationPrompt })
      })

      if (response.ok) {
        const { chatHistory } = await response.json()
        
        setCompanies(prevCompanies =>
          prevCompanies.map(company => ({
            ...company,
            products: company.products.map(product => ({
              ...product,
              features: product.features.map(f =>
                f.id === feature.id
                  ? { ...f, chatHistory }
                  : f
              )
            }))
          }))
        )
      }
    } catch (error) {
      console.error('Error generating tests:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const importFromGitHub = async () => {
    if (!githubUrl.trim() || !selectedCompany || !selectedProduct || importingFromGitHub) return

    setImportingFromGitHub(true)
    try {
      const response = await fetch('/api/cockpit/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl: githubUrl.trim(),
          businessId: selectedCompany,
          projectId: selectedProduct
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add the imported features to the local state
        if (result.features && result.features.length > 0) {
          setCompanies(prevCompanies =>
            prevCompanies.map(company => 
              company.id === selectedCompany
                ? {
                    ...company,
                    products: company.products.map(product =>
                      product.id === selectedProduct
                        ? { ...product, features: [...product.features, ...result.features] }
                        : product
                    )
                  }
                : company
            )
          )
          
          // Close modal and reset form
          setShowGitHubImportModal(false)
          setGithubUrl('')
          
          // Navigate to the first imported feature
          if (result.features[0]) {
            selectFeature(result.features[0].id)
          }
          
          alert(`Successfully imported ${result.featuresCreated} features from ${githubUrl}`)
        }
      } else {
        const error = await response.json()
        alert(`Failed to import from GitHub: ${error.error}`)
      }
    } catch (error) {
      console.error('Error importing from GitHub:', error)
      alert('Failed to import from GitHub. Please try again.')
    } finally {
      setImportingFromGitHub(false)
    }
  }

  const createNewProject = async () => {
    if (!newProjectName.trim() || !selectedCompany) return
    
    setCreatingProject(true)
    try {
      const response = await fetch('/api/cockpit/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          type: newProjectType,
          businessId: selectedCompany
        })
      })

      if (response.ok) {
        const newProject = await response.json()
        
        // Refresh companies data to include the new project
        await fetchCompanies()
        
        // Select the new project
        selectProduct(newProject.id)
        
        // Reset form and close modal
        setNewProjectName('')
        setNewProjectDescription('')
        setNewProjectType('SOFTWARE')
        setShowNewProjectModal(false)
        
        alert('Project created successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to create project: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setCreatingProject(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedFeature || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/cockpit/features/${selectedFeature}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      })

      if (response.ok) {
        const { chatHistory } = await response.json()
        
        setCompanies(prevCompanies =>
          prevCompanies.map(company => ({
            ...company,
            products: company.products.map(product => ({
              ...product,
              features: product.features.map(feature =>
                feature.id === selectedFeature
                  ? { ...feature, chatHistory }
                  : feature
              )
            }))
          }))
        )
        
        setChatMessage('')
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading cockpit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background-primary">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="/design/icon.png" 
                    alt="Maverick" 
                    className="w-8 h-8 rounded-lg"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Maverick</div>
                  <div className="text-xs text-gray-500">Development Hub</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <img 
                    src="/design/icon.png" 
                    alt="Maverick" 
                    className="w-6 h-6 rounded"
                  />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Workspace & Quick Actions */}
        {!sidebarCollapsed && (
          <>
            {/* Workspace Switcher */}
            <div className="px-4 py-3">
              <div className="relative">
                <select
                  value={selectedCompany || ''}
                  onChange={(e) => {
                    selectCompany(e.target.value)
                  }}
                  className="w-full px-3 py-2 pr-8 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Project
                </button>
                <button
                  onClick={() => setShowGitHubImportModal(true)}
                  disabled={!selectedProduct}
                  className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Import
                </button>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        {!sidebarCollapsed && (
          <>
            <nav className="flex-1 px-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">
                  Projects
                </div>
                
                {selectedCompanyData?.products.map((product) => {
                  const featuresCount = product.features.length
                  const completedCount = product.features.filter(f => f.status === 'done').length
                  const inProgressCount = product.features.filter(f => f.status === 'in_progress').length
                  const isSelected = selectedProduct === product.id
                  
                  return (
                    <div key={product.id} className="relative">
                      <button
                        onClick={() => {
                          selectProduct(product.id)
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              inProgressCount > 0 ? 'bg-yellow-400' :
                              featuresCount === completedCount && featuresCount > 0 ? 'bg-green-400' :
                              'bg-gray-300'
                            }`} />
                            <span className="font-medium text-sm truncate">{product.name}</span>
                          </div>
                          {featuresCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                isSelected 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {completedCount}/{featuresCount}
                              </span>
                            </div>
                          )}
                        </div>
                        {product.description && (
                          <div className={`text-xs mt-1 line-clamp-1 ${
                            isSelected ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {product.description}
                          </div>
                        )}
                      </button>
                    </div>
                  )
                })}
                
                {(!selectedCompanyData?.products || selectedCompanyData.products.length === 0) && (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No projects yet</h3>
                    <p className="text-xs text-gray-500 mb-4">Create your first project to start building</p>
                    <button
                      onClick={() => setShowNewProjectModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create project →
                    </button>
                  </div>
                )}

                {/* Settings Section */}
                <div className="mt-8">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">
                    Settings
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      onClick={() => router.push('/cockpit/settings')}
                      className="w-full text-left px-3 py-2.5 rounded-lg transition-colors group hover:bg-gray-50 text-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium text-sm">Account Settings</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => router.push('/cockpit/import/github')}
                      className="w-full text-left px-3 py-2.5 rounded-lg transition-colors group hover:bg-gray-50 text-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span className="font-medium text-sm">Import from GitHub</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.name || user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>
                {session && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => router.push('/cockpit/settings')}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="Settings"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="Sign out"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            {selectedProductData ? (
              <>
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg font-semibold text-gray-900">{selectedProductData.name}</h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {getCompletedFeatures()}/{getTotalFeatures()} tasks
                    </span>
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${getTotalFeatures() > 0 ? (getCompletedFeatures() / getTotalFeatures()) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img 
                    src="/design/icon.png" 
                    alt="Maverick" 
                    className="w-6 h-6 rounded"
                  />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">Maverick Cockpit</h1>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* View Selector */}
            {selectedProduct && (
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                {[
                  { id: 'dashboard', icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z', label: 'Dashboard' },
                  { id: 'board', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2z', label: 'Board' },
                  { id: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'List' },
                  { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => changeViewMode(view.id as ViewMode)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === view.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title={view.label}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={view.icon} clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">{view.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* New Feature Button */}
            {selectedProduct && (
              <button 
                onClick={() => setShowNewFeatureModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Feature</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {!selectedProduct && (!selectedCompanyData?.products || selectedCompanyData.products.length === 0) ? (
            <ProjectOnboardingChat 
              companyName={selectedCompanyData?.name || 'Your Company'}
              onProjectCreated={async (project) => {
                await fetchCompanies()
                selectProduct(project.id)
              }}
            />
          ) : !selectedProduct ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Select a project to start building
                </h3>
                <p className="text-text-secondary">
                  Choose a project from the sidebar to see its features and start building.
                </p>
              </div>
            </div>
          ) : viewMode === 'dashboard' ? (
            <div className="p-8">
              {/* Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{getTotalFeatures()}</div>
                      <div className="text-sm text-gray-600">Total Features</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 text-xl">📋</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{getCompletedFeatures()}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{getInProgressFeatures()}</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 text-xl">🔄</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features by Functional Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {['Software', 'Legal', 'Operations', 'Marketing'].map(area => (
                  <div key={area} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-4">{area}</h3>
                    <div className="space-y-3">
                      {getFeaturesByArea(area).map(feature => (
                        <button
                          key={feature.id}
                          onClick={() => {
                            selectFeature(feature.id)
                          }}
                          className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-900">{feature.title}</span>
                            <span className={`w-2 h-2 rounded-full ${
                              feature.status === 'done' ? 'bg-green-500' :
                              feature.status === 'in_progress' ? 'bg-blue-500' :
                              feature.status === 'blocked' ? 'bg-red-500' :
                              'bg-gray-300'
                            }`}></span>
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {feature.description}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              feature.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              feature.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {feature.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {feature.estimatedEffort || 'No estimate'}
                            </span>
                          </div>
                        </button>
                      ))}
                      {getFeaturesByArea(area).length === 0 && (
                        <div className="text-xs text-gray-400 italic p-2">
                          No {area.toLowerCase()} features yet
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === 'board' ? (
            <div className="p-8">
              {/* Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['planned', 'in_progress', 'in_review', 'done'].map(status => (
                  <div key={status} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 capitalize flex items-center justify-between">
                      {status.replace('_', ' ')}
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {getFeaturesByStatus(status).length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {getFeaturesByStatus(status).map(feature => (
                        <div
                          key={feature.id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all duration-200"
                          onClick={() => {
                            selectFeature(feature.id)
                          }}
                        >
                          <div className="font-medium text-sm mb-2 text-gray-900">{feature.title}</div>
                          <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {feature.description}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              feature.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              feature.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {feature.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {feature.functionalArea}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="p-8">
              {/* List View */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Priority</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Area</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Assignee</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Effort</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProductData?.features.map(feature => (
                      <tr
                        key={feature.id}
                        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          selectFeature(feature.id)
                        }}
                      >
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{feature.title}</div>
                          <div className="text-sm text-gray-600">{feature.description}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            feature.status === 'done' ? 'bg-green-100 text-green-700' :
                            feature.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            feature.status === 'blocked' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {feature.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            feature.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            feature.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {feature.priority}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{feature.functionalArea}</td>
                        <td className="py-4 px-6 text-gray-600">{feature.assignee || 'Unassigned'}</td>
                        <td className="py-4 px-6 text-gray-600">{feature.estimatedEffort || 'No estimate'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewMode === 'chat' && selectedFeatureData ? (
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedFeatureData.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedFeatureData.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedFeatureData.status === 'done' ? 'bg-green-100 text-green-700' :
                        selectedFeatureData.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        selectedFeatureData.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedFeatureData.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {selectedFeatureData.functionalArea}
                      </span>
                      <span className="text-xs text-gray-500">
                        {selectedFeatureData.assignee || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => generateFeatureCode(selectedFeatureData)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <span>⚡</span>
                      <span>Generate Code</span>
                    </button>
                    <button 
                      onClick={() => generateFeatureSpecs(selectedFeatureData)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <span>📋</span>
                      <span>Generate Specs</span>
                    </button>
                    <button 
                      onClick={() => generateFeatureTests(selectedFeatureData)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <span>🧪</span>
                      <span>Generate Tests</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-8 space-y-6 bg-gray-50">
                {selectedFeatureData.chatHistory.length > 0 ? (
                  selectedFeatureData.chatHistory.map(message => (
                    <div
                      key={message.id}
                      className={`max-w-4xl ${
                        message.role === 'user' ? 'ml-auto' : 'mr-auto'
                      }`}
                    >
                      <div className={`p-5 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className={`text-sm leading-relaxed ${
                          message.role === 'user' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {typeof message.content === 'string' && message.content.includes('\n') ? (
                            <div 
                              className={message.role === 'user' ? 'text-white' : 'text-gray-800'}
                              dangerouslySetInnerHTML={{
                                __html: String(marked.parse(message.content))
                                  .replace(/<p>/g, '<p class="mb-2">')
                                  .replace(/<ul>/g, '<ul class="list-disc list-inside mb-2">')
                                  .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-2">')
                                  .replace(/<code>/g, `<code class="${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} px-1 py-0.5 rounded text-sm">`)
                                  .replace(/<pre>/g, `<pre class="${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} p-3 rounded-lg overflow-x-auto">`)
                              }} 
                            />
                          ) : (
                            message.content
                          )}
                        </div>
                        <div className={`text-xs mt-3 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-6">💬</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Start building this feature
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Chat with Maverick AI to plan, design, and implement this feature step by step.
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-gray-200 bg-white">
                <div className="max-w-4xl mx-auto flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Describe what you want to build..."
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      disabled={sendingMessage}
                    />
                  </div>
                  <button 
                    onClick={sendChatMessage}
                    disabled={sendingMessage || !chatMessage.trim()}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors flex items-center space-x-2"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Select a feature to start building
                </h3>
                <p className="text-text-secondary">
                  Choose a feature from the sidebar to start chatting and building.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Feature Modal */}
      {showNewFeatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-primary rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Create New Feature</h2>
                <button
                  onClick={() => {
                    setShowNewFeatureModal(false)
                    setNewFeatureTitle('')
                    setNewFeatureDescription('')
                    setNewFeaturePriority('medium')
                    setNewFeatureFunctionalArea('Software')
                  }}
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Task Input (Asana-style) */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Feature Title
                </label>
                <input
                  type="text"
                  value={newFeatureTitle}
                  onChange={(e) => setNewFeatureTitle(e.target.value)}
                  placeholder="e.g., User dashboard with analytics"
                  className="w-full px-4 py-3 border border-border-standard rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newFeatureDescription}
                  onChange={(e) => setNewFeatureDescription(e.target.value)}
                  placeholder="Brief description of what this feature should do..."
                  rows={3}
                  className="w-full px-4 py-3 border border-border-standard rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Functional Area
                  </label>
                  <select
                    value={newFeatureFunctionalArea}
                    onChange={(e) => setNewFeatureFunctionalArea(e.target.value as any)}
                    className="w-full px-4 py-3 border border-border-standard rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                  >
                    <option value="Software">Software</option>
                    <option value="Legal">Legal</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Priority
                  </label>
                  <select
                    value={newFeaturePriority}
                    onChange={(e) => setNewFeaturePriority(e.target.value as any)}
                    className="w-full px-4 py-3 border border-border-standard rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Feature Templates */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Quick Start Templates (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    // Core Infrastructure
                    {
                      id: 'auth',
                      icon: '🔐',
                      title: 'User Authentication',
                      description: 'Login, registration, password reset, session management',
                      area: 'Software',
                      priority: 'high',
                      category: 'Core Infrastructure'
                    },
                    {
                      id: 'api',
                      icon: '🔌',
                      title: 'REST API',
                      description: 'Backend API with documentation and versioning',
                      area: 'Software',
                      priority: 'high',
                      category: 'Core Infrastructure'
                    },
                    {
                      id: 'database',
                      icon: '🗄️',
                      title: 'Database Schema',
                      description: 'Data models, migrations, and relationships',
                      area: 'Software',
                      priority: 'high',
                      category: 'Core Infrastructure'
                    },
                    
                    // User Experience
                    {
                      id: 'dashboard',
                      icon: '📊',
                      title: 'Analytics Dashboard',
                      description: 'Data visualization and reporting interface',
                      area: 'Software',
                      priority: 'medium',
                      category: 'User Experience'
                    },
                    {
                      id: 'onboarding',
                      icon: '🚀',
                      title: 'User Onboarding',
                      description: 'Welcome flow and initial setup experience',
                      area: 'Software',
                      priority: 'medium',
                      category: 'User Experience'
                    },
                    {
                      id: 'notifications',
                      icon: '🔔',
                      title: 'Notification System',
                      description: 'Email, push, and in-app notifications',
                      area: 'Software',
                      priority: 'medium',
                      category: 'User Experience'
                    },
                    
                    // Business Logic
                    {
                      id: 'payment',
                      icon: '💳',
                      title: 'Payment Processing',
                      description: 'Subscription billing, invoicing, and payment handling',
                      area: 'Software',
                      priority: 'high',
                      category: 'Business Logic'
                    },
                    {
                      id: 'subscription',
                      icon: '💰',
                      title: 'Subscription Management',
                      description: 'Plan management, upgrades, and billing cycles',
                      area: 'Software',
                      priority: 'high',
                      category: 'Business Logic'
                    },
                    
                    // Legal & Compliance
                    {
                      id: 'privacy',
                      icon: '🛡️',
                      title: 'Privacy & GDPR',
                      description: 'Privacy policy, data protection, user consent',
                      area: 'Legal',
                      priority: 'high',
                      category: 'Legal & Compliance'
                    },
                    {
                      id: 'terms',
                      icon: '📄',
                      title: 'Terms of Service',
                      description: 'Legal terms, user agreements, liability',
                      area: 'Legal',
                      priority: 'medium',
                      category: 'Legal & Compliance'
                    },
                    
                    // Marketing & Growth
                    {
                      id: 'landing',
                      icon: '🎯',
                      title: 'Landing Page',
                      description: 'Marketing website with conversion optimization',
                      area: 'Marketing',
                      priority: 'medium',
                      category: 'Marketing & Growth'
                    },
                    {
                      id: 'seo',
                      icon: '🔍',
                      title: 'SEO Optimization',
                      description: 'Search engine optimization and meta tags',
                      area: 'Marketing',
                      priority: 'low',
                      category: 'Marketing & Growth'
                    },
                    {
                      id: 'analytics',
                      icon: '📈',
                      title: 'Marketing Analytics',
                      description: 'Conversion tracking and user behavior analysis',
                      area: 'Marketing',
                      priority: 'medium',
                      category: 'Marketing & Growth'
                    },
                    
                    // Operations & DevOps
                    {
                      id: 'deployment',
                      icon: '🚀',
                      title: 'CI/CD Pipeline',
                      description: 'Automated testing, building, and deployment',
                      area: 'Operations',
                      priority: 'medium',
                      category: 'Operations & DevOps'
                    },
                    {
                      id: 'monitoring',
                      icon: '📡',
                      title: 'System Monitoring',
                      description: 'Error tracking, performance monitoring, alerts',
                      area: 'Operations',
                      priority: 'medium',
                      category: 'Operations & DevOps'
                    }
                  ].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setNewFeatureTitle(template.title)
                        setNewFeatureDescription(template.description)
                        setNewFeatureFunctionalArea(template.area as any)
                        setNewFeaturePriority(template.priority as any)
                      }}
                      className="p-3 text-left border border-border-subtle rounded-lg hover:bg-background-tertiary transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{template.icon}</span>
                        <span className="font-medium text-sm text-text-primary">{template.title}</span>
                      </div>
                      <p className="text-xs text-text-secondary">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Claude Generation Options */}
              <div className="bg-background-secondary rounded-lg p-4 border border-border-subtle">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-text-inverse text-sm">🤖</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-2">AI-Powered Feature Development</h3>
                    <p className="text-sm text-text-secondary mb-3">
                      Let Claude Code help you build this feature from concept to implementation.
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-text-muted">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Requirements & Specs
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Code Generation
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        Testing & Iteration
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewFeatureModal(false)
                  setNewFeatureTitle('')
                  setNewFeatureDescription('')
                  setNewFeaturePriority('medium')
                  setNewFeatureFunctionalArea('Software')
                }}
                className="px-4 py-2 text-text-secondary hover:bg-background-tertiary rounded-lg transition-colors"
                disabled={generatingSpecs}
              >
                Cancel
              </button>
              <button
                onClick={createNewFeature}
                disabled={!newFeatureTitle.trim() || generatingSpecs}
                className="px-6 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                {generatingSpecs ? (
                  <>
                    <div className="w-4 h-4 border-2 border-text-inverse border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Specs...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Create Feature</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Import Modal */}
      {showGitHubImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-primary rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Import from GitHub Repository</h2>
                <button
                  onClick={() => {
                    setShowGitHubImportModal(false)
                    setGithubUrl('')
                  }}
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/design/icon.png" 
                      alt="Maverick AI" 
                      className="w-8 h-8 rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">AI-Powered Repository Analysis</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Claude Code will analyze your repository and automatically create features based on your existing codebase.
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-blue-700">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Code Analysis
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Feature Extraction
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        Chat Contexts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full px-4 py-3 border border-border-standard rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background-primary text-text-primary"
                  autoFocus
                />
                <p className="text-xs text-text-muted mt-2">
                  Enter the full URL to your GitHub repository. The repository should be public or accessible with your GitHub connection.
                </p>
              </div>

              <div className="bg-background-secondary rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-2">What happens during import:</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Claude analyzes your repository structure and code</li>
                  <li>• Features are automatically identified and categorized</li>
                  <li>• Each feature gets an initial AI conversation context</li>
                  <li>• You can immediately start chatting to refine and develop features</li>
                </ul>
              </div>

              {selectedProductData && (
                <div className="bg-background-tertiary rounded-lg p-3 border border-border-subtle">
                  <p className="text-sm text-text-secondary">
                    <strong>Target Project:</strong> {selectedProductData.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Features will be imported into this project
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGitHubImportModal(false)
                  setGithubUrl('')
                }}
                className="px-4 py-2 text-text-secondary hover:bg-background-tertiary rounded-lg transition-colors"
                disabled={importingFromGitHub}
              >
                Cancel
              </button>
              <button
                onClick={importFromGitHub}
                disabled={!githubUrl.trim() || importingFromGitHub || !selectedProduct}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                {importingFromGitHub ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Repository...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Import Features</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-primary rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-border-subtle">
              <h2 className="text-xl font-semibold text-text-primary">Create New Project</h2>
              <p className="text-text-secondary text-sm mt-1">Add a new project to organize your work</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Mobile App, Marketing Website"
                  className="w-full px-3 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of what this project will accomplish"
                  rows={3}
                  className="w-full px-3 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project Type
                </label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value as 'SOFTWARE' | 'MARKETING' | 'OPERATIONS' | 'LEGAL')}
                  className="w-full px-3 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background-primary"
                >
                  <option value="SOFTWARE">Software Development</option>
                  <option value="MARKETING">Marketing & Content</option>
                  <option value="OPERATIONS">Operations & Process</option>
                  <option value="LEGAL">Legal & Compliance</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                  setNewProjectType('SOFTWARE')
                }}
                className="px-4 py-2 text-text-secondary hover:bg-background-tertiary rounded-lg transition-colors"
                disabled={creatingProject}
              >
                Cancel
              </button>
              <button
                onClick={createNewProject}
                disabled={!newProjectName.trim() || creatingProject}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                {creatingProject ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Cockpit() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CockpitContent />
    </Suspense>
  )
}