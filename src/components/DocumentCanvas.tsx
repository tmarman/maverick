'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface Document {
  id: string
  title: string
  type: string
  status: string
  collaborationMode: string
  content: string
  createdAt: Date
  updatedAt: Date
}

interface DocumentCanvasProps {
  projectId: string
  selectedDocument: string | null
  onSelectDocument: (documentId: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CanvasElement {
  id: string
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'table'
  content: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export function DocumentCanvas({ projectId, selectedDocument, onSelectDocument }: DocumentCanvasProps) {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'canvas' | 'chat' | 'documents'>('documents')
  
  // Canvas state
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [markdownContent, setMarkdownContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isAISending, setIsAISending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Editor refs
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectId) {
      fetchDocuments()
    }
  }, [projectId])

  useEffect(() => {
    if (selectedDocument) {
      loadDocument(selectedDocument)
    }
  }, [selectedDocument])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        console.error('Failed to fetch documents')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (response.ok) {
        const doc = await response.json()
        setCurrentDocument(doc)
        
        // Parse document content
        const parsedContent = parseContent(doc.content)
        setMarkdownContent(parsedContent.markdown || '')
        setChatMessages(parsedContent.messages || [])
      }
    } catch (error) {
      console.error('Error loading document:', error)
    }
  }

  const createNewDocument = async (type: string = 'PRD') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `New ${type} - ${new Date().toLocaleDateString()}`,
          type,
          collaborationMode: 'HYBRID',
          content: JSON.stringify({
            markdown: getDefaultPRDTemplate(),
            messages: [],
            canvasElements: []
          })
        })
      })
      
      if (response.ok) {
        const newDoc = await response.json()
        setDocuments(prev => [...prev, newDoc])
        onSelectDocument(newDoc.id)
        setActiveTab('canvas')
      }
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  const saveDocument = async () => {
    if (!currentDocument) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/documents/${currentDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify({
            markdown: markdownContent,
            messages: chatMessages,
            canvasElements: []
          })
        })
      })
      
      if (response.ok) {
        // Success feedback could go here
      }
    } catch (error) {
      console.error('Error saving document:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const sendChatMessage = async () => {
    if (!newMessage.trim() || isAISending) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsAISending(true)
    
    try {
      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          type: 'business_guidance',
          context: {
            currentContext: 'PRD creation and editing',
            documentContent: markdownContent,
            projectId
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error sending chat message:', error)
    } finally {
      setIsAISending(false)
    }
  }

  const getDefaultPRDTemplate = () => {
    return `# Product Requirements Document

## Overview
*Brief description of the product or feature*

## Problem Statement
*What problem are we solving?*

## Goals & Objectives
- Goal 1
- Goal 2
- Goal 3

## Target Users
*Who will use this product?*

## User Stories
### As a [user type], I want to [action] so that [benefit]

## Functional Requirements
### Core Features
1. Feature 1
2. Feature 2
3. Feature 3

### Nice-to-Have Features
1. Feature A
2. Feature B

## Technical Requirements
- Performance requirements
- Security requirements
- Compatibility requirements

## Success Metrics
- Metric 1: Target value
- Metric 2: Target value

## Timeline
- Phase 1: [Date]
- Phase 2: [Date]
- Launch: [Date]

## Open Questions
- Question 1?
- Question 2?
`
  }

  const formatMarkdown = (text: string): string => {
    // Handle code blocks first to avoid conflicts
    let result = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    
    // Handle headings
    result = result
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    
    // Handle text formatting
    result = result
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Handle lists - process line by line to maintain structure
    const lines = result.split('\n')
    let inList = false
    const processedLines = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.match(/^- /)) {
        if (!inList) {
          processedLines.push('<ul>')
          inList = true
        }
        processedLines.push(`<li>${line.replace(/^- /, '')}</li>`)
      } else if (line.match(/^\d+\. /)) {
        if (!inList) {
          processedLines.push('<ol>')
          inList = true
        }
        processedLines.push(`<li>${line.replace(/^\d+\. /, '')}</li>`)
      } else {
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        
        // Handle paragraphs
        if (line.trim() && !line.match(/^<h[1-6]>/) && !line.match(/^<pre>/)) {
          processedLines.push(`<p>${line}</p>`)
        } else {
          processedLines.push(line)
        }
      }
    }
    
    if (inList) {
      processedLines.push('</ul>')
    }
    
    return processedLines.join('\n')
  }

  const insertMarkdownSyntax = (syntax: string, placeholder: string = '') => {
    if (!editorRef.current) return
    
    const textarea = editorRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = markdownContent.substring(start, end)
    
    let newText = ''
    if (syntax === 'bold') {
      newText = `**${selectedText || placeholder}**`
    } else if (syntax === 'italic') {
      newText = `*${selectedText || placeholder}*`
    } else if (syntax === 'code') {
      newText = `\`${selectedText || placeholder}\``
    } else if (syntax === 'heading') {
      newText = `\n## ${selectedText || placeholder}\n`
    } else if (syntax === 'list') {
      newText = `\n- ${selectedText || placeholder}\n`
    }
    
    const newContent = markdownContent.substring(0, start) + newText + markdownContent.substring(end)
    setMarkdownContent(newContent)
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  const getDocumentIcon = (type: string) => {
    const icons = {
      PRD: '📋',
      CANVAS: '🎨',
      CHAT: '💬',
      SPEC: '📝',
      CODE_REVIEW: '👀',
      MEETING_NOTES: '📝',
      STRATEGY: '🎯',
      RESEARCH: '🔍',
      WIREFRAME: '📐',
      LEGAL: '⚖️'
    }
    return icons[type as keyof typeof icons] || '📄'
  }

  const parseContent = (contentString: string) => {
    try {
      return JSON.parse(contentString)
    } catch {
      return { markdown: '', messages: [], canvasElements: [] }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with tabs */}
      <div className="bg-background-secondary border-b border-border-subtle p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Project Workspace</h2>
          <div className="flex space-x-2">
            {currentDocument && activeTab === 'canvas' && (
              <button 
                onClick={saveDocument}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button 
              onClick={() => createNewDocument('PRD')}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover"
            >
              + New PRD
            </button>
          </div>
        </div>
        
        <div className="flex space-x-4">
          {[
            { id: 'documents', name: 'Documents', icon: '📄' },
            { id: 'canvas', name: 'Canvas', icon: '🎨' },
            { id: 'chat', name: 'AI Chat', icon: '💬' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-white'
                  : 'bg-background-tertiary text-text-secondary hover:bg-border-subtle'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'documents' && (
          <div className="h-full overflow-auto p-6">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No documents yet</h3>
                <p className="text-text-secondary mb-6">
                  Create your first document to start collaborating with AI
                </p>
                <button 
                  onClick={() => createNewDocument('PRD')}
                  className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover"
                >
                  Create PRD
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className={`p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      selectedDocument === doc.id
                        ? 'bg-accent-primary bg-opacity-10 border-2 border-accent-primary'
                        : 'bg-background-secondary border border-border-subtle hover:border-accent-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-2xl">{getDocumentIcon(doc.type)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doc.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        doc.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-text-primary mb-2">{doc.title}</h3>
                    <p className="text-sm text-text-secondary mb-4">{doc.type.replace('_', ' ')}</p>
                    
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{doc.collaborationMode}</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'canvas' && (
          <div className="h-full bg-white flex">
            {!currentDocument ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Select a Document</h3>
                  <p className="text-text-secondary mb-4">Choose a document to edit or create a new PRD</p>
                  <button 
                    onClick={() => createNewDocument('PRD')}
                    className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover"
                  >
                    Create New PRD
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex">
                {/* Editor Toolbar */}
                <div className="w-full flex flex-col">
                  <div className="border-b border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-text-primary">{currentDocument.title}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className={`px-3 py-1 rounded text-sm ${
                            isEditing 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isEditing ? 'Preview' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => insertMarkdownSyntax('bold', 'Bold text')}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                          title="Bold"
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          onClick={() => insertMarkdownSyntax('italic', 'Italic text')}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                          title="Italic"
                        >
                          <em>I</em>
                        </button>
                        <button
                          onClick={() => insertMarkdownSyntax('code', 'code')}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 font-mono"
                          title="Code"
                        >
                          &lt;/&gt;
                        </button>
                        <button
                          onClick={() => insertMarkdownSyntax('heading', 'Heading')}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                          title="Heading"
                        >
                          H2
                        </button>
                        <button
                          onClick={() => insertMarkdownSyntax('list', 'List item')}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                          title="List"
                        >
                          •
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Editor/Preview Area */}
                  <div className="flex-1 flex">
                    {isEditing ? (
                      <textarea
                        ref={editorRef}
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        className="w-full h-full p-6 border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        placeholder="Start writing your PRD in Markdown..."
                        style={{ minHeight: '500px' }}
                      />
                    ) : (
                      <div 
                        ref={previewRef}
                        className="w-full h-full p-6 prose prose-lg max-w-none overflow-auto"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(markdownContent) }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full bg-background-secondary flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-border-subtle p-4">
              <h3 className="font-semibold text-text-primary">AI Assistant</h3>
              <p className="text-sm text-text-secondary">
                {currentDocument ? `Discussing: ${currentDocument.title}` : 'General project chat'}
              </p>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🤖</div>
                  <h4 className="font-semibold text-text-primary mb-2">Start a conversation</h4>
                  <p className="text-text-secondary text-sm">
                    Ask me anything about your PRD, business requirements, or project planning
                  </p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-accent-primary text-white'
                          : 'bg-background-tertiary text-text-primary'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isAISending && (
                <div className="flex justify-start">
                  <div className="bg-background-tertiary text-text-primary px-4 py-2 rounded-lg max-w-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span className="text-sm text-text-secondary">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-border-subtle p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about requirements, features, or get suggestions..."
                  className="flex-1 px-3 py-2 border border-border-standard rounded-lg bg-background-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  disabled={isAISending}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newMessage.trim() || isAISending}
                  className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}