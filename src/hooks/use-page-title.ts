'use client'

import { useEffect } from 'react'

/**
 * Custom hook to dynamically set page titles that are user-friendly
 * Automatically formats titles to be useful for browser tabs and bookmarks
 */
export function usePageTitle(title: string, project?: string) {
  useEffect(() => {
    const originalTitle = document.title
    
    // Build user-friendly title
    let pageTitle = title
    
    if (project) {
      pageTitle = `${title} - ${project}`
    }
    
    // Add Maverick branding for context, but keep it minimal
    document.title = `${pageTitle} • Maverick`
    
    // Cleanup on unmount
    return () => {
      document.title = originalTitle
    }
  }, [title, project])
}

/**
 * Formats project names to be more readable in titles
 */
export function formatProjectTitle(projectName: string): string {
  return projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Common title patterns for different page types
 */
export const PAGE_TITLES = {
  // Main app pages
  dashboard: 'Dashboard',
  cockpit: 'Project Hub',
  projects: 'All Projects',
  
  // Project-specific pages
  projectOverview: (project: string) => `${formatProjectTitle(project)} Overview`,
  projectTasks: (project: string) => `Tasks - ${formatProjectTitle(project)}`,
  projectChat: (project: string) => `Chat - ${formatProjectTitle(project)}`,
  projectAgents: (project: string) => `AI Agents - ${formatProjectTitle(project)}`,
  projectTeam: (project: string) => `Team - ${formatProjectTitle(project)}`,
  
  // Task-specific
  taskDetail: (taskTitle: string, project: string) => `${taskTitle} - ${formatProjectTitle(project)}`,
  
  // General pages
  settings: 'Settings',
  repositories: 'Import Repository',
  users: 'Team Members',
  
  // Auth pages
  login: 'Sign In',
  register: 'Create Account',
  forgotPassword: 'Reset Password',
  onboarding: 'Welcome to Maverick',
  
  // Business formation
  formation: 'Business Formation',
  documents: 'Legal Documents',
  
  // Marketing pages  
  home: 'AI-Native Founder Platform',
  about: 'About Maverick',
  pricing: 'Pricing Plans',
  investors: 'For Investors',
  docs: 'Documentation'
} as const