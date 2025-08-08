'use client'

import ProjectShell from '@/components/ProjectShell'
import { SettingsNavigation } from '@/components/SettingsNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Github,
  Zap,
  Database,
  Globe,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'GitHub',
      description: 'Connect your GitHub repositories for project management',
      status: 'connected',
      icon: Github,
      color: 'bg-gray-900'
    },
    {
      name: 'Square API',
      description: 'Business formation and payment processing integration',
      status: 'connected',
      icon: Zap,
      color: 'bg-blue-600'
    },
    {
      name: 'Azure Email',
      description: 'Email service for authentication and notifications',
      status: 'connected',
      icon: Database,
      color: 'bg-blue-500'
    },
    {
      name: 'Custom Webhooks',
      description: 'Integrate with external services via webhooks',
      status: 'available',
      icon: Globe,
      color: 'bg-green-600'
    }
  ]

  return (
    <ProjectShell title="Integrations" sidebarContent={<SettingsNavigation />}>
    <div className="h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Connect external services and APIs to enhance your workflow</p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <Card key={integration.name} className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${integration.color} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                  </div>
                  <Badge className={
                    integration.status === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {integration.status === 'connected' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {integration.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{integration.description}</p>
                
                <div className="flex space-x-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="flex-1">
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Slack', 'Discord', 'Notion', 'Linear'].map((service) => (
            <Card key={service} className="shadow-sm opacity-50">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-2" />
                <p className="text-sm text-gray-600">{service}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </ProjectShell>
  )
}