'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  FileText,
  Lightbulb,
  GripVertical,
  Palette,
  RefreshCw,
  ArrowRight,
  Folder,
  FolderOpen
} from 'lucide-react'

interface ProjectCategory {
  id: string
  name: string
  color: string
  description: string
  keywords: string[]
  examples: string[]
  isCustom?: boolean
}

interface WorkItem {
  id: string
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PENDING' | 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'BLOCKED' | 'DEFERRED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  parentId?: string
  smartCategory?: {
    id: string
    name: string
    color: string
  }
}

interface CategoryManagerProps {
  projectName: string
  isOpen: boolean
  onClose: () => void
  categories: ProjectCategory[]
  onCategoriesUpdate: () => void
  workItems?: WorkItem[]
  onWorkItemUpdate?: (workItemId: string, categoryId: string) => void
}

export function CategoryManager({ 
  projectName, 
  isOpen, 
  onClose, 
  categories, 
  onCategoriesUpdate,
  workItems = [],
  onWorkItemUpdate
}: CategoryManagerProps) {
  console.log('🎯 CategoryManager component rendered!')
  console.log(`🎯 Props received: isOpen=${isOpen}, workItems.length=${workItems.length}, categories.length=${categories.length}`)
  
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [suggestingNew, setSuggestingNew] = useState(false)
  const [showRecategorize, setShowRecategorize] = useState(false)
  const [categorizingTasks, setCategorizingTasks] = useState(false)

  // Default colors for new categories
  const defaultColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EF4444', '#EC4899', '#6B7280', '#14B8A6',
    '#F97316', '#84CC16', '#8B5CF6', '#F43F5E'
  ]

  const handleCreateNew = () => {
    const newCategory: ProjectCategory = {
      id: `custom-${Date.now()}`,
      name: 'New Category',
      color: defaultColors[categories.length % defaultColors.length],
      description: 'Custom category description',
      keywords: [],
      examples: [],
      isCustom: true
    }
    setEditingCategory(newCategory)
    setIsCreatingNew(true)
  }

  const handleSave = async () => {
    if (!editingCategory) return

    // TODO: Implement actual save to .maverick/categories.md
    console.log('Saving category:', editingCategory)
    
    // For now, just close the editing state
    setEditingCategory(null)
    setIsCreatingNew(false)
    onCategoriesUpdate()
  }

  const handleSuggestNewCategories = async () => {
    setSuggestingNew(true)
    
    // TODO: Implement AI-powered category suggestions based on current tasks
    setTimeout(() => {
      console.log('AI suggested new categories based on current work items')
      setSuggestingNew(false)
    }, 2000)
  }

  const handleDelete = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? This will uncategorize all tasks in this category.')) {
      // TODO: Implement category deletion
      console.log('Deleting category:', categoryId)
      onCategoriesUpdate()
    }
  }

  const handleAutoCategorizeTasks = async () => {
    console.log('🤖 Starting auto-categorization...')
    console.log(`📝 Uncategorized items to process: ${uncategorizedItems.length}`)
    
    if (!onWorkItemUpdate || uncategorizedItems.length === 0) return
    
    // Close modal immediately and start background processing
    onClose()
    
    // Notify parent component that categorization has started
    if (onCategoriesUpdate) {
      (onCategoriesUpdate as any).onCategorizationStart?.(uncategorizedItems.length)
    }
    
    try {
      let categorizedCount = 0
      
      for (const item of uncategorizedItems) {
        console.log(`\n🔍 Analyzing: "${item.title}"`)
        const itemText = `${item.title} ${item.description || ''}`.toLowerCase()
        console.log(`📄 Full text: "${itemText}"`)
        let bestMatch: { categoryId: string; categoryName: string; score: number } | null = null
        
        // Score each category based on keyword matches
        for (const category of categories) {
          console.log(`  🏷️ Testing category: ${category.name}`)
          let score = 0
          
          // Check keywords
          for (const keyword of category.keywords) {
            if (itemText.includes(keyword.toLowerCase())) {
              console.log(`    ✅ Keyword match: "${keyword}" (+2 points)`)
              score += 2
            }
          }
          
          // Check category name
          const categoryWords = category.name.toLowerCase().split(/[\s&]+/)
          for (const word of categoryWords) {
            if (word.length > 2 && itemText.includes(word)) {
              console.log(`    ✅ Category word match: "${word}" (+1 point)`)
              score += 1
            }
          }
          
          // Check description words
          const descWords = category.description.toLowerCase().split(/[\s,]+/)
          for (const word of descWords) {
            if (word.length > 3 && itemText.includes(word)) {
              console.log(`    ✅ Description word match: "${word}" (+0.5 points)`)
              score += 0.5
            }
          }
          
          console.log(`    📊 Total score for ${category.name}: ${score}`)
          
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { categoryId: category.id, categoryName: category.name, score }
          }
        }
        
        // Only categorize if we have a confident match (score >= 2)
        if (bestMatch && bestMatch.score >= 2) {
          console.log(`✅ Best match: ${bestMatch.categoryName} (score: ${bestMatch.score})`)
          console.log(`🔄 Calling onWorkItemUpdate(${item.id}, ${bestMatch.categoryId})`)
          await onWorkItemUpdate(item.id, bestMatch.categoryId)
          categorizedCount++
          
          // Notify progress
          if (onCategoriesUpdate) {
            (onCategoriesUpdate as any).onCategorizationProgress?.(categorizedCount, uncategorizedItems.length, item.title, bestMatch.categoryName)
          }
          
          // Add a small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 300))
        } else {
          console.log(`❌ No confident match (best score: ${bestMatch?.score || 0})`)
        }
      }
      
      console.log(`📊 Successfully categorized ${categorizedCount} tasks using keyword matching`)
      
      // Notify completion
      if (onCategoriesUpdate) {
        (onCategoriesUpdate as any).onCategorizationComplete?.(categorizedCount, uncategorizedItems.length)
      }
      
    } catch (error) {
      console.error('Error categorizing tasks:', error)
      // Notify error
      if (onCategoriesUpdate) {
        (onCategoriesUpdate as any).onCategorizationError?.(error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  const getWorkItemsByCategory = () => {
    console.log('🔍 CategoryManager: Analyzing work items...')
    console.log(`📊 Total workItems received: ${workItems.length}`)
    console.log('📝 Work items breakdown:', workItems.map(item => ({
      id: item.id.substring(0, 8),
      title: item.title,
      type: item.type,
      hasParent: !!item.parentId,
      smartCategory: item.smartCategory?.name || 'None'
    })))

    const categorized = new Map<string, WorkItem[]>()
    const uncategorized: WorkItem[] = []

    // Initialize all categories
    categories.forEach(cat => {
      categorized.set(cat.id, [])
    })

    console.log(`📂 Available categories: ${categories.length}`)
    console.log('📂 Categories:', categories.map(cat => ({ id: cat.id, name: cat.name })))

    // Sort work items into categories
    workItems.forEach(item => {
      console.log(`🔄 Processing item: "${item.title}" (${item.type})`)
      console.log(`   - Has smartCategory: ${!!item.smartCategory}`)
      console.log(`   - SmartCategory ID: ${item.smartCategory?.id || 'None'}`)
      console.log(`   - SmartCategory Name: ${item.smartCategory?.name || 'None'}`)
      console.log(`   - Has parentId: ${!!item.parentId} (${item.parentId || 'None'})`)
      
      if (item.smartCategory?.id) {
        const categoryItems = categorized.get(item.smartCategory.id)
        if (categoryItems) {
          categoryItems.push(item)
          console.log(`   ✅ Added to category: ${item.smartCategory.name}`)
        } else {
          uncategorized.push(item)
          console.log(`   ❌ Category not found, adding to uncategorized`)
        }
      } else {
        uncategorized.push(item)
        console.log(`   📝 No category, adding to uncategorized`)
      }
    })

    console.log(`📊 Final categorization results:`)
    console.log(`   - Uncategorized: ${uncategorized.length}`)
    categories.forEach(cat => {
      const items = categorized.get(cat.id) || []
      console.log(`   - ${cat.name}: ${items.length}`)
    })

    return { categorized, uncategorized }
  }

  const { categorized: categorizedItems, uncategorized: uncategorizedItems } = getWorkItemsByCategory()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
          <div className="flex items-center gap-2">
            {workItems.length > 0 && uncategorizedItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoCategorizeTasks}
                disabled={categorizingTasks}
                className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 text-blue-700"
              >
                {categorizingTasks ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1">
                  {categorizingTasks ? 'Categorizing...' : 'Auto Categorize Tasks'}
                </span>
              </Button>
            )}
            {workItems.length > 0 && (
              <Button
                variant={showRecategorize ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRecategorize(!showRecategorize)}
                className={showRecategorize ? "bg-gray-600 text-white" : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 text-gray-700"}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                View Categorization
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggestNewCategories}
              disabled={suggestingNew}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700"
            >
              {suggestingNew ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              <span className="ml-1">Suggest New</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNew}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          {editingCategory && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium mb-4">
                {isCreatingNew ? 'Create New Category' : 'Edit Category'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      name: e.target.value
                    })}
                    placeholder="e.g., Authentication & Security"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        color: e.target.value
                      })}
                      placeholder="#3B82F6"
                      className="w-24"
                    />
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: editingCategory.color }}
                    />
                    <div className="flex gap-1">
                      {defaultColors.slice(0, 6).map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingCategory({
                            ...editingCategory,
                            color
                          })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    description: e.target.value
                  })}
                  placeholder="Describe what types of work belong in this category"
                  rows={2}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (for auto-categorization)
                </label>
                <Input
                  value={editingCategory.keywords.join(', ')}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  })}
                  placeholder="auth, login, security, permissions"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null)
                    setIsCreatingNew(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}

          {showRecategorize && workItems.length > 0 && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium mb-4 text-gray-900">Task Categorization Overview</h3>
              
              {/* Uncategorized Tasks */}
              {uncategorizedItems.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-600" />
                    Uncategorized Tasks ({uncategorizedItems.length})
                  </h4>
                  <p className="text-sm text-amber-700 mb-3">
                    These tasks need categorization. Click "Auto Categorize Tasks" to let AI organize them for you.
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uncategorizedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-white rounded border border-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium">{item.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 ml-5 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Tasks by Category */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Tasks by Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => {
                    const categoryItems = categorizedItems.get(category.id) || []
                    return (
                      <div
                        key={category.id}
                        className="p-3 border border-gray-200 rounded-lg bg-white"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryItems.length} tasks
                          </Badge>
                        </div>
                        {categoryItems.length > 0 ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {categoryItems.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                                <span className="truncate">{item.title}</span>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {item.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            No tasks in this category yet
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Current Categories ({categories.length})</h3>
            
            <div className="space-y-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: category.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            {category.isCustom && (
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{category.description}</p>
                          {category.keywords.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {category.keywords.slice(0, 5).map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                              {category.keywords.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{category.keywords.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {category.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Categories help organize your work by functional area. 
            Use "Suggest New" to get AI-powered category recommendations based on your current tasks.
          </p>
        </div>
      </div>
    </div>
  )
}