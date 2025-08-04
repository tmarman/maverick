'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import CockpitShell from '@/components/CockpitShell'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Settings, 
  Calendar,
  ExternalLink,
  Github,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  GitCommit,
  Activity,
  Zap,
  Award,
  Rocket,
  Bot,
  Play,
  Square
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
  submodulePath?: string
  defaultBranch?: string
  githubRepoId?: string
  owner?: string
  workspacePath?: string
  maverickConfig?: {
    hasStructure: boolean
    templateUsed: string
    customTheme: string
    aiInstructions: string
  }
  githubConfig?: {
    owner: string
    repo: string
    full_name: string
    language: string
    private: boolean
    stars: number
    forks: number
  }
}

interface Repository {
  id: number
  name: string
  full_name: string
  description?: string
}

interface WorkItemStats {
  total: number
  completed: number
  in_progress: number
  planned: number
  deferred: number
  blocked: number
}

interface WeeklyProgress {
  workItemsCompleted: number
  newWorkItems: number
  commitsThisWeek: number
  linesChanged: number
  featuresShipped: number
  bugsFixed: number
}

interface ProjectSummary {
  workItemStats: WorkItemStats
  weeklyProgress: WeeklyProgress
  keyAccomplishments: string[]
  upcomingMilestones: string[]
  risks: string[]
  teamVelocity: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectName = params?.name as string
  const [project, setProject] = useState<Project | null>(null)
  const [repository, setRepository] = useState<Repository | null>(null)
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeAgents, setActiveAgents] = useState<any[]>([])
  const [newAgentRequirement, setNewAgentRequirement] = useState('')
  const [isStartingAgent, setIsStartingAgent] = useState(false)

  useEffect(() => {
    if (projectName) {
      loadProject()
      loadActiveAgents()
      
      // Poll for agent updates every 5 seconds
      const interval = setInterval(loadActiveAgents, 5000)
      return () => clearInterval(interval)
    }
  }, [projectName])

  const loadProject = async () => {
    try {
      setLoading(true)
      
      // Load project data
      const projectResponse = await fetch(`/api/projects/${projectName}`)
      if (projectResponse.ok) {
        const projectData = await projectResponse.json()
        setProject(projectData.project)
        
        // If project has a GitHub repository, load repository details
        if (projectData.project.repositoryUrl) {
          const repoMatch = projectData.project.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
          if (repoMatch) {
            const [, owner, repo] = repoMatch
            setRepository({
              id: parseInt(projectData.project.githubRepoId || '0'),
              name: repo,
              full_name: `${owner}/${repo}`,
              description: projectData.project.description
            })
          }
        }
      }
      
      // Load work items for summary stats
      const workItemsResponse = await fetch(`/api/projects/${projectName}/work-items`)
      if (workItemsResponse.ok) {
        const workItemsData = await workItemsResponse.json()
        const workItems = workItemsData.workItems || []
        
        // Calculate work item stats
        const stats: WorkItemStats = {
          total: workItems.length,
          completed: workItems.filter((item: any) => item.status === 'DONE').length,
          in_progress: workItems.filter((item: any) => item.status === 'IN_PROGRESS').length,
          planned: workItems.filter((item: any) => item.status === 'PLANNED').length,
          deferred: workItems.filter((item: any) => item.status === 'DEFERRED').length,
          blocked: workItems.filter((item: any) => item.status === 'BLOCKED').length
        }
        
        // Mock weekly progress data (would come from git indexing in real implementation)
        const weeklyProgress: WeeklyProgress = {
          workItemsCompleted: stats.completed, // This week's completions
          newWorkItems: Math.floor(stats.total * 0.2), // New items this week
          commitsThisWeek: 12, // From git API
          linesChanged: 450, // From git diff
          featuresShipped: workItems.filter((item: any) => item.type === 'FEATURE' && item.status === 'DONE').length,
          bugsFixed: workItems.filter((item: any) => item.type === 'BUG' && item.status === 'DONE').length
        }
        
        // Generate key accomplishments from completed work items
        const completedItems = workItems.filter((item: any) => item.status === 'DONE')
        const keyAccomplishments = completedItems.slice(0, 3).map((item: any) => item.title)
        
        // Generate upcoming milestones from planned work items
        const plannedItems = workItems.filter((item: any) => item.status === 'PLANNED' || item.status === 'IN_PROGRESS')
        const upcomingMilestones = plannedItems.slice(0, 3).map((item: any) => item.title)
        
        // Identify risks from blocked/deferred items
        const risks = workItems
          .filter((item: any) => item.status === 'BLOCKED' || item.status === 'DEFERRED')
          .slice(0, 2)
          .map((item: any) => `${item.title} (${item.status.toLowerCase()})`)
        
        // Calculate team velocity (work items completed per week)
        const teamVelocity = Math.round(stats.completed / 4) // Assuming 4 weeks of data
        
        setProjectSummary({
          workItemStats: stats,
          weeklyProgress,
          keyAccomplishments,
          upcomingMilestones,
          risks,
          teamVelocity
        })
      }
      
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveAgents = async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}/agents`)
      if (response.ok) {
        const data = await response.json()
        setActiveAgents(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load active agents:', error)
    }
  }

  const startAgent = async () => {
    if (!newAgentRequirement.trim()) return
    
    setIsStartingAgent(true)
    try {
      const response = await fetch(`/api/projects/${projectName}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement: newAgentRequirement.trim(),
          options: { dryRun: false, skipTests: false, skipDemo: false }
        })
      })
      
      if (response.ok) {
        setNewAgentRequirement('')
        loadActiveAgents()
      }
    } catch (error) {
      console.error('Failed to start agent:', error)
    } finally {
      setIsStartingAgent(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AI_PLATFORM':
        return 'bg-purple-100 text-purple-800'
      case 'GITHUB_REPOSITORY':
        return 'bg-blue-100 text-blue-800'
      case 'SAAS_PRODUCT':
        return 'bg-green-100 text-green-800'
      case 'SQUARE_APP':
        return 'bg-orange-100 text-orange-800'
      case 'STARTUP_ROOT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <CockpitShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </CockpitShell>
    )
  }

  return (
    <CockpitShell sidebarContent={<ProjectTreeSidebar project={project} currentPage="overview" />}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-text-secondary text-lg mt-2">{project.description}</p>
            )}
            {project.workspacePath && (
              <p className="text-sm text-text-muted mt-1">
                <code className="bg-background-secondary px-2 py-1 rounded text-xs">{project.workspacePath}</code>
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getTypeColor(project.type)} variant="outline">
                {project.type.replace('_', ' ')}
              </Badge>
              <Badge className={getStatusColor(project.status)} variant="outline">
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {project.repositoryUrl && (
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                <ExternalLink className="w-4 h-4 mr-2" />
                View Repository
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* VC-Style Executive Dashboard */}
        <div className="space-y-8">
          {/* Key Metrics Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {projectSummary ? Math.round((projectSummary.workItemStats.completed / Math.max(projectSummary.workItemStats.total, 1)) * 100) : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {projectSummary?.workItemStats.completed || 0} of {projectSummary?.workItemStats.total || 0} items
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Team Velocity</CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {projectSummary?.teamVelocity || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">items/week avg</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {projectSummary?.weeklyProgress.workItemsCompleted || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">items completed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Code Impact</CardTitle>
                  <GitCommit className="w-4 h-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {projectSummary?.weeklyProgress.commitsThisWeek || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  commits, {projectSummary?.weeklyProgress.linesChanged || 0} lines
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active AI Agents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <CardTitle>Active AI Agents</CardTitle>
                  <Badge variant="secondary">{activeAgents.length} active</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/app/projects/${projectName}/agents`}
                >
                  View All Agents
                </Button>
              </div>
              <CardDescription>
                Autonomous agents working on features and improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick Agent Start */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe what you want an AI agent to build..."
                    value={newAgentRequirement}
                    onChange={(e) => setNewAgentRequirement(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && startAgent()}
                  />
                  <Button
                    onClick={startAgent}
                    disabled={isStartingAgent || !newAgentRequirement.trim()}
                  >
                    {isStartingAgent ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Start Agent
                  </Button>
                </div>
              </div>

              {/* Active Agents List */}
              {activeAgents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No active agents</p>
                  <p className="text-sm">Start an agent above to automate feature development</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAgents.map((agent) => (
                    <div key={agent.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4 text-blue-600" />
                            <h3 className="font-semibold">{agent.taskPlan.title}</h3>
                            <Badge 
                              className={
                                agent.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                                agent.status === 'completed' ? 'bg-green-100 text-green-800' :
                                agent.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {agent.taskPlan.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {agent.taskPlan.totalEstimateMinutes}min estimated
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {agent.taskPlan.agentType}
                            </div>
                          </div>
                        </div>
                      </div>

                      {agent.status === 'executing' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Step {agent.currentStep} of {agent.taskPlan.steps.length}</span>
                            <span>{Math.round((agent.currentStep / agent.taskPlan.steps.length) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(agent.currentStep / agent.taskPlan.steps.length) * 100} 
                            className="h-2" 
                          />
                          {agent.currentStep > 0 && agent.currentStep <= agent.taskPlan.steps.length && (
                            <p className="text-sm text-gray-600">
                              Current: {agent.taskPlan.steps[agent.currentStep - 1]?.title}
                            </p>
                          )}
                        </div>
                      )}

                      {agent.status === 'completed' && agent.artifacts.prUrl && (
                        <div className="mt-3">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Pull Request
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Executive Summary Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Key Accomplishments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Key Accomplishments This Week
                </CardTitle>
                <CardDescription>Major features and improvements delivered</CardDescription>
              </CardHeader>
              <CardContent>
                {projectSummary?.keyAccomplishments.length ? (
                  <ul className="space-y-2">
                    {projectSummary.keyAccomplishments.map((accomplishment, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{accomplishment}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No completed items yet. Start building to see accomplishments here!</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Upcoming Milestones
                </CardTitle>
                <CardDescription>Key items planned for next week</CardDescription>
              </CardHeader>
              <CardContent>
                {projectSummary?.upcomingMilestones.length ? (
                  <ul className="space-y-2">
                    {projectSummary.upcomingMilestones.map((milestone, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{milestone}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming milestones. Add some tasks to see the roadmap!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Work Item Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Item Status</CardTitle>
                <CardDescription>Current project breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-semibold">{projectSummary?.workItemStats.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <span className="font-semibold">{projectSummary?.workItemStats.in_progress || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Planned</span>
                  </div>
                  <span className="font-semibold">{projectSummary?.workItemStats.planned || 0}</span>
                </div>
                {(projectSummary?.workItemStats.blocked || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Blocked</span>
                    </div>
                    <span className="font-semibold text-red-600">{projectSummary?.workItemStats.blocked || 0}</span>
                  </div>
                )}
                {(projectSummary?.workItemStats.deferred || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Deferred</span>
                    </div>
                    <span className="font-semibold text-orange-600">{projectSummary?.workItemStats.deferred || 0}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Development Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Development Activity</CardTitle>
                <CardDescription>Code and feature delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Features Shipped:</span>
                  <span className="font-semibold text-green-600">{projectSummary?.weeklyProgress.featuresShipped || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Bugs Fixed:</span>
                  <span className="font-semibold text-blue-600">{projectSummary?.weeklyProgress.bugsFixed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">New Items:</span>
                  <span className="font-semibold">{projectSummary?.weeklyProgress.newWorkItems || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Lines Changed:</span>
                  <span className="font-semibold">{projectSummary?.weeklyProgress.linesChanged || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Risks & Blockers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Risks & Blockers
                </CardTitle>
                <CardDescription>Items needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                {projectSummary?.risks.length ? (
                  <ul className="space-y-2">
                    {projectSummary.risks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-600 font-medium">No blockers!</p>
                    <p className="text-xs text-gray-500">Team is operating smoothly</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Health Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                Project Health Summary
              </CardTitle>
              <CardDescription>Executive overview for stakeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>
                  <strong>{project.name}</strong> is currently{' '}
                  <Badge className={getStatusColor(project.status)} variant="outline">
                    {project.status.replace('_', ' ').toLowerCase()}
                  </Badge>
                  {' '}with{' '}
                  <strong>{projectSummary?.workItemStats.total || 0}</strong> total work items tracked.
                </p>
                
                {projectSummary && (
                  <p>
                    This week the team completed{' '}
                    <strong>{projectSummary.weeklyProgress.workItemsCompleted}</strong> items
                    {projectSummary.weeklyProgress.featuresShipped > 0 && (
                      <span>, shipped <strong>{projectSummary.weeklyProgress.featuresShipped}</strong> features</span>
                    )}
                    {projectSummary.weeklyProgress.bugsFixed > 0 && (
                      <span>, and fixed <strong>{projectSummary.weeklyProgress.bugsFixed}</strong> bugs</span>
                    )}
                    . The team is maintaining a velocity of{' '}
                    <strong>{projectSummary.teamVelocity}</strong> items per week.
                  </p>
                )}
                
                {projectSummary?.risks.length ? (
                  <p className="text-orange-700 bg-orange-100 p-3 rounded-md">
                    <strong>Action Required:</strong> There are {projectSummary.risks.length} items requiring attention
                    to maintain project momentum.
                  </p>
                ) : (
                  <p className="text-green-700 bg-green-100 p-3 rounded-md">
                    <strong>All Clear:</strong> Project is on track with no significant blockers.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CockpitShell>
  )
}