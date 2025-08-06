'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Rocket,
  GitBranch,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Plus,
  Cherry,
  Settings,
  Cloud,
  Globe,
  Zap,
  Bug
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Deployment {
  id: string
  environment: string
  branch: string
  commitSha?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK'
  deploymentType: 'auto' | 'selective' | 'full' | 'rollback'
  cloudProvider: string
  deploymentUrl?: string
  deployedAt?: string
  completedAt?: string
  notes?: string
  errorMessage?: string
  workItems: {
    id: string
    title: string
    type: string
    status: string
  }[]
  triggeredByUser: {
    name: string
    email: string
  }
}

interface WorkItem {
  id: string
  title: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: string
  stagingDeployedAt?: string
  productionDeployedAt?: string
}

interface Project {
  id: string
  name: string
  repositoryUrl?: string
  defaultBranch?: string
}

interface DeploymentManagerProps {
  project: Project
  className?: string
}

export function DeploymentManager({ project, className }: DeploymentManagerProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [showDeployDialog, setShowDeployDialog] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState<'staging' | 'production'>('staging')
  const [selectedWorkItems, setSelectedWorkItems] = useState<string[]>([])
  const [deploymentNotes, setDeploymentNotes] = useState('')
  const [deploymentType, setDeploymentType] = useState<'auto' | 'selective' | 'full'>('auto')

  useEffect(() => {
    loadData()
  }, [project.id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load deployments and work items in parallel
      const [deploymentsResponse, workItemsResponse] = await Promise.all([
        fetch(`/api/deployments?projectId=${project.id}`),
        fetch(`/api/projects/${project.id}/work-items`)
      ])

      if (deploymentsResponse.ok) {
        const deploymentsData = await deploymentsResponse.json()
        setDeployments(deploymentsData.deployments || [])
      }

      if (workItemsResponse.ok) {
        const workItemsData = await workItemsResponse.json()
        setWorkItems(workItemsData.workItems || [])
      }
    } catch (error) {
      console.error('Error loading deployment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerDeployment = async () => {
    try {
      setDeploying(true)

      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          environment: selectedEnvironment,
          branch: selectedEnvironment === 'staging' ? 'dev' : 'main',
          deploymentType,
          workItemIds: deploymentType === 'selective' ? selectedWorkItems : [],
          notes: deploymentNotes.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Deployment started',
          description: `Deploying to ${selectedEnvironment} environment`
        })
        
        setShowDeployDialog(false)
        setSelectedWorkItems([])
        setDeploymentNotes('')
        await loadData()
      } else {
        const error = await response.json()
        toast({
          title: 'Deployment failed',
          description: error.message || 'Failed to start deployment',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error triggering deployment:', error)
      toast({
        title: 'Deployment failed',
        description: 'Failed to start deployment',
        variant: 'destructive'
      })
    } finally {
      setDeploying(false)
    }
  }

  const getStatusIcon = (status: Deployment['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: Deployment['status']) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'staging':
        return 'bg-yellow-100 text-yellow-800'
      case 'production':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FEATURE':
        return <Zap className="w-3 h-3 text-blue-600" />
      case 'BUG':
        return <Bug className="w-3 h-3 text-red-600" />
      default:
        return <CheckCircle className="w-3 h-3 text-gray-600" />
    }
  }

  // Get ready-to-deploy work items (completed but not in production)
  const readyToDeployItems = workItems.filter(item => 
    item.status === 'DONE' && item.stagingDeployedAt && !item.productionDeployedAt
  )

  const stagingDeployments = deployments.filter(d => d.environment === 'staging').slice(0, 5)
  const productionDeployments = deployments.filter(d => d.environment === 'production').slice(0, 5)

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deployments
          </div>
          <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Deploy Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Environment Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedEnvironment('staging')}
                    className={`p-4 border rounded-lg text-left ${
                      selectedEnvironment === 'staging' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">Staging</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Deploy to beta.maverick (continuous from dev branch)
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedEnvironment('production')}
                    className={`p-4 border rounded-lg text-left ${
                      selectedEnvironment === 'production' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Production</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Deploy to live site (selective or full promotion)
                    </p>
                  </button>
                </div>

                {/* Deployment Type for Production */}
                {selectedEnvironment === 'production' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Deployment Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setDeploymentType('selective')}
                        className={`p-3 border rounded-lg text-left ${
                          deploymentType === 'selective' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Cherry className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-sm">Selective</span>
                        </div>
                        <p className="text-xs text-gray-600">Cherry-pick specific features</p>
                      </button>

                      <button
                        onClick={() => setDeploymentType('full')}
                        className={`p-3 border rounded-lg text-left ${
                          deploymentType === 'full' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Rocket className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-sm">Full</span>
                        </div>
                        <p className="text-xs text-gray-600">Deploy everything from staging</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Work Item Selection for Selective Deployment */}
                {selectedEnvironment === 'production' && deploymentType === 'selective' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Select Features to Deploy ({readyToDeployItems.length} ready)
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                      {readyToDeployItems.map((item) => (
                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={selectedWorkItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWorkItems([...selectedWorkItems, item.id])
                              } else {
                                setSelectedWorkItems(selectedWorkItems.filter(id => id !== item.id))
                              }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="text-sm">{item.title}</span>
                          </div>
                        </label>
                      ))}
                      {readyToDeployItems.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No features ready for production deployment
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Deployment Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    placeholder="Deployment notes, changelog, or special instructions..."
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeployDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={triggerDeployment}
                    disabled={deploying || (deploymentType === 'selective' && selectedWorkItems.length === 0)}
                  >
                    {deploying && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                    Deploy to {selectedEnvironment}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staging">Staging</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Quick Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-4 h-4 text-yellow-600" />
                    Staging Environment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>URL:</span>
                      <a 
                        href="https://beta.maverick.co" 
                        target="_blank" 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        beta.maverick.co
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Branch:</span>
                      <Badge variant="outline">dev</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Auto-deploy:</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-green-600" />
                    Production Environment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>URL:</span>
                      <a 
                        href="https://maverick.co" 
                        target="_blank" 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        maverick.co
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ready to deploy:</span>
                      <Badge variant="outline">{readyToDeployItems.length} features</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Deploy mode:</span>
                      <Badge className="bg-blue-100 text-blue-800">Selective</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Deployments */}
            <div>
              <h3 className="font-medium mb-3">Recent Deployments</h3>
              <div className="space-y-2">
                {deployments.slice(0, 5).map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEnvironmentColor(deployment.environment)}>
                            {deployment.environment}
                          </Badge>
                          <span className="text-sm font-medium">{deployment.branch}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {deployment.workItems.length} work items • {deployment.triggeredByUser.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                      {deployment.deploymentUrl && (
                        <a 
                          href={deployment.deploymentUrl} 
                          target="_blank"
                          className="block text-xs text-blue-600 hover:underline mt-1"
                        >
                          View Site
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {deployments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Rocket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No deployments yet</p>
                    <p className="text-sm">Deploy your first changes to get started</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="staging" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Staging Deployments</h3>
                <Badge className="bg-yellow-100 text-yellow-800">
                  Auto-deploy from dev branch
                </Badge>
              </div>
              {/* Staging deployment list */}
              {stagingDeployments.map((deployment) => (
                <div key={deployment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deployment.status)}
                      <span className="font-medium">{deployment.branch}</span>
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </div>
                    {deployment.deploymentUrl && (
                      <a 
                        href={deployment.deploymentUrl} 
                        target="_blank"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Site
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {deployment.workItems.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Included:</span>
                      {deployment.workItems.slice(0, 3).map(item => item.title).join(', ')}
                      {deployment.workItems.length > 3 && ` +${deployment.workItems.length - 3} more`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Production Deployments</h3>
                <Badge className="bg-green-100 text-green-800">
                  Selective promotion
                </Badge>
              </div>
              {/* Production deployment list */}
              {productionDeployments.map((deployment) => (
                <div key={deployment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deployment.status)}
                      <span className="font-medium">{deployment.deploymentType} deployment</span>
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </div>
                    {deployment.deploymentUrl && (
                      <a 
                        href={deployment.deploymentUrl} 
                        target="_blank"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Site
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {deployment.workItems.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Deployed:</span>
                      {deployment.workItems.slice(0, 3).map(item => item.title).join(', ')}
                      {deployment.workItems.length > 3 && ` +${deployment.workItems.length - 3} more`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}