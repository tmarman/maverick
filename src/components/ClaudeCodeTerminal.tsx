'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface ClaudeCodeTerminalProps {
  projectId?: string
  workingDir?: string
  initialPrompt?: string
  onGenerated?: (files: string[]) => void
}

interface TerminalMessage {
  type: 'output' | 'error' | 'input' | 'system'
  data: string
  timestamp: Date
}

export function ClaudeCodeTerminal({ 
  projectId, 
  workingDir, 
  initialPrompt,
  onGenerated 
}: ClaudeCodeTerminalProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<TerminalMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addMessage = (type: TerminalMessage['type'], data: string) => {
    setMessages(prev => [...prev, {
      type,
      data,
      timestamp: new Date()
    }])
  }

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startClaudeCodeSession = async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    addMessage('system', '🚀 Starting Claude Code session...')
    
    try {
      const response = await fetch('/api/claude-code/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          projectId,
          workingDir,
          initialPrompt
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSessionId(data.sessionId)
        connectWebSocket(data.sessionId)
      } else {
        addMessage('error', `Failed to start session: ${data.error}`)
      }
    } catch (error) {
      addMessage('error', `Error starting session: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const connectWebSocket = (sessionId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/claude-code/ws?sessionId=${sessionId}&userId=${session?.user?.id}&projectId=${projectId}&workingDir=${encodeURIComponent(workingDir || '')}`
    
    addMessage('system', 'Connecting to Claude Code...')
    
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      setConnected(true)
      addMessage('system', '✅ Connected to Claude Code!')
      
      if (initialPrompt) {
        addMessage('input', initialPrompt)
        wsRef.current?.send(JSON.stringify({
          type: 'input',
          data: initialPrompt
        }))
      }
    }
    
    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        switch (message.type) {
          case 'output':
            addMessage('output', message.data)
            // Check if files were generated
            if (message.data.includes('Created') || message.data.includes('Modified')) {
              const files = extractGeneratedFiles(message.data)
              if (files.length > 0) {
                onGenerated?.(files)
                // Auto-commit to GitHub
                autoCommitGeneratedCode(files)
              }
            }
            break
            
          case 'error':
            addMessage('error', message.data)
            break
            
          case 'close':
            setConnected(false)
            addMessage('system', `Session ended (code: ${message.code})`)
            break
            
          case 'connected':
            addMessage('system', `Working directory: ${message.workingDir}`)
            break
            
          case 'pong':
            // Handle ping/pong for connection health
            break
            
          default:
            addMessage('output', JSON.stringify(message))
        }
      } catch (error) {
        addMessage('error', `Message parsing error: ${error}`)
      }
    }
    
    wsRef.current.onclose = () => {
      setConnected(false)
      addMessage('system', '❌ Disconnected from Claude Code')
    }
    
    wsRef.current.onerror = (error) => {
      addMessage('error', `WebSocket error: ${error}`)
    }
  }

  const extractGeneratedFiles = (output: string): string[] => {
    const files: string[] = []
    const lines = output.split('\n')
    
    for (const line of lines) {
      if (line.includes('Created') || line.includes('Modified')) {
        const match = line.match(/(?:Created|Modified):\s*(.+)/)
        if (match) {
          files.push(match[1].trim())
        }
      }
    }
    
    return files
  }

  const autoCommitGeneratedCode = async (files: string[]) => {
    if (!projectId) return
    
    try {
      addMessage('system', '📝 Auto-committing generated code to GitHub...')
      
      const response = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
          message: `Generate code from PRD

Files generated:
${files.map(f => `- ${f}`).join('\n')}`,
          createRepo: false // Don't create new repo, just commit
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addMessage('system', `✅ Code committed to GitHub: ${result.commitHash?.substring(0, 8)}`)
        if (result.repoUrl) {
          addMessage('system', `🔗 Repository: ${result.repoUrl}`)
        }
      } else {
        addMessage('system', `⚠️  Could not auto-commit: ${result.error}`)
      }
    } catch (error) {
      addMessage('system', `❌ Auto-commit failed: ${error}`)
    }
  }

  const sendInput = () => {
    if (!input.trim() || !connected || !wsRef.current) return
    
    addMessage('input', input)
    wsRef.current.send(JSON.stringify({
      type: 'input',
      data: input
    }))
    
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendInput()
    } else if (e.key === 'c' && e.ctrlKey) {
      // Send interrupt signal
      if (wsRef.current && connected) {
        wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
        addMessage('system', '^C (Interrupt sent)')
      }
    }
  }

  const terminateSession = async () => {
    if (sessionId) {
      try {
        await fetch('/api/claude-code/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'terminate',
            sessionId
          })
        })
      } catch (error) {
        console.error('Error terminating session:', error)
      }
    }
    
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    setConnected(false)
    setSessionId(null)
    addMessage('system', 'Session terminated')
  }

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg overflow-hidden flex flex-col h-full">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-300 text-xs">
            Claude Code Terminal
            {connected && <span className="text-green-400 ml-2">●</span>}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {!connected ? (
            <button
              onClick={startClaudeCodeSession}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Session'}
            </button>
          ) : (
            <button
              onClick={terminateSession}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
            >
              Terminate
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-auto space-y-1 min-h-0"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message, index) => (
          <div key={index} className={`whitespace-pre-wrap ${
            message.type === 'input' ? 'text-white' :
            message.type === 'error' ? 'text-red-400' :
            message.type === 'system' ? 'text-blue-400' :
            'text-green-400'
          }`}>
            {message.type === 'input' && <span className="text-yellow-400">$ </span>}
            {message.type === 'system' && <span className="text-blue-400">[SYSTEM] </span>}
            {message.data}
          </div>
        ))}
        
        {connected && (
          <div className="flex items-center">
            <span className="text-yellow-400">$ </span>
            <span className="ml-1 bg-green-400 w-2 h-4 animate-pulse"></span>
          </div>
        )}
      </div>

      {/* Terminal Input */}
      {connected && (
        <div className="border-t border-gray-700 p-2">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent text-green-400 outline-none"
              placeholder="Type a command or prompt..."
              autoFocus
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press Enter to send • Ctrl+C to interrupt
          </div>
        </div>
      )}
    </div>
  )
}