'use client'

import { useState, useEffect, useCallback } from 'react'
import { taskOrderingService, TaskOrder } from '@/lib/task-ordering'

export interface UseTaskOrderingOptions {
  maverickPath: string
  onOrderChange?: (order: TaskOrder) => void
}

export function useTaskOrdering({ maverickPath, onOrderChange }: UseTaskOrderingOptions) {
  const [order, setOrder] = useState<TaskOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial order
  useEffect(() => {
    let mounted = true

    const loadOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const taskOrder = await taskOrderingService.getTaskOrder(maverickPath)
        
        if (mounted) {
          setOrder(taskOrder)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load task order')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadOrder()

    return () => {
      mounted = false
    }
  }, [maverickPath])

  // Apply ordering to tasks
  const applyOrder = useCallback(<T extends { id: string; status: string }>(tasks: T[]): T[] => {
    if (!order) return tasks
    return taskOrderingService.applyOrderToTasks(tasks, order)
  }, [order])

  // Reorder tasks (drag and drop)
  const reorderTasks = useCallback(async (
    taskId: string,
    fromStatus: string,
    toStatus: string,
    newIndex: number
  ) => {
    try {
      const newOrder = await taskOrderingService.reorderTasks(
        maverickPath,
        taskId,
        fromStatus,
        toStatus,
        newIndex
      )
      
      setOrder(newOrder)
      
      if (onOrderChange) {
        onOrderChange(newOrder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks')
    }
  }, [maverickPath, onOrderChange])

  // Add new task to order
  const addTask = useCallback(async (
    taskId: string,
    status: string,
    position: 'top' | 'bottom' = 'top'
  ) => {
    try {
      await taskOrderingService.addTaskToOrder(maverickPath, taskId, status, position)
      
      // Reload order
      const newOrder = await taskOrderingService.getTaskOrder(maverickPath)
      setOrder(newOrder)
      
      if (onOrderChange) {
        onOrderChange(newOrder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task to order')
    }
  }, [maverickPath, onOrderChange])

  // Remove task from order
  const removeTask = useCallback(async (taskId: string) => {
    try {
      await taskOrderingService.removeTaskFromOrder(maverickPath, taskId)
      
      // Reload order
      const newOrder = await taskOrderingService.getTaskOrder(maverickPath)
      setOrder(newOrder)
      
      if (onOrderChange) {
        onOrderChange(newOrder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove task from order')
    }
  }, [maverickPath, onOrderChange])

  // Toggle section collapsed state
  const toggleSectionCollapsed = useCallback(async (
    sectionName: string,
    isCustom = false
  ) => {
    try {
      await taskOrderingService.toggleSectionCollapsed(maverickPath, sectionName, isCustom)
      
      // Reload order
      const newOrder = await taskOrderingService.getTaskOrder(maverickPath)
      setOrder(newOrder)
      
      if (onOrderChange) {
        onOrderChange(newOrder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle section')
    }
  }, [maverickPath, onOrderChange])

  // Create custom section
  const createCustomSection = useCallback(async (
    sectionName: string,
    taskIds: string[] = [],
    color?: string
  ) => {
    try {
      await taskOrderingService.createCustomSection(maverickPath, sectionName, taskIds, color)
      
      // Reload order
      const newOrder = await taskOrderingService.getTaskOrder(maverickPath)
      setOrder(newOrder)
      
      if (onOrderChange) {
        onOrderChange(newOrder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom section')
    }
  }, [maverickPath, onOrderChange])

  return {
    order,
    loading,
    error,
    applyOrder,
    reorderTasks,
    addTask,
    removeTask,
    toggleSectionCollapsed,
    createCustomSection
  }
}

/**
 * Usage Example:
 * 
 * function TaskList({ maverickPath, tasks }) {
 *   const { applyOrder, reorderTasks, addTask } = useTaskOrdering({
 *     maverickPath,
 *     onOrderChange: (order) => console.log('Order updated:', order)
 *   })
 * 
 *   const orderedTasks = applyOrder(tasks)
 * 
 *   const handleDragEnd = (result) => {
 *     const { draggableId, source, destination } = result
 *     
 *     if (!destination) return
 *     
 *     reorderTasks(
 *       draggableId,
 *       source.droppableId,
 *       destination.droppableId,
 *       destination.index
 *     )
 *   }
 * 
 *   // When creating a new task
 *   const handleNewTask = (taskId, status) => {
 *     addTask(taskId, status, 'top')
 *   }
 * 
 *   return (
 *     <DragDropContext onDragEnd={handleDragEnd}>
 *       // ... your drag and drop UI
 *     </DragDropContext>
 *   )
 * }
 */