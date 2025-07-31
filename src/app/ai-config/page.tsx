'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'

interface AIStatus {
  available: boolean
  provider: string | null
  models: string[]
  recommendations: string[]
}

interface AIAvailability {
  ollama: boolean
  lmstudio: boolean
  availableModels: {
    ollama: string[]
    lmstudio: string[]
  }
}

export default function AIConfig() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [availability, setAvailability] = useState<AIAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama3.1:8b')
  const [selectedProvider, setSelectedProvider] = useState<'ollama' | 'lmstudio'>('ollama')

  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      // Check basic status
      const statusResponse = await fetch('/api/local-ai')
      const statusData = await statusResponse.json()
      setStatus(statusData)

      // Check detailed availability
      const availabilityResponse = await fetch('/api/local-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-availability' })
      })
      
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailability(availabilityData.data)
      }
    } catch (error) {
      console.error('Error checking AI status:', error)
    } finally {
      setLoading(false)
    }
  }

  const testAI = async () => {
    if (!testMessage.trim()) return
    
    setTestLoading(true)
    setTestResponse('')
    
    try {
      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          type: 'business_guidance',
          context: { currentContext: 'testing' },
          data: {
            provider: selectedProvider,
            model: selectedModel
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResponse(data.response)
      } else {
        setTestResponse(`Error: ${data.error}`)
      }
    } catch (error) {
      setTestResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTestLoading(false)
    }
  }

  const downloadModel = async (model: string) => {
    // This would need to call ollama pull through a separate endpoint
    alert(`To download ${model}, run this command in your terminal:\n\nollama pull ${model}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Checking AI services...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">AI Configuration</h1>
          <p className="text-text-secondary mt-2">Configure and test your local AI services (Ollama & LM Studio)</p>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Service Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${availability?.ollama ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium text-text-primary">Ollama</div>
                    <div className="text-sm text-text-secondary">http://localhost:11434</div>
                  </div>
                </div>
                <div className="text-sm">
                  {availability?.ollama ? (
                    <span className="text-green-600 font-medium">Connected</span>
                  ) : (
                    <span className="text-red-600 font-medium">Offline</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${availability?.lmstudio ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium text-text-primary">LM Studio</div>
                    <div className="text-sm text-text-secondary">http://localhost:1234</div>
                  </div>
                </div>
                <div className="text-sm">
                  {availability?.lmstudio ? (
                    <span className="text-green-600 font-medium">Connected</span>
                  ) : (
                    <span className="text-red-600 font-medium">Offline</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={checkAIStatus}
              className="mt-4 w-full px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              Refresh Status
            </button>
          </div>

          <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Available Models</h2>
            
            {availability?.ollama && availability.availableModels.ollama.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-text-primary mb-2">Ollama Models</h3>
                <div className="space-y-2">
                  {availability.availableModels.ollama.map((model) => (
                    <div key={model} className="flex items-center justify-between p-2 bg-background-tertiary rounded">
                      <span className="text-sm text-text-primary">{model}</span>
                      {model.includes('llama3.1') && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Recommended</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availability?.lmstudio && availability.availableModels.lmstudio.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-text-primary mb-2">LM Studio Models</h3>
                <div className="space-y-2">
                  {availability.availableModels.lmstudio.map((model) => (
                    <div key={model} className="flex items-center justify-between p-2 bg-background-tertiary rounded">
                      <span className="text-sm text-text-primary">{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status?.recommendations && (
              <div className="mt-4">
                <h3 className="font-medium text-text-primary mb-2">Recommendations</h3>
                <div className="space-y-2">
                  {status.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-text-secondary p-2 bg-background-tertiary rounded">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!availability?.ollama && !availability?.lmstudio && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="font-semibold text-text-primary mb-2">No AI Services Found</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Install Ollama or LM Studio to get started with local AI
                </p>
                <div className="space-x-4">
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    Get Ollama
                  </a>
                  <a
                    href="https://lmstudio.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-border-subtle transition-colors"
                  >
                    Get LM Studio
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Interface */}
        {(availability?.ollama || availability?.lmstudio) && (
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Test AI Chat</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as 'ollama' | 'lmstudio')}
                  className="w-full p-3 border border-border-standard rounded-lg bg-background-primary text-text-primary"
                >
                  {availability?.ollama && <option value="ollama">Ollama</option>}
                  {availability?.lmstudio && <option value="lmstudio">LM Studio</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 border border-border-standard rounded-lg bg-background-primary text-text-primary"
                >
                  {selectedProvider === 'ollama' && availability?.availableModels.ollama.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                  {selectedProvider === 'lmstudio' && availability?.availableModels.lmstudio.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Test Message</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Ask a business question... e.g., 'How do I start an LLC in Delaware?'"
                  className="w-full p-3 border border-border-standard rounded-lg bg-background-primary text-text-primary placeholder-text-muted resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={testAI}
                disabled={testLoading || !testMessage.trim()}
                className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Thinking...
                  </div>
                ) : (
                  'Test AI Response'
                )}
              </button>

              {testResponse && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">AI Response</label>
                  <div className="p-4 bg-background-tertiary rounded-lg border border-border-subtle">
                    <pre className="whitespace-pre-wrap text-sm text-text-primary">{testResponse}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Setup Guide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🚀 Quick Setup Guide</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>1. Install Ollama:</strong>
              <code className="ml-2 px-2 py-1 bg-blue-100 rounded">brew install ollama</code>
            </div>
            <div>
              <strong>2. Start Ollama:</strong>
              <code className="ml-2 px-2 py-1 bg-blue-100 rounded">ollama serve</code>
            </div>
            <div>
              <strong>3. Download a model:</strong>
              <code className="ml-2 px-2 py-1 bg-blue-100 rounded">ollama pull llama3.1:8b</code>
            </div>
            <div>
              <strong>4. Refresh this page</strong> and test the AI chat above!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}