'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import CockpitShell from '@/components/CockpitShell'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { usePageTitle, PAGE_TITLES } from '@/hooks/use-page-title'
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
  Square,
  Send,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  FileText
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
  
  // Chat interface state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    type?: 'message' | 'task_suggestion' | 'task_created'
    metadata?: any
  }>>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isChatActive, setIsChatActive] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Set page title
  usePageTitle(PAGE_TITLES.projectOverview(projectName))

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

  const sendChatMessage = async () => {
    if (!currentMessage.trim()) return
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: currentMessage.trim(),
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)
    
    try {
      // Simulate AI response - in real implementation this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: generateAIResponse(userMessage.content, projectSummary, project),
        timestamp: new Date(),
        type: userMessage.content.toLowerCase().includes('task') ? 'task_suggestion' as const : 'message' as const
      }
      
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send chat message:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (userInput: string, summary: ProjectSummary | null, proj: Project | null) => {
    const input = userInput.toLowerCase()
    
    if (input.includes('status') || input.includes('progress')) {
      return `## Project Status Update

**${proj?.name || 'Project'}** is currently **${proj?.status?.toLowerCase()}** with ${summary?.workItemStats.total || 0} total work items.

### This Week's Progress
- ✅ **${summary?.workItemStats.completed || 0}** items completed
- 🔄 **${summary?.workItemStats.in_progress || 0}** items in progress  
- 📋 **${summary?.workItemStats.planned || 0}** items planned

### Velocity
Team is averaging **${summary?.teamVelocity || 0}** items per week.

${summary?.risks.length ? `⚠️ **Attention needed:** ${summary.risks.length} blocked/deferred items` : '✅ **All clear** - no blockers!'}`
    }
    
    if (input.includes('task') || input.includes('create') || input.includes('add')) {
      return `I can help you create tasks! Here are some suggestions based on your project:

## 📝 Suggested Tasks

- [ ] **Improve error handling** - Add better error boundaries and user feedback
- [ ] **Performance optimization** - Analyze and optimize slow queries/renders  
- [ ] **User documentation** - Create getting started guide
- [ ] **Testing coverage** - Add unit tests for core functionality

Would you like me to create any of these tasks, or would you prefer to describe a specific task you have in mind?`
    }
    
    if (input.includes('team') || input.includes('who')) {
      return `## 👥 Current Team

Based on your project setup, I can see activity from the core team. 

### Team Composition
- **Humans:** Project members with various roles
- **AI Agents:** ${activeAgents.length} currently active

### Available Agent Types
- **Frontend Developer** - UI/UX and React components
- **Backend Engineer** - API design and database work  
- **DevOps Specialist** - Deployment and infrastructure
- **Product Manager** - Requirements and user stories

Would you like to invite someone or add an AI agent to help with specific tasks?`
    }
    
    return `I'm here to help you manage **${proj?.name || 'your project'}**! I can:

- 📊 **Provide status updates** - Ask about progress, metrics, or team velocity
- ✅ **Create and manage tasks** - Turn ideas into actionable work items  
- 👥 **Help with team coordination** - Invite members or add AI agents
- 🚀 **Suggest improvements** - Based on project analysis and best practices

What would you like to know or work on?`
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
      <div className="flex flex-col h-full relative">
        {/* Chat Interface Overlay - slides up from bottom when active */}
        {isChatActive && (
          <div className="absolute inset-0 bg-background-primary z-20 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Chat Header */}
            <div className="border-b border-border-standard p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Project Assistant</h2>
                <Badge variant="secondary" className="text-xs">AI</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatActive(false)}
              >
                <ChevronDown className="w-4 h-4" />
                {chatMessages.length === 0 ? 'Close' : 'Minimize'}
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-text-muted max-w-md">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">How can I help with {project.name}?</h3>
                    <p className="text-sm mb-4">I can help you understand project status, create tasks, manage your team, or provide suggestions.</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setCurrentMessage("What's our current progress?")}
                        className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        📊 Check Progress
                      </button>
                      <button
                        onClick={() => setCurrentMessage("Create a new task")}
                        className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        ✅ Create Task
                      </button>
                      <button
                        onClick={() => setCurrentMessage("Who's on our team?")}
                        className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        👥 View Team
                      </button>
                      <button
                        onClick={() => setCurrentMessage("What should we work on next?")}
                        className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        🎯 Get Suggestions
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl px-4 py-3 rounded-xl ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border shadow-sm'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ 
                            __html: message.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/## (.*)/g, '<h3 class="text-base font-semibold mb-3 text-gray-900">$1</h3>')
                              .replace(/### (.*)/g, '<h4 class="text-sm font-medium mb-2 text-gray-800">$1</h4>')
                              .replace(/- \[ \] (.*)/g, '<div class="flex items-start gap-2 text-sm mb-2"><input type="checkbox" disabled class="mt-0.5"> <span>$1</span></div>')
                              .replace(/- ✅ (.*)/g, '<div class="flex items-center gap-2 text-sm mb-1"><span class="text-green-600">✅</span> <span>$1</span></div>')
                              .replace(/- 🔄 (.*)/g, '<div class="flex items-center gap-2 text-sm mb-1"><span class="text-blue-600">🔄</span> <span>$1</span></div>')
                              .replace(/- 📋 (.*)/g, '<div class="flex items-center gap-2 text-sm mb-1"><span class="text-gray-600">📋</span> <span>$1</span></div>')
                              .replace(/- (.*)/g, '<div class="flex items-start gap-2 text-sm mb-1"><span>•</span> <span>$1</span></div>')
                          }} />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border shadow-sm px-4 py-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input - Fixed at bottom of chat overlay */}
            <div className="border-t border-border-standard p-4 bg-white">
              <div className="max-w-4xl mx-auto flex gap-3">
                <Input
                  placeholder="Ask about progress, create tasks, get suggestions..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="flex-1 h-10"
                  disabled={isTyping}
                />
                <Button 
                  onClick={sendChatMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  className="h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content - shows when chat is not active */}
        <div className={`flex-1 overflow-auto p-6 ${!isChatActive ? 'pb-24' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-text-secondary text-lg mt-2">{project.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Compact Sync Status */}
            <div className="group relative">
              <div className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="absolute right-0 top-6 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Synced • Last updated 2m ago
              </div>
            </div>
            
            {project.repositoryUrl && (
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                <ExternalLink className="w-4 h-4 mr-2" />
                Repository
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

        {/* Bottom Chat Bar - prominent blue background */}
        {!isChatActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-blue-600 shadow-lg">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask your project assistant</span>
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask about progress, create tasks, manage team..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onFocus={() => setIsChatActive(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setIsChatActive(true)
                        setTimeout(() => sendChatMessage(), 100)
                      }
                    }}
                    className="flex-1 h-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500 transition-colors"
                  />
                </div>
                <Button 
                  onClick={() => {
                    setIsChatActive(true)
                    setTimeout(() => sendChatMessage(), 100)
                  }}
                  disabled={!currentMessage.trim()}
                  className="h-10 bg-white text-blue-600 hover:bg-blue-50"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CockpitShell>
  )
}