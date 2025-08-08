'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu'
import { 
  Bot, 
  ChevronDown, 
  CheckCircle, 
  XCircle, 
  Cloud, 
  Monitor, 
  Server, 
  Settings,
  Zap
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
}

interface ModelProviderSwitcherProps {
  className?: string
  onProviderChange?: (providerId: string, model: string) => void
  showBadge?: boolean
  compact?: boolean
}

export default function ModelProviderSwitcher({ 
  className = '', 
  onProviderChange,
  showBadge = true,
  compact = false
}: ModelProviderSwitcherProps) {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/ai-providers')
      if (response.ok) {
        const data = await response.json()
        const providerList = data.providers || []
        setProviders(providerList)
        
        // Set default active provider
        const defaultProvider = providerList.find((p: AIProvider) => p.config.isDefault) || providerList[0]
        if (defaultProvider) {
          setActiveProvider(defaultProvider.id)
          setActiveModel(defaultProvider.config.model || defaultProvider.models[0])
        }
      }
    } catch (error) {
      // Mock data for development
      const mockProviders: AIProvider[] = [
        {
          id: 'claude-cli-default',
          name: 'Claude Code CLI',
          type: 'claude-cli',
          status: 'active',
          models: ['claude-3-5-sonnet-20240620'],
          config: { isDefault: true, model: 'claude-3-5-sonnet-20240620' },
          isLocal: false,
          supportsStreaming: true,
          supportsToolCalls: true
        }
      ]
      setProviders(mockProviders)
      setActiveProvider('claude-cli-default')
      setActiveModel('claude-3-5-sonnet-20240620')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderModelChange = async (providerId: string, model: string) => {
    setActiveProvider(providerId)
    setActiveModel(model)
    
    // Save to user preferences
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProvider: providerId,
          activeModel: model
        })
      })
    } catch (error) {
      console.error('Failed to save provider preference:', error)
    }

    onProviderChange?.(providerId, model)
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'claude-api': return <Cloud className="w-3 h-3" />
      case 'claude-cli': return <Bot className="w-3 h-3" />
      case 'ollama': return <Monitor className="w-3 h-3" />
      case 'lmstudio': return <Server className="w-3 h-3" />
      default: return <Bot className="w-3 h-3" />
    }
  }

  const getProviderDisplayName = (provider: AIProvider) => {
    switch (provider.type) {
      case 'claude-api': return 'Claude API'
      case 'claude-cli': return 'Claude CLI'
      case 'ollama': return 'Ollama'
      case 'lmstudio': return 'LM Studio'
      default: return provider.name
    }
  }

  const getModelDisplayName = (model: string) => {
    // Shorten long model names for display
    if (model.includes('claude-3-5-sonnet')) return 'Claude 3.5 Sonnet'
    if (model.includes('claude-3-opus')) return 'Claude 3 Opus'
    if (model.includes('claude-3-haiku')) return 'Claude 3 Haiku'
    if (model.length > 20) return model.substring(0, 17) + '...'
    return model
  }

  const activeProviderData = providers.find(p => p.id === activeProvider)
  const activeProviders = providers.filter(p => p.status === 'active')

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
        {!compact && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
    )
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`h-8 px-2 ${className}`}>
            {activeProviderData && getProviderIcon(activeProviderData.type)}
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>AI Provider</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activeProviders.map((provider) => (
            <DropdownMenuSub key={provider.id}>
              <DropdownMenuSubTrigger>
                <div className="flex items-center">
                  {getProviderIcon(provider.type)}
                  <span className="ml-2">{provider.name}</span>
                  {provider.id === activeProvider && (
                    <CheckCircle className="w-3 h-3 ml-auto text-green-600" />
                  )}
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {provider.models.map((model) => (
                    <DropdownMenuItem 
                      key={model}
                      onClick={() => handleProviderModelChange(provider.id, model)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{getModelDisplayName(model)}</span>
                        {provider.id === activeProvider && model === activeModel && (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/app/settings/ai-providers" className="flex items-center">
              <Settings className="w-3 h-3 mr-2" />
              Manage Providers
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`h-9 px-3 ${className}`}>
          <div className="flex items-center space-x-2">
            {activeProviderData && (
              <>
                {getProviderIcon(activeProviderData.type)}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">
                    {activeModel ? getModelDisplayName(activeModel) : 'Select Model'}
                  </span>
                  <span className="text-xs text-gray-500 leading-none mt-0.5">
                    {getProviderDisplayName(activeProviderData)}
                  </span>
                </div>
              </>
            )}
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>AI Provider & Model</span>
          {showBadge && activeProviderData && (
            <Badge variant={activeProviderData.status === 'active' ? 'default' : 'destructive'} className="text-xs">
              {activeProviderData.status === 'active' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Error
                </>
              )}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {activeProviders.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active providers</p>
            <a href="/app/settings/ai-providers" className="text-blue-600 hover:underline">
              Add a provider
            </a>
          </div>
        ) : (
          activeProviders.map((provider) => (
            <DropdownMenuSub key={provider.id}>
              <DropdownMenuSubTrigger>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {getProviderIcon(provider.type)}
                    <div className="ml-2">
                      <div className="text-sm font-medium">{provider.name}</div>
                      <div className="text-xs text-gray-500">
                        {provider.models.length} model{provider.models.length !== 1 ? 's' : ''} • 
                        {provider.isLocal ? ' Local' : ' Cloud'}
                        {provider.supportsStreaming && ' • Streaming'}
                        {provider.supportsToolCalls && ' • Tools'}
                      </div>
                    </div>
                  </div>
                  {provider.id === activeProvider && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-64">
                  <DropdownMenuLabel className="text-xs">
                    Models for {provider.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {provider.models.map((model) => (
                    <DropdownMenuItem 
                      key={model}
                      onClick={() => handleProviderModelChange(provider.id, model)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{getModelDisplayName(model)}</span>
                        <span className="text-xs text-gray-500 font-mono">{model}</span>
                      </div>
                      {provider.id === activeProvider && model === activeModel && (
                        <div className="flex items-center">
                          <Zap className="w-3 h-3 text-blue-600 mr-1" />
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/app/settings/ai-providers" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Manage AI Providers
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}