'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export function DemoApp() {
  const [selectedDemo, setSelectedDemo] = useState<'business' | 'project' | 'document'>('business')

  const demoBusiness = {
    id: 'demo-1',
    name: 'TaskFlow Solutions',
    industry: 'Software Development',
    status: 'ACTIVE',
    description: 'AI-powered task management SaaS for remote teams'
  }

  const demoProjects = [
    {
      id: 'demo-p1',
      name: 'Core Platform',
      type: 'SOFTWARE',
      status: 'ACTIVE',
      description: 'Main SaaS application with user management and billing',
      documents: 12,
      features: 8
    },
    {
      id: 'demo-p2', 
      name: 'Marketing Website',
      type: 'MARKETING',
      status: 'COMPLETED',
      description: 'Landing pages and conversion funnels',
      documents: 6,
      features: 3
    }
  ]

  const demoDocuments = [
    {
      id: 'demo-d1',
      title: 'Product Requirements Document',
      type: 'PRD',
      status: 'APPROVED',
      mode: 'HYBRID',
      description: 'Core platform features and user flows'
    },
    {
      id: 'demo-d2',
      title: 'Technical Architecture',
      type: 'SPEC', 
      status: 'DRAFT',
      mode: 'CANVAS',
      description: 'System design and API specifications'
    },
    {
      id: 'demo-d3',
      title: 'AI Strategy Session',
      type: 'CHAT',
      status: 'PUBLISHED',
      mode: 'CHAT',
      description: 'Discussion with AI about market positioning'
    }
  ]

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-accent-primary to-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            🎭 <strong>Demo Mode</strong> - This shows what your workspace will look like. 
            <Link href="/login" className="underline ml-2 hover:text-yellow-200">
              Sign in to get started →
            </Link>
          </p>
        </div>
      </div>
      
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Business & Projects */}
        <div className="w-80 bg-background-secondary border-r border-border-subtle flex flex-col">
          {/* Demo Business */}
          <div className="p-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Your Businesses</h2>
            <div 
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedDemo === 'business' 
                  ? 'bg-accent-primary bg-opacity-10 border border-accent-primary'
                  : 'bg-background-tertiary hover:bg-border-subtle'
              }`}
              onClick={() => setSelectedDemo('business')}
            >
              <h4 className="font-medium text-text-primary text-sm">{demoBusiness.name}</h4>
              <p className="text-xs text-text-secondary mt-1">{demoBusiness.industry}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {demoBusiness.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Demo Projects */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-text-primary">Projects</h3>
                <button 
                  disabled
                  className="px-3 py-1 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed"
                >
                  + New
                </button>
              </div>
              <div className="space-y-2">
                {demoProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedDemo('project')}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDemo === 'project'
                        ? 'bg-accent-primary bg-opacity-10 border border-accent-primary'
                        : 'bg-background-tertiary hover:bg-border-subtle'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {project.type === 'SOFTWARE' ? '💻' : '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-primary text-sm truncate">{project.name}</h4>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            project.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {project.status}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-text-muted">
                            <span>{project.documents} docs</span>
                            <span>{project.features} features</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedDemo === 'business' && (
            <div className="flex-1 p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-text-primary mb-6">Business Overview</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">🏢 Business Formation</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Legal Structure</span>
                        <span className="font-medium text-text-primary">Delaware C-Corp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">EIN</span>
                        <span className="font-medium text-text-primary">88-1234567</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Formation Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Complete</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Banking</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">💳 Square Integration</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Payment Processing</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Monthly Volume</span>
                        <span className="font-medium text-text-primary">$18,450</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Transactions</span>
                        <span className="font-medium text-text-primary">247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">APIs Connected</span>
                        <span className="font-medium text-text-primary">5 of 8</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">🤖 AI Assistant</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Service</span>
                        <span className="font-medium text-text-primary">Ollama & LM Studio</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Conversations</span>
                        <span className="font-medium text-text-primary">34 sessions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Context</span>
                        <span className="font-medium text-text-primary">Business-aware</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">📊 Project Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Active Projects</span>
                        <span className="font-medium text-text-primary">2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Total Documents</span>
                        <span className="font-medium text-text-primary">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Features in Dev</span>
                        <span className="font-medium text-text-primary">11</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">GitHub Repos</span>
                        <span className="font-medium text-text-primary">3 connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDemo === 'project' && (
            <div className="flex-1 flex flex-col">
              <div className="bg-background-secondary border-b border-border-subtle p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-text-primary">Core Platform Project</h2>
                  <button 
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    + New Document
                  </button>
                </div>
                
                <div className="flex space-x-4">
                  {[
                    { id: 'documents', name: 'Documents', icon: '📄' },
                    { id: 'canvas', name: 'Canvas', icon: '🎨' },
                    { id: 'chat', name: 'AI Chat', icon: '💬' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedDemo('document')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedDemo === 'document' && tab.id === 'documents'
                          ? 'bg-accent-primary text-white'
                          : 'bg-background-tertiary text-text-secondary hover:bg-border-subtle'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {demoDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg bg-background-secondary border border-border-subtle hover:border-accent-primary"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-2xl">
                          {doc.type === 'PRD' ? '📋' : doc.type === 'SPEC' ? '📝' : '💬'}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          doc.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          doc.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-text-primary mb-2">{doc.title}</h3>
                      <p className="text-sm text-text-secondary mb-4">{doc.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>{doc.mode}</span>
                        <span>Last week</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call-to-Action Overlay */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-accent-primary text-white p-4 rounded-xl shadow-lg max-w-sm">
          <h4 className="font-semibold mb-2">Ready to build your business?</h4>
          <p className="text-sm text-white/80 mb-4">
            Get legal formation, AI guidance, and custom apps - all in one platform.
          </p>
          <div className="flex space-x-2">
            <Link 
              href="/login" 
              className="px-4 py-2 bg-white text-accent-primary rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 bg-accent-hover text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}