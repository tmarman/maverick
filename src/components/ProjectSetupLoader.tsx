'use client'

import { useState, useEffect } from 'react'

const SETUP_MESSAGES = [
  "Reticulating splines...",
  "Warming up the quantum flux capacitors...",
  "Teaching AI agents proper git etiquette...",
  "Convincing electrons to flow in the right direction...",
  "Untangling the spaghetti code...",
  "Asking the rubber duck for debugging advice...",
  "Calibrating the coffee-to-code conversion matrix...",
  "Negotiating with stubborn APIs...",
  "Herding cats into proper directory structures...",
  "Optimizing for maximum synergy...",
  "Bootstrapping the flux inhibitor...",
  "Compiling hopes and dreams into executable reality...",
  "Synchronizing the chaos generators...",
  "Initializing the procrastination prevention protocols...",
  "Loading the universal answer (still 42)...",
  "Convincing databases to actually base their data...",
  "Teaching git to play nice with others...",
  "Downloading more RAM from the cloud...",
  "Adjusting the reality distortion field...",
  "Feeding the algorithm its daily dose of caffeine...",
  "Translating business requirements into developer tears...",
  "Optimizing the office plant's photosynthesis rate...",
  "Calibrating the bug-to-feature ratio...",
  "Summoning the ancient spirits of Silicon Valley...",
  "Preparing the sacred deployment rituals..."
]

interface ProjectSetupLoaderProps {
  projectName: string
  isVisible: boolean
  onComplete?: () => void
}

export function ProjectSetupLoader({ projectName, isVisible, onComplete }: ProjectSetupLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(SETUP_MESSAGES[0])
  const [messageIndex, setMessageIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isVisible) return

    // Cycle through messages every 2 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % SETUP_MESSAGES.length)
    }, 2000)

    // Animate dots every 500ms
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => {
      clearInterval(messageInterval)
      clearInterval(dotsInterval)
    }
  }, [isVisible])

  useEffect(() => {
    setCurrentMessage(SETUP_MESSAGES[messageIndex])
  }, [messageIndex])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background-primary/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-background-secondary border border-border-subtle rounded-2xl p-8 shadow-2xl">
          {/* Animated icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-accent-secondary border-b-transparent rounded-full animate-spin animate-reverse" style={{animationDuration: '1.5s'}}></div>
            </div>
          </div>

          {/* Project info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Setting up {projectName}
            </h2>
            <p className="text-text-secondary">
              Initializing your project workspace...
            </p>
          </div>

          {/* Fun loading message */}
          <div className="text-center">
            <p className="text-accent-primary font-mono text-sm min-h-[1.5rem]">
              {currentMessage}{dots}
            </p>
          </div>

          {/* Progress bar (indeterminate) */}
          <div className="mt-6">
            <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-text-muted text-center mt-4">
            This may take a few moments while we clone repositories and set up your workspace
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProjectSetupLoader