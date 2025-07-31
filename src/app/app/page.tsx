'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'
import { BusinessList } from '@/components/BusinessList'
import { ProjectList } from '@/components/ProjectList'
import { DocumentCanvas } from '@/components/DocumentCanvas'
import { AIAssistant } from '@/components/AIAssistant'
import { DemoApp } from '@/components/DemoApp'

export default function App() {
  const { data: session, status } = useSession()
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show demo version if not authenticated
  if (!session) {
    return <DemoApp />
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Business & Projects */}
        <div className="w-80 bg-background-secondary border-r border-border-subtle flex flex-col">
          {/* Business Selection */}
          <div className="p-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Businesses</h2>
            <BusinessList 
              selectedBusiness={selectedBusiness}
              onSelectBusiness={setSelectedBusiness}
            />
          </div>
          
          {/* Projects List */}
          {selectedBusiness && (
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-text-primary">Projects</h3>
                  <button className="px-3 py-1 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-hover">
                    + New
                  </button>
                </div>
                <ProjectList 
                  businessId={selectedBusiness}
                  selectedProject={selectedProject}
                  onSelectProject={setSelectedProject}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedProject ? (
            /* Project View with Documents */
            <div className="flex-1 flex">
              {/* Document/Canvas Area */}
              <div className="flex-1">
                <DocumentCanvas 
                  projectId={selectedProject}
                  selectedDocument={selectedDocument}
                  onSelectDocument={setSelectedDocument}
                />
              </div>
              
              {/* AI Assistant Panel */}
              {showAI && (
                <div className="w-96 border-l border-border-subtle">
                  <AIAssistant 
                    businessId={selectedBusiness}
                    projectId={selectedProject}
                    documentId={selectedDocument}
                  />
                </div>
              )}
            </div>
          ) : selectedBusiness ? (
            /* Business Overview */
            <div className="flex-1 p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-text-primary mb-6">Business Overview</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Square Integration</h3>
                    <p className="text-text-secondary">Connected and operational</p>
                  </div>
                  <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">AI Assistance</h3>
                    <p className="text-text-secondary">Ollama & LM Studio ready</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-text-primary mb-4">Welcome to Maverick</h1>
                <p className="text-xl text-text-secondary mb-8">
                  AI-native business platform with Square integration
                </p>
                <button className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover">
                  Create Your First Business
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Toggle Button */}
      <button
        onClick={() => setShowAI(!showAI)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent-primary text-white rounded-full shadow-lg hover:bg-accent-hover flex items-center justify-center text-xl"
      >
        🤖
      </button>
    </div>
  )
}