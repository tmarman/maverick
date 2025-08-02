'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Square, User, Building, CreditCard, Settings, Plus, ExternalLink } from 'lucide-react'

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
  }
}

function AccountsPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadOrganizations()
    
    // Check URL parameters for tab and connection status
    const tab = searchParams.get('tab')
    const connected = searchParams.get('connected')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    if (connected) {
      setConnectionSuccess(connected)
      // Clear the success message after 5 seconds
      setTimeout(() => setConnectionSuccess(null), 5000)
    }
  }, [searchParams])

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
            square: session?.user?.squareConnected || searchParams.get('connected') === 'square'
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
    // Use NextAuth signIn to handle GitHub OAuth with proper callback
    const { signIn } = await import('next-auth/react')
    await signIn('github', { 
      callbackUrl: '/accounts?tab=integrations&connected=github' 
    })
  }

  const connectSquare = async () => {
    // Direct Square OAuth flow
    const clientId = process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID || 'YOUR_SQUARE_CLIENT_ID'
    const redirectUri = `${window.location.origin}/auth/square`
    const state = 'accounts-integration' // Track that this came from accounts page
    
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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your organizations, billing, and integrations
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Organization Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Organizations
          </CardTitle>
          <CardDescription>
            Switch between your personal account and organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentOrg?.id === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentOrg(org)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {org.type === 'personal' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-500">
                        {org.type === 'personal' ? 'Personal Account' : `${org.members} members`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPlanColor(org.plan)}>
                      {org.plan}
                    </Badge>
                    <Badge className={getStatusColor(org.billing.status)}>
                      {org.billing.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {connectionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="w-5 h-5 text-green-600 mr-2">✅</div>
            <div className="text-green-800 font-medium">
              {connectionSuccess === 'github' ? 'GitHub' : 'Square'} account connected successfully!
            </div>
          </div>
        </div>
      )}

      {currentOrg && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    Organization Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
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
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
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
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
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

                <Separator />

                <div className="text-sm text-gray-500">
                  <h4 className="font-medium text-gray-900 mb-2">Why connect these services?</h4>
                  <ul className="space-y-1">
                    <li>• <strong>GitHub:</strong> Import existing projects, deploy generated code, sync features</li>
                    <li>• <strong>Square:</strong> Process payments, manage business formation, handle billing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Invite and manage team members for this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-gray-500 mb-4">
                    Invite team members to collaborate on projects
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Configure your organization preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Settings coming soon</h3>
                  <p className="text-gray-500">
                    Organization settings and preferences will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default function AccountsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    }>
      <AccountsPageContent />
    </Suspense>
  )
}