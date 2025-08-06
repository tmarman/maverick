'use client'

import { useState, useEffect } from 'react'
import { ContextualChat, type ChatScope, type ChatAction, type ChatMessage } from '@/components/ContextualChat'
import { toast } from '@/hooks/use-toast'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
}

interface VibeChatProps {
  project: Project
  className?: string
}

export function VibeChat({ project, className }: VibeChatProps) {
  // Create project-level chat scope
  const chatScope: ChatScope = {
    type: 'project',
    projectName: project.name.toLowerCase(),
    title: `Project: ${project.name}`,
    workingDirectory: '/tmp/repos/maverick/main',
    context: {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        status: project.status
      }
    }
  }

  const handleAction = async (action: ChatAction) => {
    // Handle project-level actions
    switch (action.type) {
      case 'create_task':
        toast({
          title: 'Task Created',
          description: `New task: ${action.title}`
        })
        // Optionally refresh the work items list
        break
      
      case 'run_command':
        toast({
          title: 'Command Executed',
          description: action.title
        })
        break
      
      default:
        console.log('Action executed:', action)
    }
  }

  const handleMessageSent = (message: ChatMessage) => {
    // Optionally handle when messages are sent
    console.log('Message sent:', message)
  }

  return (
    <div className={`h-full ${className}`}>
      <ContextualChat
        scope={chatScope}
        onAction={handleAction}
        onMessageSent={handleMessageSent}
        className="h-full"
      />
    </div>
  )
}