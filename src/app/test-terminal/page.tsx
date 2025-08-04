'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

export default function TestTerminalPage() {
  const { data: session } = useSession()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const connectWebSocket = () => {
    if (!session?.user?.id) {
      addMessage('❌ Please login first')
      return
    }

    const wsUrl = `ws://localhost:5001/ws/claude-terminal?userId=${session.user.id}&projectId=test`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      addMessage('🔗 WebSocket connected')
      setConnected(true)
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            addMessage(`✅ Terminal session created: ${data.sessionId}`)
            setSessionId(data.sessionId)
            break
          case 'output':
            addMessage(`📤 ${data.data}`)
            break
          case 'error':
            addMessage(`❌ ${data.data}`)
            break
          case 'system':
            addMessage(`🔧 ${data.data}`)
            break
          case 'pong':
            addMessage('🏓 Pong received')
            break
          default:
            addMessage(`📨 ${data.type}: ${JSON.stringify(data)}`)
        }
      } catch (error) {
        addMessage(`❌ Error parsing message: ${event.data}`)
      }
    }

    websocket.onclose = (event) => {
      addMessage(`🚪 WebSocket closed: ${event.code} - ${event.reason}`)
      setConnected(false)
      setSessionId(null)
    }

    websocket.onerror = (error) => {
      addMessage(`💥 WebSocket error: ${error}`)
      setConnected(false)
    }

    setWs(websocket)
  }

  const disconnect = () => {
    if (ws) {
      ws.close()
      setWs(null)
    }
  }

  const sendMessage = (message: string, type: string = 'input') => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const data = JSON.stringify({ type, data: message })
      ws.send(data)
      if (type === 'input') {
        addMessage(`📝 > ${message}`)
      }
    } else {
      addMessage('❌ WebSocket not connected')
    }
  }

  const addMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setMessages(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  const sendPing = () => {
    sendMessage('', 'ping')
  }

  const getHistory = () => {
    sendMessage('', 'get_history')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Claude Terminal WebSocket Test</h1>
      
      {/* Connection Status */}
      <div className="mb-4 p-4 rounded-lg border">
        <div className="flex items-center gap-4 mb-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            Status: {connected ? 'Connected' : 'Disconnected'}
          </span>
          {sessionId && (
            <span className="text-sm text-gray-600">Session: {sessionId.slice(0, 8)}...</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {!connected ? (
            <button
              onClick={connectWebSocket}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!session?.user?.id}
            >
              Connect WebSocket
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          )}
          
          {connected && (
            <>
              <button
                onClick={sendPing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Ping
              </button>
              <button
                onClick={getHistory}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Get History
              </button>
            </>
          )}
        </div>
        
        {!session?.user?.id && (
          <p className="text-red-600 mt-2">Please login to test the WebSocket connection</p>
        )}
      </div>

      {/* Message Log */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Message Log</h2>
        <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
          {messages.map((message, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <button
          onClick={() => setMessages([])}
          className="mt-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          Clear Log
        </button>
      </div>

      {/* Input Form */}
      {connected && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command for Claude Code..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      )}

      {/* Test Commands */}
      {connected && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Test Commands:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => sendMessage('Hello Claude!')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Hello Claude!
            </button>
            <button
              onClick={() => sendMessage('What files are in the current directory?')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              List Files
            </button>
            <button
              onClick={() => sendMessage('What is this project about?')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              About Project
            </button>
            <button
              onClick={() => sendMessage('help')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Help
            </button>
          </div>
        </div>
      )}
    </div>
  )
}