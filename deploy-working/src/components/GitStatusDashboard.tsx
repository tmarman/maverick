'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  GitBranch,
  GitCommit,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Minus,
  RotateCcw,
  ExternalLink
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface GitStatus {
  branch: string
  type: 'main' | 'worktree'
  path: string
  status: 'clean' | 'dirty' | 'ahead' | 'behind' | 'conflict'
  changes: {
    added: number
    modified: number
    deleted: number
    untracked: number
  }
  commits: {
    ahead: number
    behind: number
  }
  lastCommit?: {
    hash: string
    message: string
    author: string
    date: string
  }
  associatedTask?: {
    id: string
    title: string
    status: string
  }
}

interface GitStatusDashboardProps {
  projectName: string
  className?: string
}

export function GitStatusDashboard({ projectName, className }: GitStatusDashboardProps) {
  const [gitStatuses, setGitStatuses] = useState<GitStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadGitStatuses()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadGitStatuses, 30000)
    return () => clearInterval(interval)
  }, [projectName])

  const loadGitStatuses = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/projects/${projectName}/git-status`)
      
      if (response.ok) {
        const data = await response.json()
        setGitStatuses(data.statuses || [])
      }
    } catch (error) {
      console.error('Failed to load git statuses:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: GitStatus['status']) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'dirty':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'ahead':
        return <GitCommit className="w-4 h-4 text-blue-500" />
      case 'behind':
        return <Clock className="w-4 h-4 text-red-500" />
      case 'conflict':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <GitBranch className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: GitStatus['status']) => {
    switch (status) {
      case 'clean':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'dirty':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'ahead':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'behind':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'conflict':
        return 'text-red-700 bg-red-100 border-red-300'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: GitStatus) => {
    const { changes, commits } = status
    const totalChanges = changes.added + changes.modified + changes.deleted + changes.untracked
    
    if (status.status === 'clean' && commits.ahead === 0 && commits.behind === 0) {
      return 'Clean'
    }
    
    const parts = []
    if (totalChanges > 0) {
      parts.push(`${totalChanges} changes`)
    }
    if (commits.ahead > 0) {
      parts.push(`${commits.ahead} ahead`)
    }
    if (commits.behind > 0) {
      parts.push(`${commits.behind} behind`)
    }
    
    return parts.join(', ') || 'Clean'
  }

  const handleCommitChanges = async (branch: string, path: string) => {
    try {
      const response = await fetch(`/api/projects/${projectName}/git-commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, path })
      })

      if (response.ok) {
        toast({
          title: 'Changes committed',
          description: `Committed changes in ${branch}`
        })
        loadGitStatuses()
      } else {
        throw new Error('Failed to commit')
      }
    } catch (error) {
      toast({
        title: 'Commit failed',
        description: 'Could not commit changes',
        variant: 'destructive'
      })
    }
  }

  const handleViewBranch = (status: GitStatus) => {
    // Could open the branch in VS Code or navigate to detailed view
    toast({
      title: 'Branch Details',
      description: `Branch: ${status.branch} at ${status.path}`
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Git Status
          </CardTitle>
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
            <GitBranch className="w-5 h-5" />
            Git Status
            <Badge variant="secondary">{gitStatuses.length} branches</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadGitStatuses}
            disabled={refreshing}
          >
            <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {gitStatuses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No git repositories found</p>
          </div>
        ) : (
          gitStatuses.map((status) => (
            <div
              key={`${status.branch}-${status.path}`}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {status.type === 'main' ? (
                      <GitBranch className="w-4 h-4 text-blue-600" />
                    ) : (
                      <GitBranch className="w-4 h-4 text-purple-600" />
                    )}
                    <span className="font-medium text-gray-900">
                      {status.branch}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(status.status)}`}
                    >
                      {getStatusIcon(status.status)}
                      <span className="ml-1">{getStatusText(status)}</span>
                    </Badge>
                    {status.type === 'worktree' && (
                      <Badge variant="secondary" className="text-xs">
                        Worktree
                      </Badge>
                    )}
                  </div>

                  {/* Associated Task */}
                  {status.associatedTask && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <FileText className="w-3 h-3" />
                      <span>Task: {status.associatedTask.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {status.associatedTask.status}
                      </Badge>
                    </div>
                  )}

                  {/* Change Details */}
                  {(status.changes.added + status.changes.modified + status.changes.deleted + status.changes.untracked) > 0 && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      {status.changes.added > 0 && (
                        <div className="flex items-center gap-1">
                          <Plus className="w-3 h-3 text-green-600" />
                          <span>{status.changes.added}</span>
                        </div>
                      )}
                      {status.changes.modified > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>{status.changes.modified}</span>
                        </div>
                      )}
                      {status.changes.deleted > 0 && (
                        <div className="flex items-center gap-1">
                          <Minus className="w-3 h-3 text-red-600" />
                          <span>{status.changes.deleted}</span>
                        </div>
                      )}
                      {status.changes.untracked > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-orange-600" />
                          <span>{status.changes.untracked} untracked</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Last Commit */}
                  {status.lastCommit && (
                    <div className="text-xs text-gray-500">
                      <span className="font-mono">
                        {status.lastCommit.hash.substring(0, 7)}
                      </span>
                      {' '}
                      {status.lastCommit.message.substring(0, 50)}
                      {status.lastCommit.message.length > 50 && '...'}
                      {' '}
                      <span className="text-gray-400">
                        by {status.lastCommit.author}
                      </span>
                    </div>
                  )}

                  {/* Path */}
                  <div className="text-xs text-gray-400 mt-1">
                    {status.path}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewBranch(status)}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  
                  {status.status === 'dirty' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCommitChanges(status.branch, status.path)}
                    >
                      Commit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}