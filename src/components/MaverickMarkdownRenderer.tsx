'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Bot, 
  Users, 
  CheckCircle, 
  Clock, 
  Activity,
  Zap,
  TrendingUp,
  Target,
  User,
  Send
} from 'lucide-react'
import { maverickParser, type SmartSnippet, type ParsedMarkdown } from '@/lib/maverick-markdown'

interface MaverickMarkdownRendererProps {
  markdown: string
  context?: {
    projectName?: string
    taskId?: string
    workingDirectory?: string
    userRole?: string
  }
  onSnippetAction?: (snippet: SmartSnippet) => Promise<void>
  className?: string
}

export function MaverickMarkdownRenderer({ 
  markdown, 
  context, 
  onSnippetAction,
  className 
}: MaverickMarkdownRendererProps) {
  const [parsed, setParsed] = useState<ParsedMarkdown | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    parseMarkdown()
  }, [markdown])

  const parseMarkdown = async () => {
    setLoading(true)
    try {
      const result = await maverickParser.parse(markdown)
      setParsed(result)
    } catch (error) {
      console.error('Failed to parse markdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSnippetClick = async (snippet: SmartSnippet) => {
    if (onSnippetAction) {
      await onSnippetAction(snippet)
    } else {
      // Default actions for different snippet types
      await handleDefaultAction(snippet)
    }
  }

  const handleDefaultAction = async (snippet: SmartSnippet) => {
    const { projectName } = context || {}
    
    try {
      switch (snippet.action) {
        case 'create-task':
          if (projectName) {
            const response = await fetch(`/api/projects/${projectName}/work-items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: snippet.text,
                type: 'TASK',
                status: 'PLANNED',
                priority: snippet.attributes?.priority?.toUpperCase() || 'MEDIUM'
              })
            })
            
            if (response.ok) {
              console.log('Task created:', snippet.text)
            }
          }
          break
          
        case 'add-agent':
          if (projectName) {
            const agentType = getAgentTypeFromName(snippet.text)
            const response = await fetch(`/api/projects/${projectName}/team/agents`, {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentType,
                name: snippet.text,
                specialization: snippet.attributes?.specialization || getDefaultSpecialization(agentType)
              })
            })
            
            if (response.ok) {
              console.log('Agent added:', snippet.text)
            }
          }
          break
          
        case 'display-metric':
          // Metrics are display-only, no action needed
          break
          
        case 'render-smart-section':
          // Smart sections with inline AI - could trigger AI processing
          if (snippet.prompt) {
            console.log('Smart section triggered:', snippet.prompt)
          }
          break
      }
    } catch (error) {
      console.error('Error handling snippet action:', error)
    }
  }

  const renderSmartSnippet = (snippet: SmartSnippet) => {
    const baseClasses = "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-sm"
    
    switch (snippet.type) {
      case 'task':
        return (
          <Button 
            key={snippet.id}
            variant="outline"
            size="sm"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 gap-1"
            onClick={() => handleSnippetClick(snippet)}
          >
            <CheckCircle className="w-3 h-3" />
            Create: {snippet.text}
            {snippet.attributes?.priority && (
              <Badge variant="secondary" className="text-xs ml-1">
                {snippet.attributes.priority}
              </Badge>
            )}
          </Button>
        )
        
      case 'agent':
        return (
          <Button 
            key={snippet.id}
            variant="outline"
            size="sm"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 gap-1"
            onClick={() => handleSnippetClick(snippet)}
          >
            <Bot className="w-3 h-3" />
            {snippet.text}
            {snippet.attributes?.status && (
              <div className={`w-2 h-2 rounded-full ml-1 ${
                snippet.attributes.status === 'running' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
            )}
            {snippet.attributes?.tasks && (
              <span className="text-xs bg-purple-100 px-1 py-0.5 rounded">
                {snippet.attributes.tasks} tasks
              </span>
            )}
          </Button>
        )
        
      case 'team':
        return (
          <Button 
            key={snippet.id}
            variant="outline"
            size="sm"
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 gap-1"
            onClick={() => handleSnippetClick(snippet)}
          >
            <Users className="w-3 h-3" />
            {snippet.text}
          </Button>
        )
        
      case 'worktree-suggestion':
        return (
          <Card key={snippet.id} className="my-3 border-orange-200 bg-orange-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Worktree Suggestion</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSnippetClick(snippet)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Apply
                </Button>
              </div>
              <div className="text-sm text-orange-700">
                <strong>{snippet.text}</strong>
              </div>
              {snippet.attributes?.rationale && (
                <div className="text-xs text-orange-600 mt-1">
                  {snippet.attributes.rationale}
                </div>
              )}
              {snippet.attributes?.estimated_time && (
                <div className="text-xs text-orange-600 mt-1">
                  Estimated: {snippet.attributes.estimated_time}
                </div>
              )}
            </CardContent>
          </Card>
        )
        
      case 'metric':
        return (
          <div key={snippet.id} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{snippet.text}:</span>
            <span className="text-lg font-bold text-blue-600">
              {snippet.attributes?.value}
            </span>
            {snippet.attributes?.unit && (
              <span className="text-sm text-gray-600">{snippet.attributes.unit}</span>
            )}
            {snippet.attributes?.trend && (
              <span className={`text-sm ${
                snippet.attributes.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {snippet.attributes.trend}
              </span>
            )}
          </div>
        )
        
      case 'smart-section':
        return (
          <Card key={snippet.id} className="my-4 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">AI Section: {snippet.text}</span>
              </div>
              {snippet.body && (
                <div className="text-sm text-purple-700 mb-3 whitespace-pre-wrap">
                  {snippet.body}
                </div>
              )}
              {snippet.prompt && (
                <div className="bg-purple-100 border border-purple-200 rounded p-2 text-xs">
                  <strong>AI Prompt:</strong> {snippet.prompt}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm"
                  onClick={() => handleSnippetClick(snippet)}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  Process with AI
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-purple-300 text-purple-700"
                >
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'add-agent':
        return (
          <Button 
            key={snippet.id}
            variant="outline"
            size="sm"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 gap-1"
            onClick={() => handleSnippetClick(snippet)}
          >
            <Plus className="w-3 h-3" />
            Add {snippet.text}
          </Button>
        )
        
      case 'invite-member':
        return (
          <Button 
            key={snippet.id}
            variant="outline"
            size="sm"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 gap-1"
            onClick={() => handleSnippetClick(snippet)}
          >
            <User className="w-3 h-3" />
            Invite {snippet.text}
          </Button>
        )
        
      default:
        return (
          <div key={snippet.id} className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
            Unknown: {snippet.type}[{snippet.text}]
          </div>
        )
    }
  }

  const processHtmlWithSnippets = (html: string, snippets: SmartSnippet[]) => {
    let processedHtml = html
    
    snippets.forEach(snippet => {
      const placeholder = `<div class="maverick-snippet" data-snippet-id="${snippet.id}"></div>`
      const snippetElement = renderSmartSnippet(snippet)
      
      // Convert React element to HTML string (simplified)
      // In a real implementation, you'd use ReactDOMServer or similar
      const snippetHtml = `<div class="snippet-container" data-snippet-id="${snippet.id}"></div>`
      processedHtml = processedHtml.replace(placeholder, snippetHtml)
    })
    
    return processedHtml
  }

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded" />
  }

  if (!parsed) {
    return <div>Failed to parse markdown</div>
  }

  // Replace [SNIPPET:id] placeholders with React components
  const renderContentWithSnippets = () => {
    let html = parsed.html
    const parts: (string | React.ReactNode)[] = []
    let lastIndex = 0
    
    console.log('🔍 Processing HTML:', html.substring(0, 200) + '...')
    console.log('📄 Available snippets:', parsed.snippets.map(s => ({ id: s.id, type: s.type, text: s.text })))
    
    // Find all snippet placeholders
    const snippetRegex = /\[SNIPPET:([^\]]+)\]/g
    let match
    
    while ((match = snippetRegex.exec(html)) !== null) {
      const [placeholder, snippetId] = match
      const snippet = parsed.snippets.find(s => s.id === snippetId)
      
      // Add HTML before this snippet
      if (match.index > lastIndex) {
        const beforeHtml = html.slice(lastIndex, match.index)
        if (beforeHtml.trim()) {
          parts.push(
            <div 
              key={`html-${lastIndex}`}
              dangerouslySetInnerHTML={{ __html: beforeHtml }} 
              className="prose prose-sm max-w-none"
            />
          )
        }
      }
      
      // Add the snippet component
      if (snippet) {
        parts.push(
          <div key={`snippet-${snippetId}`} className="my-2">
            {renderSmartSnippet(snippet)}
          </div>
        )
      }
      
      lastIndex = match.index + placeholder.length
    }
    
    // Add remaining HTML after last snippet
    if (lastIndex < html.length) {
      const remainingHtml = html.slice(lastIndex)
      if (remainingHtml.trim()) {
        parts.push(
          <div 
            key={`html-${lastIndex}`}
            dangerouslySetInnerHTML={{ __html: remainingHtml }} 
            className="prose prose-sm max-w-none"
          />
        )
      }
    }
    
    // If no snippets found, render the HTML normally
    if (parts.length === 0) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: html }} 
          className="prose prose-sm max-w-none"
        />
      )
    }
    
    return parts
  }

  return (
    <div className={className}>
      {renderContentWithSnippets()}
    </div>
  )
}

// Helper functions
function getAgentTypeFromName(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('frontend')) return 'frontend-dev'
  if (lowerName.includes('backend')) return 'backend-dev'  
  if (lowerName.includes('qa') || lowerName.includes('test')) return 'qa-specialist'
  if (lowerName.includes('devops')) return 'devops-engineer'
  if (lowerName.includes('product')) return 'product-manager'
  return 'general'
}

function getDefaultSpecialization(agentType: string): string {
  switch (agentType) {
    case 'frontend-dev': return 'React, TypeScript, UI/UX'
    case 'backend-dev': return 'APIs, Database, Server Logic'
    case 'qa-specialist': return 'Testing, Quality Assurance' 
    case 'devops-engineer': return 'CI/CD, Infrastructure, Deployment'
    case 'product-manager': return 'Requirements, User Stories'
    default: return 'General Development'
  }
}