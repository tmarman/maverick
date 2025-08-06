import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VibeChat } from '../VibeChat'

// Mock the ContextualChat component since it has complex dependencies
jest.mock('../ContextualChat', () => ({
  ContextualChat: ({ scope, className }: any) => (
    <div className={className} data-testid="contextual-chat">
      <div>Project: {scope.context.project.name}</div>
      <div>0 messages</div>
      <textarea placeholder="Chat with Claude about the project..." />
      <button disabled>Send</button>
    </div>
  )
}))

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}))

const mockProject = {
  id: 'test-project',
  name: 'Test Project',
  description: 'A test project',
  type: 'web-app',
  status: 'active'
}

describe('VibeChat', () => {
  it('should render the chat interface', () => {
    render(<VibeChat project={mockProject} />)
    
    // Check for main elements
    expect(screen.getByText('Project: Test Project')).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Chat with Claude about the project/)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should pass correct project scope to ContextualChat', () => {
    render(<VibeChat project={mockProject} />)
    
    const contextualChat = screen.getByTestId('contextual-chat')
    expect(contextualChat).toBeInTheDocument()
    expect(screen.getByText('Project: Test Project')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<VibeChat project={mockProject} className="custom-class" />)
    
    const container = screen.getByTestId('contextual-chat').parentElement
    expect(container).toHaveClass('custom-class')
  })
})