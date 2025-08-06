'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Play,
  Square,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Bot,
  GitBranch,
  Activity,
  Zap,
  Eye,
  X
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AgentSession {
  id: string
  taskPlan: {
    title: string
    description: string
    steps: Array<{
      id: number
      title: string
      description: string
      estimatedMinutes: number
    }>
    totalEstimateMinutes: number
    agentType: string
    complexity: string
  }
  worktreeSession: {
    branch: string
    path: string
  }
  status: 'planning' | 'executing' | 'testing' | 'demoing' | 'completed' | 'failed'
  currentStep: number
  startedAt: string
  completedAt?: string
  artifacts: {
    screenshots: string[]
    prUrl?: string
    logs: Array<{
      timestamp: string
      level: 'info' | 'warning' | 'error' | 'success'
      message: string
      step?: number
    }>
  }
}

interface AgentDashboardProps {
  projectName: string
  className?: string
}

export function AgentDashboard({ projectName, className }: AgentDashboardProps) {
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [newRequirement, setNewRequirement] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [selectedSession, setSelectedSession] = useState<AgentSession | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    loadSessions()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}/agents`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load agent sessions:', error)
    }
  }

  const startAgent = async () => {
    if (!newRequirement.trim()) {
      toast({
        title: 'Requirement needed',
        description: 'Please describe what you want the agent to build',
        variant: 'destructive'
      })
      return
    }

    setIsStarting(true)
    
    try {
      const response = await fetch(`/api/projects/${projectName}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement: newRequirement.trim(),
          options: {
            dryRun: false,
            skipTests: false,
            skipDemo: false
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Agent started!',
          description: `Agent session ${data.agentSessionId.substring(0, 8)} is now working on your task`
        })
        setNewRequirement('')
        loadSessions()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: 'Failed to start agent',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsStarting(false)
    }
  }

  const stopAgent = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectName}/agents?sessionId=${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Agent stopped',
          description: 'Agent session has been terminated'
        })
        loadSessions()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: 'Failed to stop agent',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: AgentSession['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'executing':
        return 'bg-blue-100 text-blue-800'
      case 'testing':
        return 'bg-purple-100 text-purple-800'
      case 'demoing':
        return 'bg-indigo-100 text-indigo-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: AgentSession['status']) => {
    switch (status) {
      case 'planning':
        return <Clock className="w-4 h-4" />
      case 'executing':
        return <Activity className="w-4 h-4" />
      case 'testing':
        return <CheckCircle className="w-4 h-4" />
      case 'demoing':
        return <Eye className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const calculateProgress = (session: AgentSession) => {
    if (session.status === 'completed') return 100
    if (session.status === 'failed') return 0
    
    const totalSteps = session.taskPlan.steps.length + 2 // +2 for testing and demo
    const currentStep = session.currentStep
    
    return Math.round((currentStep / totalSteps) * 100)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Start New Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Start New Agent
          </CardTitle>
          <CardDescription>
            Describe what you want to build and let an AI agent implement it autonomously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., 'Add a dark mode toggle to the header', 'Create a user profile page with avatar upload', 'Fix the responsive layout on mobile'..."
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={startAgent} disabled={isStarting || !newRequirement.trim()}>
                {isStarting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isStarting ? 'Starting Agent...' : 'Start Agent'}
              </Button>
              {newRequirement.trim() && (
                <Button variant="outline" onClick={() => setNewRequirement('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Agent Sessions</CardTitle>
              <CardDescription>
                Monitor your autonomous development agents
              </CardDescription>
            </div>
            <Badge variant="secondary">{sessions.length} active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No active agents</p>
              <p className="text-sm">Start an agent above to see it working here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(session.status)}
                        <h3 className="font-semibold">{session.taskPlan.title}</h3>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {session.taskPlan.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {session.worktreeSession.branch}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {session.taskPlan.agentType}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.taskPlan.totalEstimateMinutes}min
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                      {['planning', 'executing', 'testing', 'demoing'].includes(session.status) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => stopAgent(session.id)}
                        >
                          <Square className="w-4 h-4" />
                          Stop
                        </Button>
                      )}
                      {session.artifacts.prUrl && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                          View PR
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress: Step {session.currentStep} of {session.taskPlan.steps.length}</span>
                      <span>{calculateProgress(session)}%</span>
                    </div>
                    <Progress value={calculateProgress(session)} className="h-2" />
                    
                    {session.currentStep > 0 && session.currentStep <= session.taskPlan.steps.length && (
                      <p className="text-sm text-gray-600">
                        Current: {session.taskPlan.steps[session.currentStep - 1]?.title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {selectedSession.taskPlan.title}
                  </CardTitle>
                  <CardDescription>
                    Session {selectedSession.id.substring(0, 8)} • Started {new Date(selectedSession.startedAt).toLocaleString()}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Steps Progress */}
              <div>
                <h4 className="font-semibold mb-3">Execution Plan</h4>
                <div className="space-y-2">
                  {selectedSession.taskPlan.steps.map((step, index) => (
                    <div 
                      key={step.id}
                      className={`flex items-center gap-3 p-2 rounded ${
                        index + 1 < selectedSession.currentStep 
                          ? 'bg-green-50 text-green-700'
                          : index + 1 === selectedSession.currentStep
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-current opacity-20 flex items-center justify-center text-xs font-bold">
                        {step.id}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm opacity-75">{step.description}</div>
                      </div>
                      <div className="text-xs">
                        {step.estimatedMinutes}min
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts */}
              {selectedSession.artifacts.screenshots.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Screenshots</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSession.artifacts.screenshots.map((screenshot, index) => (
                      <img
                        key={index}
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Logs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Execution Logs</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogs(!showLogs)}
                  >
                    {showLogs ? 'Hide Logs' : 'Show Logs'}
                  </Button>
                </div>
                
                {showLogs && (
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-auto font-mono text-sm">
                    {selectedSession.artifacts.logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warning' ? 'text-yellow-400' :
                          log.level === 'success' ? 'text-green-400' :
                          'text-blue-400'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="ml-2">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}