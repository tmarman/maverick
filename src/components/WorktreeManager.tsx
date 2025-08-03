'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { 
  GitBranch, 
  Plus, 
  Folder, 
  Clock, 
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface WorktreeInfo {
  name: string
  branch: string
  path: string
  purpose: 'main' | 'feature' | 'hotfix' | 'develop'
  status: 'active' | 'stale' | 'merged'
  createdAt: string
  lastActivity?: string
}

interface Repository {
  id: number
  name: string
  full_name: string
  description?: string
}

interface WorktreeManagerProps {
  repository: Repository
  className?: string
}

export function WorktreeManager({ repository, className }: WorktreeManagerProps) {
  const [worktrees, setWorktrees] = useState<WorktreeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Create feature form state
  const [featureName, setFeatureName] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')
  const [baseBranch, setBaseBranch] = useState('main')

  useEffect(() => {
    loadWorktrees()
  }, [repository.id])

  const loadWorktrees = async () => {
    try {
      setLoading(true)
      const [owner, repo] = repository.full_name.split('/')
      const response = await fetch(`/repositories/${owner}/${repo}/worktrees`)
      
      if (response.ok) {
        const data = await response.json()
        setWorktrees(data.worktrees || [])
      } else {
        console.error('Failed to load worktrees')
        setWorktrees([])
      }
    } catch (error) {
      console.error('Error loading worktrees:', error)
      setWorktrees([])
    } finally {
      setLoading(false)
    }
  }

  const createFeatureWorktree = async () => {
    if (!featureName.trim()) {
      toast({
        title: 'Feature name required',
        description: 'Please enter a name for your feature.',
        variant: 'destructive'
      })
      return
    }

    try {
      setCreating(true)
      
      const [owner, repo] = repository.full_name.split('/')
      const response = await fetch(`/repositories/${owner}/${repo}/worktrees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: featureName.trim(),
          description: featureDescription.trim(),
          baseBranch,
          purpose: 'feature',
          createBranch: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Feature worktree created',
          description: `Created feature branch: ${data.worktree.branch}`
        })
        
        // Reset form and close dialog
        setFeatureName('')
        setFeatureDescription('')
        setShowCreateDialog(false)
        
        // Reload worktrees
        await loadWorktrees()
      } else {
        const error = await response.json()
        toast({
          title: 'Failed to create worktree',
          description: error.message || 'An error occurred',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating worktree:', error)
      toast({
        title: 'Creation failed',
        description: 'Failed to create feature worktree',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const removeWorktree = async (worktreeName: string) => {
    if (!confirm(`Are you sure you want to remove the worktree "${worktreeName}"?`)) {
      return
    }

    try {
      const [owner, repo] = repository.full_name.split('/')
      const response = await fetch(
        `/repositories/${owner}/${repo}/worktrees/${worktreeName}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast({
          title: 'Worktree removed',
          description: `Successfully removed worktree: ${worktreeName}`
        })
        await loadWorktrees()
      } else {
        const error = await response.json()
        toast({
          title: 'Failed to remove worktree',
          description: error.message || 'An error occurred',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error removing worktree:', error)
      toast({
        title: 'Removal failed',
        description: 'Failed to remove worktree',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: WorktreeInfo['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'stale':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'merged':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: WorktreeInfo['status']) => {
    switch (status) {
      case 'active':
        return 'bg-background-tertiary text-text-primary'
      case 'stale':
        return 'bg-background-tertiary text-text-muted'
      case 'merged':
        return 'bg-background-secondary text-text-secondary'
      default:
        return 'bg-background-tertiary text-text-muted'
    }
  }

  const getPurposeIcon = (purpose: WorktreeInfo['purpose']) => {
    switch (purpose) {
      case 'main':
        return <GitBranch className="h-4 w-4 text-blue-600" />
      case 'feature':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'hotfix':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'develop':
        return <GitBranch className="h-4 w-4 text-purple-600" />
      default:
        return <Folder className="h-4 w-4 text-gray-600" />
    }
  }

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return 'No activity recorded'
    
    const date = new Date(lastActivity)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Worktrees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
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
            <GitBranch className="h-5 w-5" />
            Worktrees
            <Badge variant="secondary">{worktrees.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadWorktrees}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Feature
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature Branch</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="featureName">Feature Name</Label>
                    <Input
                      id="featureName"
                      placeholder="e.g., payment-integration"
                      value={featureName}
                      onChange={(e) => setFeatureName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="featureDescription">Description (Optional)</Label>
                    <Textarea
                      id="featureDescription"
                      placeholder="Describe what this feature will do..."
                      value={featureDescription}
                      onChange={(e) => setFeatureDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseBranch">Base Branch</Label>
                    <Input
                      id="baseBranch"
                      value={baseBranch}
                      onChange={(e) => setBaseBranch(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createFeatureWorktree}
                      disabled={creating || !featureName.trim()}
                    >
                      {creating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                      Create Worktree
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {worktrees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No worktrees found</p>
            <p className="text-sm mb-4">Create your first feature branch to get started</p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Feature Branch
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-3">
            {worktrees.map((worktree) => (
              <div
                key={worktree.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getPurposeIcon(worktree.purpose)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{worktree.name}</span>
                      <Badge className={getStatusColor(worktree.status)}>
                        {worktree.status}
                      </Badge>
                      {worktree.purpose !== 'main' && (
                        <Badge variant="outline">{worktree.purpose}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {worktree.branch}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatLastActivity(worktree.lastActivity)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(worktree.status)}
                  {worktree.purpose !== 'main' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => removeWorktree(worktree.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Worktree
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}