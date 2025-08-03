import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VibeChat } from '../VibeChat'

// Mock the hooks and utilities
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}))

jest.mock('@/lib/username-mentions', () => ({
  defaultProjectUsers: [
    { username: 'tim', name: 'Tim Marman' },
    { username: 'jack', name: 'Jack Smith' }
  ],
  getMentionedUsers: jest.fn(() => []),
  formatMentionsForStorage: jest.fn((text) => text)
}))

// Mock fetch
global.fetch = jest.fn()

const mockProject = {
  id: 'test-project',
  name: 'Test Project',
  description: 'A test project',
  type: 'web-app',
  status: 'active'
}

describe('VibeChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful work items fetch
    ;(fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/work-items')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ workItems: [] })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  it('should render the chat interface', async () => {
    render(<VibeChat project={mockProject} />)
    
    // Check for main elements
    expect(screen.getByText('Project Vibe')).toBeInTheDocument()
    expect(screen.getByText('Tasks & Actions')).toBeInTheDocument()
    
    // Check for input field
    expect(screen.getByPlaceholderText(/What's on your mind/)).toBeInTheDocument()
    
    // Check for send button
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show welcome message', async () => {
    render(<VibeChat project={mockProject} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Hey! 👋 I'm here to help you build Test Project/)).toBeInTheDocument()
    })
  })

  it('should load existing work items on mount', async () => {
    const mockWorkItems = [
      {
        id: '1',
        title: 'Test Task',
        description: 'A test task',
        type: 'FEATURE',
        status: 'ACTIVE',
        priority: 'HIGH',
        category: 'Development',
        createdAt: new Date().toISOString()
      }
    ]

    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workItems: mockWorkItems })
      })
    )

    render(<VibeChat project={mockProject} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/projects/${mockProject.name}/work-items`)
    })
  })

  it('should handle input changes', () => {
    render(<VibeChat project={mockProject} />)
    
    const input = screen.getByPlaceholderText(/What's on your mind/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    
    expect(input).toHaveValue('Test message')
  })

  it('should disable send button when input is empty', () => {
    render(<VibeChat project={mockProject} />)
    
    const sendButton = screen.getByRole('button')
    expect(sendButton).toBeDisabled()
  })

  it('should enable send button when input has content', () => {
    render(<VibeChat project={mockProject} />)
    
    const input = screen.getByPlaceholderText(/What's on your mind/)
    const sendButton = screen.getByRole('button')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    expect(sendButton).not.toBeDisabled()
  })

  it('should send message on Enter key press', () => {
    const mockFetch = fetch as jest.Mock
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          assistantResponse: 'Test response',
          workItemsCreated: []
        })
      })
    )

    render(<VibeChat project={mockProject} />)
    
    const input = screen.getByPlaceholderText(/What's on your mind/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter' })

    // Should clear input after sending
    expect(input).toHaveValue('')
  })

  it('should not send message on Shift+Enter', () => {
    render(<VibeChat project={mockProject} />)
    
    const input = screen.getByPlaceholderText(/What's on your mind/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', shiftKey: true })

    // Should not clear input
    expect(input).toHaveValue('Test message')
  })

  it('should handle task selection', async () => {
    const mockTask = {
      id: '1',
      title: 'Test Task',
      description: 'A test task',
      type: 'FEATURE' as const,
      status: 'PLANNED' as const,
      priority: 'HIGH' as const,
      category: 'Development',
      createdAt: new Date(),
      needsAction: false
    }

    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          workItems: [{
            ...mockTask,
            createdAt: mockTask.createdAt.toISOString()
          }] 
        })
      })
    )

    render(<VibeChat project={mockProject} />)

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Click on the task
    fireEvent.click(screen.getByText('Test Task'))

    // Should show context message
    await waitFor(() => {
      expect(screen.getByText(/📍 Task Selected: Test Task/)).toBeInTheDocument()
    })
  })

  it('should filter tasks correctly', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Active Task',
        type: 'FEATURE',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'Development',
        createdAt: new Date().toISOString(),
        needsAction: false
      },
      {
        id: '2',
        title: 'Planned Task',
        type: 'FEATURE',
        status: 'PLANNED',
        priority: 'MEDIUM',
        category: 'Development',
        createdAt: new Date().toISOString(),
        needsAction: true
      }
    ]

    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workItems: mockTasks })
      })
    )

    render(<VibeChat project={mockProject} />)

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Active Task')).toBeInTheDocument()
      expect(screen.getByText('Planned Task')).toBeInTheDocument()
    })

    // Click "Active" filter
    fireEvent.click(screen.getByText('Active'))

    // Should only show active task
    expect(screen.getByText('Active Task')).toBeInTheDocument()
    expect(screen.queryByText('Planned Task')).not.toBeInTheDocument()
  })

  it('should show loading state when sending message', async () => {
    let resolvePromise: (value: any) => void
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(fetch as jest.Mock).mockImplementationOnce(() => mockPromise)

    render(<VibeChat project={mockProject} />)
    
    const input = screen.getByPlaceholderText(/What's on your mind/)
    const sendButton = screen.getByRole('button')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Thinking...')).toBeInTheDocument()
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({
        assistantResponse: 'Test response',
        workItemsCreated: []
      })
    })

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      })
    )

    render(<VibeChat project={mockProject} />)
    
    const input = screen.getByPlaceholderText(/What's on your mind/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(screen.getByRole('button'))

    // Should show fallback message
    await waitFor(() => {
      expect(screen.getByText(/I understand what you're looking for/)).toBeInTheDocument()
    })
  })

  it('should show empty state when no tasks', () => {
    render(<VibeChat project={mockProject} />)
    
    // Should show empty state
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument()
    expect(screen.getByText('Start chatting to create some!')).toBeInTheDocument()
  })

  it('should display task priorities correctly', async () => {
    const mockTask = {
      id: '1',
      title: 'High Priority Task',
      type: 'FEATURE',
      status: 'PLANNED',
      priority: 'HIGH',
      category: 'Development',
      createdAt: new Date().toISOString(),
      needsAction: false
    }

    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workItems: [mockTask] })
      })
    )

    render(<VibeChat project={mockProject} />)

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument()
    })
  })
})