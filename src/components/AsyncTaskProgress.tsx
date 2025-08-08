'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRightIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/20/solid'

interface ProgressStep {
  step: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR'
  message: string
}

interface AsyncTaskProgressProps {
  taskId: string
  projectName: string
  isVisible: boolean
  onComplete?: (success: boolean) => void
  onClose?: () => void
}

interface TaskStatus {
  taskId: string
  projectName: string
  task: {
    title: string
    status: string
    priority: string
    type: string
    updatedAt: string
  }
  progress: {
    status: string
    message: string
  }
  worktree?: {
    name: string
    path: string
    status: string
    queueStats: any
    taskStatus: string
    queuePosition: number
  }
  lastUpdated: string
}

export default function AsyncTaskProgress({ 
  taskId, 
  projectName, 
  isVisible, 
  onComplete, 
  onClose 
}: AsyncTaskProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    { step: 1, status: 'COMPLETED', message: '🔍 Analyzed task requirements' },
    { step: 2, status: 'COMPLETED', message: '🤖 Smart categorization applied' },
    { step: 3, status: 'IN_PROGRESS', message: '🌳 Setting up worktree environment...' },
    { step: 4, status: 'PENDING', message: '📋 Adding to work queue' },
    { step: 5, status: 'PENDING', message: '🚀 Starting AI agent execution' }
  ])
  
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalStatus, setFinalStatus] = useState<'SUCCESS' | 'ERROR' | null>(null)

  // Simulate step progression for demo
  const simulateStepProgress = useCallback(() => {
    let currentStepIndex = 2 // Start from step 3 (index 2)
    
    const progressInterval = setInterval(() => {
      if (currentStepIndex >= steps.length) {
        clearInterval(progressInterval)
        setFinalStatus('SUCCESS')
        onComplete?.(true)
        return
      }

      setSteps(prev => {
        const newSteps = [...prev]
        
        // Complete current step
        if (currentStepIndex < newSteps.length) {
          newSteps[currentStepIndex].status = 'COMPLETED'
        }
        
        // Start next step
        if (currentStepIndex + 1 < newSteps.length) {
          newSteps[currentStepIndex + 1].status = 'IN_PROGRESS'
        }
        
        return newSteps
      })
      
      currentStepIndex++
    }, 2000) // Progress every 2 seconds

    return progressInterval
  }, [steps.length, onComplete])

  // Poll task status from API
  const pollTaskStatus = useCallback(async () => {
    if (!isPolling) return

    try {
      const response = await fetch(`/api/projects/${projectName}/tasks/${taskId}/status`)
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }
      
      const status: TaskStatus = await response.json()
      setTaskStatus(status)

      // Update steps based on actual task progress
      if (status.progress.status === 'COMPLETED') {
        setSteps(prev => prev.map(step => ({ ...step, status: 'COMPLETED' as const })))
        setFinalStatus('SUCCESS')
        setIsPolling(false)
        onComplete?.(true)
      } else if (status.progress.status === 'WORKING' && status.worktree) {
        // Update step 5 to show working status
        setSteps(prev => {
          const newSteps = [...prev]
          if (newSteps[4]) {
            newSteps[4].status = 'IN_PROGRESS'
            newSteps[4].message = `🚀 AI agent working in ${status.worktree?.name}`
          }
          return newSteps
        })
      }

    } catch (err) {
      console.error('Failed to poll task status:', err)
      setError(err instanceof Error ? err.message : 'Status polling failed')
    }
  }, [taskId, projectName, isPolling, onComplete])

  // Start polling when component becomes visible
  useEffect(() => {
    if (isVisible && !isPolling) {
      setIsPolling(true)
      
      // Start step simulation
      const progressInterval = simulateStepProgress()
      
      // Start status polling
      const statusInterval = setInterval(pollTaskStatus, 3000) // Poll every 3 seconds
      
      return () => {
        clearInterval(progressInterval)
        clearInterval(statusInterval)
        setIsPolling(false)
      }
    }
  }, [isVisible, isPolling, simulateStepProgress, pollTaskStatus])

  // Reset when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setIsPolling(false)
      setError(null)
      setFinalStatus(null)
      setTaskStatus(null)
    }
  }, [isVisible])

  if (!isVisible) return null

  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'IN_PROGRESS':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'ERROR':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'IN_PROGRESS':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'ERROR':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Starting AI Work Session</h3>
            <p className="text-sm text-gray-600">Setting up smart worktree and queue</p>
          </div>
          
          {finalStatus && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`flex items-start p-4 rounded-lg border transition-all duration-300 ${getStepColor(step.status)}`}
            >
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {getStepIcon(step.status)}
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Step {step.step}: {step.message}
                </p>
                
                {step.status === 'IN_PROGRESS' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Task Status Info */}
        {taskStatus && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Task Status</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-1 font-medium">{taskStatus.progress.status}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-1 font-medium">{taskStatus.task.type}</span>
              </div>
              {taskStatus.worktree && (
                <>
                  <div>
                    <span className="text-gray-500">Worktree:</span>
                    <span className="ml-1 font-medium">{taskStatus.worktree.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Queue Position:</span>
                    <span className="ml-1 font-medium">#{taskStatus.worktree.queuePosition}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Features Enabled</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              '🤖 AI agent assigned to task',
              '🌳 Smart worktree organization', 
              '📋 Queue-based task management',
              '🔄 Real-time progress tracking'
            ].map((feature, index) => (
              <div key={index} className="flex items-center text-gray-600">
                <ChevronRightIcon className="w-3 h-3 mr-2 text-gray-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Final Status */}
        {finalStatus && (
          <div className="mt-6 pt-4 border-t">
            {finalStatus === 'SUCCESS' ? (
              <div className="flex items-center text-green-700">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">AI work session started successfully!</span>
              </div>
            ) : (
              <div className="flex items-center text-red-700">
                <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">Failed to start work session</span>
              </div>
            )}
            
            {finalStatus === 'SUCCESS' && (
              <button
                onClick={onClose}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Working
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}