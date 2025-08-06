'use client'

import { useState, useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Terminal as TerminalIcon, 
  Plus, 
  X, 
  Settings,
  Play,
  Square,
  RotateCcw,
  FileText,
  Folder,
  GitBranch
} from 'lucide-react'

interface ClaudeSession {
  id: string
  name: string
  type: 'general' | 'feature' | 'debugging' | 'analysis'
  status: 'idle' | 'running' | 'error' | 'completed'
  workingDirectory: string
  lastActivity: Date
  context?: string
  output: string[]
  input: string
}

interface ClaudeTerminalManagerProps {
  project: {
    id: string
    name: string
  }
  className?: string
}

export function ClaudeTerminalManager({ project, className }: ClaudeTerminalManagerProps) {
  const [sessions, setSessions] = useState<ClaudeSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize default session on mount
    if (sessions.length === 0) {
      createSession('main', 'general', 'Main development session')
    }
  }, [])

  useEffect(() => {
    // Setup WebSocket connection for active session
    if (activeSessionId) {
      connectToSession(activeSessionId)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [activeSessionId])

  const createSession = async (name: string, type: ClaudeSession['type'], context?: string) => {
    setIsCreatingSession(true)
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const workingDirectory = `/repos/${project.name.toLowerCase()}/${sessionId}`
    
    const newSession: ClaudeSession = {
      id: sessionId,
      name,
      type,
      status: 'idle',
      workingDirectory,
      lastActivity: new Date(),
      context,
      output: [],
      input: ''
    }
    
    try {
      // Initialize session via API
      const response = await fetch(`/api/projects/${project.name}/claude-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name,
          type,
          context,
          workingDirectory
        })
      })

      if (response.ok) {
        setSessions(prev => [...prev, newSession])
        setActiveSessionId(sessionId)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const connectToSession = (sessionId: string) => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const wsUrl = `ws://localhost:5001/api/claude-sessions/${sessionId}/ws`
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log(`Connected to session ${sessionId}`)
      updateSessionStatus(sessionId, 'idle')
    }

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleSessionMessage(sessionId, data)
    }

    wsRef.current.onclose = () => {
      console.log(`Disconnected from session ${sessionId}`)
      updateSessionStatus(sessionId, 'idle')
    }

    wsRef.current.onerror = (error) => {
      console.error(`Session ${sessionId} error:`, error)
      updateSessionStatus(sessionId, 'error')
    }
  }

  const handleSessionMessage = (sessionId: string, data: any) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          output: [...session.output, data.content || data.message || JSON.stringify(data)],
          lastActivity: new Date(),
          status: data.status || session.status
        }
      }
      return session
    }))

    // Auto-scroll terminal to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }

  const updateSessionStatus = (sessionId: string, status: ClaudeSession['status']) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status, lastActivity: new Date() }
        : session
    ))
  }

  const sendCommand = (sessionId: string, command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        command,
        sessionId
      }))

      // Add command to output for immediate feedback
      setSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            output: [...session.output, `> ${command}`],
            input: '',
            status: 'running',
            lastActivity: new Date()
          }
        }
        return session
      }))
    }
  }

  const closeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId)
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null)
    }

    // Close WebSocket if this was the active session
    if (activeSessionId === sessionId && wsRef.current) {
      wsRef.current.close()
    }
  }

  const getSessionTypeIcon = (type: ClaudeSession['type']) => {
    switch (type) {
      case 'feature': return <FileText className="w-4 h-4" />
      case 'debugging': return <Settings className="w-4 h-4" />
      case 'analysis': return <GitBranch className="w-4 h-4" />
      default: return <TerminalIcon className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: ClaudeSession['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Session Tabs */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t border cursor-pointer transition-colors ${
                session.id === activeSessionId
                  ? 'bg-white border-gray-300 border-b-white'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              {getSessionTypeIcon(session.type)}
              <span className="text-sm font-medium truncate max-w-24">
                {session.name}
              </span>
              <Badge variant="outline" className={`text-xs ${getStatusColor(session.status)}`}>
                {session.status}
              </Badge>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeSession(session.id)
                }}
                className="hover:bg-gray-300 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* New Session Buttons */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => createSession('Feature Dev', 'feature', 'Feature development session')}
            disabled={isCreatingSession}
          >
            <FileText className="w-4 h-4 mr-1" />
            Feature
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => createSession('Debug', 'debugging', 'Debugging session')}
            disabled={isCreatingSession}
          >
            <Settings className="w-4 h-4 mr-1" />
            Debug
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => createSession('Analysis', 'analysis', 'Code analysis session')}
            disabled={isCreatingSession}
          >
            <GitBranch className="w-4 h-4 mr-1" />
            Analysis
          </Button>
        </div>
      </div>

      {/* Active Session Content */}
      {activeSession ? (
        <div className="flex-1 flex flex-col">
          {/* Session Info Bar */}
          <div className="flex items-center justify-between p-2 bg-white border-b text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-gray-500" />
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {activeSession.workingDirectory}
                </code>
              </div>
              {activeSession.context && (
                <div className="text-gray-600">
                  {activeSession.context}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                Last activity: {activeSession.lastActivity.toLocaleTimeString()}
              </span>
              <Button size="sm" variant="ghost">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Terminal Output */}
          <div 
            ref={terminalRef}
            className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto"
          >
            {activeSession.output.length === 0 ? (
              <div className="text-gray-500">
                <p>Claude Code Session: {activeSession.name}</p>
                <p>Working Directory: {activeSession.workingDirectory}</p>
                <p>Type your commands below...</p>
                <p></p>
              </div>
            ) : (
              activeSession.output.map((line, index) => (
                <div key={index} className="mb-1">
                  {line}
                </div>
              ))
            )}
          </div>

          {/* Command Input */}
          <div className="border-t bg-white p-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Type Claude Code command..."
                  className="w-full px-3 py-2 border rounded font-mono text-sm"
                  value={activeSession.input}
                  onChange={(e) => {
                    setSessions(prev => prev.map(session => 
                      session.id === activeSessionId 
                        ? { ...session, input: e.target.value }
                        : session
                    ))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      sendCommand(activeSession.id, activeSession.input)
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => sendCommand(activeSession.id, activeSession.input)}
                disabled={!activeSession.input.trim() || activeSession.status === 'running'}
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Commands */}
            <div className="flex gap-1 mt-2">
              {[
                'ls -la',
                'git status',
                'npm run dev',
                'npm run build',
                'npm test'
              ].map((cmd) => (
                <Button
                  key={cmd}
                  size="sm"
                  variant="outline"
                  onClick={() => sendCommand(activeSession.id, cmd)}
                  className="text-xs"
                >
                  {cmd}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TerminalIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No Active Session</p>
            <p className="text-sm">Create a new Claude Code session to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}