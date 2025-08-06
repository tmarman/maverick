'use client'

import { useSession } from 'next-auth/react'
import CockpitShell from '@/components/CockpitShell'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Square, User, Building, CreditCard, Settings, Plus, ExternalLink, Bot, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Organization {
  id: string
  name: string
  type: 'personal' | 'organization'
  role: 'owner' | 'admin' | 'member'
  members: number
  plan: 'founder' | 'growth' | 'enterprise'
  billing: {
    status: 'trial' | 'active' | 'past_due' | 'cancelled'
    nextBilling?: string
  }
  integrations: {
    github: boolean
    square: boolean
    claude: boolean
  }
}

interface ClaudeApiSettingsProps {
  connection: any
  onConnectionChange: () => void
}

function ClaudeApiSettings({ connection, onConnectionChange }: ClaudeApiSettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [email, setEmail] = useState('')
  const [subscriptionType, setSubscriptionType] = useState<'free' | 'pro' | 'max'>('free')
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (connection?.connected) {
      setEmail(connection.email || '')
      setSubscriptionType(connection.subscriptionType || 'free')
    }
  }, [connection])

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    if (!apiKey.startsWith('sk-')) {
      setError('API key must start with sk-')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/integrations/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          email: email || undefined,
          subscriptionType
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Claude API connected successfully!')
        setApiKey('')
        onConnectionChange()
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(data.error || 'Failed to connect Claude API')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/integrations/claude', {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Claude API disconnected successfully!')
        setApiKey('')
        setEmail('')
        setSubscriptionType('free')
        onConnectionChange()
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError('Failed to disconnect Claude API')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Claude API Configuration
        </CardTitle>
        <CardDescription>
          Connect your Claude API key to unlock enhanced AI capabilities and faster responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        {connection?.connected ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Claude API Connected</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {connection.subscriptionType || 'API'} Access
              </Badge>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Connected on {new Date(connection.createdAt).toLocaleDateString()}
              {connection.email && ` • ${connection.email}`}
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">Claude API Not Connected</span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Connect your Claude API key to enable direct API access, faster responses, and enhanced AI capabilities
            </p>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="text-green-600">✅</div>
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="text-red-600">❌</div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        {!connection?.connected && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claude-api-key">Claude API Key *</Label>
              <div className="relative">
                <Input
                  id="claude-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Get your API key from the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claude-email">Email (Optional)</Label>
              <Input
                id="claude-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claude-subscription">Subscription Type</Label>
              <Select value={subscriptionType} onValueChange={(value: 'free' | 'pro' | 'max') => setSubscriptionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleConnect} disabled={loading || !apiKey.trim()}>
              {loading ? 'Testing Connection...' : 'Connect Claude API'}
            </Button>
          </div>
        )}

        {/* Connected Actions */}
        {connection?.connected && (
          <div className="flex gap-3">
            <Button variant="outline" disabled={loading}>
              <Settings className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              disabled={loading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">🚀 Benefits of Claude API Integration</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• <strong>Faster Responses:</strong> Direct API access eliminates CLI overhead</li>
            <li>• <strong>Better Rate Limits:</strong> Higher throughput for development workflows</li>
            <li>• <strong>Custom Models:</strong> Access to latest Claude models and features</li>
            <li>• <strong>Enhanced Features:</strong> Streaming responses, conversation history, and more</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [claudeConnection, setClaudeConnection] = useState<any>(null)

  useEffect(() => {
    loadOrganizations()
    loadClaudeConnection()
    
    // Check URL parameters for tab, connection status, and errors  
    const tab = searchParams.get('tab')
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    if (connected) {
      setConnectionSuccess(connected)
      // Clear the success message after 5 seconds
      setTimeout(() => setConnectionSuccess(null), 5000)
    }

    if (error) {
      setConnectionError(error)
      // Clear the error message after 8 seconds
      setTimeout(() => setConnectionError(null), 8000)
    }
  }, [searchParams])

  const loadClaudeConnection = async () => {
    try {
      const response = await fetch('/api/integrations/claude')
      if (response.ok) {
        const data = await response.json()
        setClaudeConnection(data)
      }
    } catch (error) {
      console.error('Failed to load Claude connection:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      // TODO: Replace with actual API call
      const mockOrgs: Organization[] = [
        {
          id: 'personal',
          name: session?.user?.name || 'Personal Account',
          type: 'personal',
          role: 'owner',
          members: 1,
          plan: 'founder',
          billing: {
            status: 'trial'
          },
          integrations: {
            github: session?.user?.githubConnected || searchParams.get('connected') === 'github',
            square: session?.user?.squareConnected || searchParams.get('connected') === 'square',
            claude: claudeConnection?.connected || false
          }
        }
      ]
      
      setOrganizations(mockOrgs)
      setCurrentOrg(mockOrgs[0])
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectGitHub = async () => {
    try {
      // Show loading state or preparation message
      const preparationResponse = await fetch('/api/auth/link-github', {
        method: 'POST'
      })
      
      if (preparationResponse.ok) {
        // Use NextAuth signIn to handle GitHub OAuth with proper callback
        const { signIn } = await import('next-auth/react')
        await signIn('github', { 
          callbackUrl: '/cockpit/settings?tab=integrations&connected=github'
        })
      } else {
        console.error('Failed to prepare GitHub linking')
      }
    } catch (error) {
      console.error('GitHub connection error:', error)
    }
  }

  const connectSquare = async () => {
    // Direct Square OAuth flow
    const clientId = process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID || 'YOUR_SQUARE_CLIENT_ID'
    const redirectUri = `${window.location.origin}/auth/square`
    const state = 'cockpit-settings-integration' // Track that this came from cockpit settings
    
    const squareAuthUrl = `https://connect.squareup.com/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `scope=MERCHANT_PROFILE_READ+PAYMENTS_READ+PAYMENTS_WRITE&` +
      `response_type=code&` +
      `state=${state}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`
    
    window.location.href = squareAuthUrl
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'founder': return 'bg-purple-100 text-purple-800'
      case 'growth': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-yellow-100 text-yellow-800'
      case 'past_due': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <CockpitShell title="Settings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-text-secondary">
            Manage your account, integrations, and preferences
          </p>
        </div>

      {/* Success Message */}
      {connectionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-green-600 mr-2">✅</div>
            <div className="text-green-800 font-medium">
              {connectionSuccess === 'github' ? 'GitHub' : 'Square'} account connected successfully!
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-red-600 mr-2">❌</div>
            <div className="text-red-800 font-medium">
              Connection failed: {connectionError.replace('-', ' ')}. Please try again.
            </div>
          </div>
        </div>
      )}

      {currentOrg && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="claude">Claude API</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{currentOrg.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm capitalize">{currentOrg.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Plan:</span>
                    <Badge className={getPlanColor(currentOrg.plan)}>
                      {currentOrg.plan}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={getStatusColor(currentOrg.billing.status)}>
                      {currentOrg.billing.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>
                  Connect your GitHub and Square accounts to unlock full features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* GitHub Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GitHubLogoIcon className="w-8 h-8" />
                    <div>
                      <h3 className="font-medium">GitHub</h3>
                      <p className="text-sm text-gray-500">
                        {currentOrg.integrations.github
                          ? `Connected as @${session?.user?.githubUsername || 'user'}`
                          : 'Connect your GitHub account to import repositories'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentOrg.integrations.github ? (
                      <>
                        <Badge className="bg-background-secondary text-text-primary border border-border-standard">Connected</Badge>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </>
                    ) : (
                      <Button onClick={connectGitHub}>
                        <GitHubLogoIcon className="w-4 h-4 mr-2" />
                        Connect GitHub
                      </Button>
                    )}
                  </div>
                </div>

                {/* Square Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Square className="w-8 h-8" />
                    <div>
                      <h3 className="font-medium">Square</h3>
                      <p className="text-sm text-gray-500">
                        {currentOrg.integrations.square
                          ? 'Connected - Payment processing enabled'
                          : 'Connect Square for payment processing and business formation'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentOrg.integrations.square ? (
                      <>
                        <Badge className="bg-background-secondary text-text-primary border border-border-standard">Connected</Badge>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </>
                    ) : (
                      <Button onClick={connectSquare}>
                        <Square className="w-4 h-4 mr-2" />
                        Connect Square
                      </Button>
                    )}
                  </div>
                </div>

                {/* Claude Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bot className="w-8 h-8" />
                    <div>
                      <h3 className="font-medium">Claude API</h3>
                      <p className="text-sm text-gray-500">
                        {currentOrg.integrations.claude
                          ? `Connected - ${claudeConnection?.subscriptionType || 'API'} access enabled`
                          : 'Connect your Claude API key for enhanced AI capabilities'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentOrg.integrations.claude ? (
                      <>
                        <Badge className="bg-background-secondary text-text-primary border border-border-standard">Connected</Badge>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('claude')}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setActiveTab('claude')}>
                        <Bot className="w-4 h-4 mr-2" />
                        Connect Claude
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="text-sm text-gray-500">
                  <h4 className="font-medium text-gray-900 mb-2">Why connect these services?</h4>
                  <ul className="space-y-1">
                    <li>• <strong>GitHub:</strong> Import existing projects, deploy generated code, sync features</li>
                    <li>• <strong>Square:</strong> Process payments, manage business formation, handle billing</li>
                    <li>• <strong>Claude:</strong> Direct API access for enhanced AI development, faster responses, custom models</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Special Benefits & Referral Programs</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div>🎯 <strong>Square Partner Benefits:</strong> Earn $5-$200 per referral through Square's affiliate program, plus access to exclusive developer tools and fee reductions</div>
                    <div>🚀 <strong>GitHub Integration:</strong> Seamless deployment from repositories to production with automated CI/CD pipelines and GitHub Partner Program benefits</div>
                    <div>💰 <strong>Earn While You Build:</strong> Generate affiliate revenue by referring customers to Square while using it for your own business</div>
                    <div>💼 <strong>Combined Power:</strong> Use GitHub for development and Square for payments in one unified business platform</div>
                  </div>
                </div>

                {!currentOrg.integrations.github && !currentOrg.integrations.square && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-green-900 mb-2">🎬 Getting Started</h4>
                    <div className="text-sm text-green-800 space-y-2">
                      <div><strong>Step 1:</strong> Connect GitHub to import existing repositories or create new projects</div>
                      <div><strong>Step 2:</strong> Link Square for payment processing and business formation tools</div>
                      <div><strong>Step 3:</strong> Start building with Maverick's AI-powered development platform</div>
                      <div className="pt-2 border-t border-green-200">
                        <strong>🎁 Bonus:</strong> Complete both integrations to unlock the full Maverick experience and potential affiliate earnings!
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claude API Tab */}
          <TabsContent value="claude" className="space-y-6">
            <ClaudeApiSettings 
              connection={claudeConnection}
              onConnectionChange={loadClaudeConnection}
            />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium capitalize">{currentOrg.plan} Plan</h3>
                    <p className="text-sm text-gray-500">
                      {currentOrg.billing.status === 'trial'
                        ? 'Free trial - 14 days remaining'
                        : `Next billing: ${currentOrg.billing.nextBilling || 'N/A'}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {currentOrg.plan === 'founder' ? '$29' : currentOrg.plan === 'growth' ? '$99' : '$299'}/mo
                    </div>
                    <Badge className={getStatusColor(currentOrg.billing.status)}>
                      {currentOrg.billing.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button>Upgrade Plan</Button>
                  <Button variant="outline">Add Payment Method</Button>
                  <Button variant="outline">Download Invoice</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Manage your personal account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Account settings coming soon</h3>
                  <p className="text-gray-500">
                    Profile management and preferences will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      </div>
    </CockpitShell>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}