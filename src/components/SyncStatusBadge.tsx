'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  ArrowUp, 
  ArrowDown, 
  GitBranch, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Clock,
  HelpCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface SyncStatus {
  project: string
  status: 'synced' | 'ahead' | 'behind' | 'attention' | 'conflict' | 'error' | 'pending' | 'unknown'
  message: string
  lastSync: string
  needsAttention?: boolean
  branches: Array<{
    branch: string
    status: string
    message: string
    lastSync: string
    conflictFiles?: string[]
    needsAttention?: boolean
  }>
}

interface SyncStatusBadgeProps {
  projectName: string
  showDetails?: boolean
  onRefresh?: () => void
}

export function SyncStatusBadge({ projectName, showDetails = false, onRefresh }: SyncStatusBadgeProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}/sync-status`)
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSync = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/projects/${projectName}/sync-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      })
      
      if (response.ok) {
        await fetchSyncStatus()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to sync:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSyncStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [projectName])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100">
        <RefreshCw className="w-3 h-3 animate-spin text-gray-500" />
        <span className="text-xs text-gray-600">Checking sync status...</span>
      </div>
    )
  }

  if (!syncStatus) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100">
        <HelpCircle className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-600">Sync status unavailable</span>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'synced':
        return {
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          text: 'Up to date',
          description: 'All changes are synchronized'
        }
      case 'ahead':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',  
          borderColor: 'border-blue-200',
          icon: ArrowUp,
          text: 'Ready to push',
          description: 'Local changes ready to share'
        }
      case 'behind':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200', 
          icon: ArrowDown,
          text: 'Update available',
          description: 'New changes from team available'
        }
      case 'pending':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: Clock,
          text: 'Updates pending',
          description: 'Some branches have updates'
        }
      case 'attention':
        return {
          color: 'orange',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          icon: GitBranch,
          text: 'Needs merge',
          description: 'Branches have diverged'
        }
      case 'conflict':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          text: 'Has conflicts',
          description: 'Merge conflicts need resolution'
        }
      case 'error':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: XCircle,
          text: 'Sync error',
          description: 'Unable to sync with remote'
        }
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: HelpCircle,
          text: 'Unknown',
          description: 'Sync status unknown'
        }
    }
  }

  const config = getStatusConfig(syncStatus.status)
  const Icon = config.icon
  const lastSyncText = formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true })

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
        <Icon className={`w-3 h-3 ${config.textColor}`} />
        <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border ${config.bgColor} ${config.borderColor} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <div>
            <span className={`text-sm font-medium ${config.textColor}`}>{config.text}</span>
            <p className="text-xs text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
        
        <button
          onClick={handleManualSync}
          disabled={isRefreshing}
          className="p-1 rounded hover:bg-white/50 transition-colors"
          title="Sync now"
        >
          <RefreshCw className={`w-4 h-4 ${config.textColor} ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">{syncStatus.message}</p>
        <p className="text-xs text-gray-500">Last synced {lastSyncText}</p>
        
        {syncStatus.branches.length > 1 && (
          <details className="mt-3">
            <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              View all branches ({syncStatus.branches.length})
            </summary>
            <div className="mt-2 space-y-1">
              {syncStatus.branches.map((branch) => {
                const branchConfig = getStatusConfig(branch.status)
                const BranchIcon = branchConfig.icon
                return (
                  <div key={branch.branch} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <BranchIcon className={`w-3 h-3 ${branchConfig.textColor}`} />
                      <span className="font-mono">{branch.branch}</span>
                    </div>
                    <span className={branchConfig.textColor}>{branchConfig.text}</span>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        {syncStatus.needsAttention && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Action needed</p>
                <p className="text-amber-700 mt-1">
                  Some branches need your attention to resolve conflicts or merge changes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}