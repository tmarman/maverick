'use client'

import { useState, useEffect } from 'react'
import ProjectShell from '@/components/ProjectShell'
import { SettingsNavigation } from '@/components/SettingsNavigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Server, 
  Cloud, 
  Monitor,
  Key,
  Globe,
  Zap,
  RefreshCw,
  Plug,
  CreditCard,
  ArrowLeft
} from 'lucide-react'

interface AIProvider {
  id: string
  name: string
  type: 'claude-api' | 'claude-cli' | 'ollama' | 'lmstudio'
  status: 'active' | 'inactive' | 'error'
  models: string[]
  config: {
    endpoint?: string
    apiKey?: string
    model?: string
    isDefault?: boolean
  }
  isLocal: boolean
  supportsStreaming: boolean
  supportsToolCalls: boolean
  lastUsed?: string
}

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProviderType, setSelectedProviderType] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state for adding providers
  const [newProvider, setNewProvider] = useState({
    name: '',
    endpoint: '',
    apiKey: '',
    model: ''
  })

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      } else {
        throw new Error('Failed to load providers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Mock data for development
      setProviders([
        {
          id: 'claude-cli-default',
          name: 'Claude Code CLI',
          type: 'claude-cli',
          status: 'active',
          models: ['claude-3-5-sonnet-20240620'],
          config: { isDefault: true },
          isLocal: false,
          supportsStreaming: true,
          supportsToolCalls: true,
          lastUsed: new Date().toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const addProvider = async () => {
    if (!selectedProviderType || !newProvider.name) return

    const providerData: Partial<AIProvider> = {
      id: `${selectedProviderType}-${Date.now()}`,
      name: newProvider.name,
      type: selectedProviderType as AIProvider['type'],
      status: 'inactive',
      models: [],
      config: {
        endpoint: newProvider.endpoint,
        apiKey: newProvider.apiKey,
        model: newProvider.model
      },
      isLocal: selectedProviderType === 'ollama' || selectedProviderType === 'lmstudio',
      supportsStreaming: true,
      supportsToolCalls: selectedProviderType !== 'ollama' // Ollama has limited tool support
    }

    try {
      const response = await fetch('/api/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData)
      })

      if (response.ok) {
        const result = await response.json()
        setProviders(prev => [...prev, result.provider])
        setIsAddDialogOpen(false)
        resetForm()
      } else {
        throw new Error('Failed to add provider')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add provider')
    }
  }

  const resetForm = () => {
    setNewProvider({ name: '', endpoint: '', apiKey: '', model: '' })
    setSelectedProviderType('')
  }

  const testProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/ai-providers/${providerId}/test`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        setProviders(prev => prev.map(p => 
          p.id === providerId 
            ? { ...p, status: result.success ? 'active' : 'error', models: result.models || p.models }
            : p
        ))
      }
    } catch (err) {
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, status: 'error' } : p
      ))
    }
  }

  const deleteProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProviders(prev => prev.filter(p => p.id !== providerId))
      }
    } catch (err) {
      setError('Failed to delete provider')
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'claude-api': return <Cloud className="w-5 h-5" />
      case 'claude-cli': return <Bot className="w-5 h-5" />
      case 'ollama': return <Monitor className="w-5 h-5" />
      case 'lmstudio': return <Server className="w-5 h-5" />
      default: return <Bot className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getProviderTypeDisplayName = (type: string) => {
    switch (type) {
      case 'claude-api': return 'Claude API'
      case 'claude-cli': return 'Claude Code CLI'
      case 'ollama': return 'Ollama'
      case 'lmstudio': return 'LM Studio'
      default: return type
    }
  }

  return (
    <ProjectShell title="AI Providers" sidebarContent={<SettingsNavigation />}>
      <div className="h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Providers</h1>
            <p className="text-gray-600">Bring your own AI keys and models for development</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-xl border-gray-200">
              <DialogHeader>
                <DialogTitle>Add AI Provider</DialogTitle>
                <DialogDescription>
                  Connect your own AI API keys or local models. Your credentials are stored securely and encrypted in your Maverick workspace.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <Select value={selectedProviderType} onValueChange={setSelectedProviderType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-api">
                        <div className="flex items-center">
                          <Cloud className="w-4 h-4 mr-2" />
                          Claude API (Direct)
                        </div>
                      </SelectItem>
                      <SelectItem value="ollama">
                        <div className="flex items-center">
                          <Monitor className="w-4 h-4 mr-2" />
                          Ollama (Local)
                        </div>
                      </SelectItem>
                      <SelectItem value="lmstudio">
                        <div className="flex items-center">
                          <Server className="w-4 h-4 mr-2" />
                          LM Studio (Local)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    placeholder="My Claude API"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {selectedProviderType === 'claude-api' && (
                  <>
                    <div>
                      <Label htmlFor="api-key">Anthropic API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="sk-ant-api03-..."
                        value={newProvider.apiKey}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a>
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Select value={newProvider.model} onValueChange={(value) => setNewProvider(prev => ({ ...prev, model: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {(selectedProviderType === 'ollama' || selectedProviderType === 'lmstudio') && (
                  <>
                    <div>
                      <Label htmlFor="endpoint">Endpoint</Label>
                      <Input
                        id="endpoint"
                        placeholder={selectedProviderType === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234'}
                        value={newProvider.endpoint}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, endpoint: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Default Model</Label>
                      <Input
                        id="model"
                        placeholder={selectedProviderType === 'ollama' ? 'llama3.1' : 'local-model'}
                        value={newProvider.model}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, model: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addProvider} disabled={!selectedProviderType || !newProvider.name}>
                  Add Provider
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* BYOK Info Card */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Key className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-medium mb-1">Bring Your Own Keys</div>
            <div className="text-sm">
              Connect your AI provider accounts directly. Your API keys are stored securely and encrypted in your Maverick workspace. 
              Supports Claude API, Ollama (local), and LM Studio (local).
            </div>
          </AlertDescription>
        </Alert>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-3 h-6 text-xs"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getProviderIcon(provider.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {getProviderTypeDisplayName(provider.type)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(provider.status)}>
                    {provider.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {provider.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Provider Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <div className="flex items-center">
                      {provider.isLocal ? <Monitor className="w-3 h-3 mr-1" /> : <Cloud className="w-3 h-3 mr-1" />}
                      <span>{provider.isLocal ? 'Local' : 'Cloud'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Models:</span>
                    <span className="font-mono text-xs">{provider.models.length} available</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Streaming:</span>
                    <span>{provider.supportsStreaming ? '✅' : '❌'}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tools:</span>
                    <span>{provider.supportsToolCalls ? '✅' : '❌'}</span>
                  </div>
                </div>

                {/* Models List */}
                {provider.models.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Models:</h4>
                    <div className="space-y-1">
                      {provider.models.slice(0, 3).map((model) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                      {provider.models.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.models.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => testProvider(provider.id)}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-3 h-3" />
                  </Button>
                  {provider.type !== 'claude-cli' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteProvider(provider.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {providers.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bring Your Own AI</h3>
              <p className="text-gray-500 mb-4">Connect your Claude API key or run local models to get started</p>
              <div className="flex justify-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Cloud className="w-4 h-4 mr-1" />
                  Claude API
                </div>
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-1" />
                  Ollama
                </div>
                <div className="flex items-center">
                  <Server className="w-4 h-4 mr-1" />
                  LM Studio
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProjectShell>
  )
}