'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  GitBranch, 
  Users, 
  Lightbulb,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useParams } from 'next/navigation'

interface WorktreeCategory {
  id: string
  name: string
  description: string
  team: string
  color: string
}

interface SmartTaskCategorizationPreviewProps {
  title: string
  description?: string
  type?: string
  functionalArea?: string
  className?: string
}

export default function SmartTaskCategorizationPreview({ 
  title, 
  description = '', 
  type = '', 
  functionalArea = '',
  className = ''
}: SmartTaskCategorizationPreviewProps) {
  const params = useParams()
  const projectName = params?.name as string
  const [category, setCategory] = useState<WorktreeCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<WorktreeCategory[]>([])

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      if (!projectName) return
      
      try {
        const response = await fetch(`/api/projects/${projectName}/categories`)
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            team: c.name, // Use name as team for now
            color: c.color,
            keywords: c.keywords || []
          })))
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    
    loadCategories()
  }, [projectName])

  // Smart categorization
  useEffect(() => {
    if (!title.trim() || categories.length === 0) {
      setCategory(null)
      return
    }

    setIsLoading(true)
    
    // Debounce the categorization
    const timeoutId = setTimeout(() => {
      const smartCategory = categorizeTask(title, description, type, functionalArea, categories)
      setCategory(smartCategory)
      setIsLoading(false)
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [title, description, type, functionalArea, categories])

  // Smart categorization logic using dynamic categories
  const categorizeTask = (title: string, description: string, type: string, functionalArea: string, categories: WorktreeCategory[]): WorktreeCategory | null => {
    if (categories.length === 0) return null
    
    const content = `${title} ${description} ${type} ${functionalArea}`.toLowerCase()

    const matchesKeywords = (content: string, keywords: string[]): boolean => {
      return keywords.some(keyword => content.includes(keyword.toLowerCase()))
    }
    
    let bestMatch: { category: WorktreeCategory; score: number } | null = null
    
    // Score each category based on keyword matches and description
    for (const category of categories) {
      let score = 0
      
      // Check keywords from category definition (if available)
      if ((category as any).keywords && Array.isArray((category as any).keywords)) {
        for (const keyword of (category as any).keywords) {
          if (content.includes(keyword.toLowerCase())) {
            score += 2 // Strong keyword match
          }
        }
      }
      
      // Check category name words
      const categoryWords = category.name.toLowerCase().split(/[\s&\-]+/)
      for (const word of categoryWords) {
        if (word.length > 2 && content.includes(word)) {
          score += 1 // Name word match
        }
      }
      
      // Check description words
      if (category.description) {
        const descWords = category.description.toLowerCase().split(/[\s,\.]+/)
        for (const word of descWords) {
          if (word.length > 3 && content.includes(word)) {
            score += 0.5 // Description word match
          }
        }
      }
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { category, score }
      }
    }
    
    // Only return confident matches (score >= 2)
    if (bestMatch && bestMatch.score >= 2) {
      return bestMatch.category
    }
    
    // Default to first category if no confident match
    return categories[0]
  }

  if (!title.trim()) {
    return (
      <div className={`text-xs text-gray-400 italic ${className}`}>
        Start typing to see smart categorization...
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-gray-500 ${className}`}>
        <Sparkles className="w-3 h-3 animate-pulse" />
        <span>Analyzing task...</span>
      </div>
    )
  }

  if (!category) return null

  return (
    <Card className={`bg-gray-50 border-l-4 ${className}`} style={{ borderLeftColor: category.color }}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">Smart Categorization</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="w-3 h-3 text-gray-500" />
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: `${category.color}20`, color: category.color, borderColor: `${category.color}40` }}
                >
                  {category.team} Team
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <GitBranch className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {category.name}
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </div>
          </div>
          
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span>🌳</span>
            <span>Will join existing work queue or create new worktree</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}