import React from 'react'
import { 
  PlayCircle, 
  GitBranch, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown,
  GripVertical,
  Clock,
  AlertTriangle,
  Bug,
  Zap,
  BookOpen,
  Target,
  CheckSquare,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskTreeItemProps {
  item: any
  index: number
  globalIndex: number
  level: number
  isExpanded: boolean
  onToggleExpand: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onStartWorking: () => void
  onCheckProgress: () => void
  onCheckStatus: () => void
  draggedItemId?: string
  dragOverIndex?: number | null
  allItems: any[]
  collapsedTasks: Set<string>
  onToggleTaskExpansion: (taskId: string) => void
}

const TaskTreeItem: React.FC<TaskTreeItemProps> = ({
  item,
  index,
  globalIndex,
  level,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onStartWorking,
  onCheckProgress,
  onCheckStatus,
  draggedItemId,
  dragOverIndex,
  allItems,
  collapsedTasks,
  onToggleTaskExpansion
}) => {
  // Get child items for this task
  const childItems = allItems.filter(child => child.parentId === item.id)
  const hasChildren = childItems.length > 0

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG': return <Bug className="w-4 h-4 text-red-500" />
      case 'FEATURE': return <Zap className="w-4 h-4 text-blue-500" />
      case 'EPIC': return <BookOpen className="w-4 h-4 text-purple-500" />
      case 'STORY': return <Target className="w-4 h-4 text-green-500" />
      case 'SUBTASK': return <CheckSquare className="w-4 h-4 text-gray-500" />
      default: return <Square className="w-4 h-4 text-gray-500" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      case 'IN_REVIEW': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isDraggedOver = dragOverIndex === globalIndex
  const isDragged = draggedItemId === item.id
  const indentLevel = level * 20 // 20px per level

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors
          ${isDraggedOver ? 'bg-blue-50 border-t-2 border-blue-300' : ''}
          ${isDragged ? 'opacity-50' : ''}
          cursor-pointer
        `}
        style={{ paddingLeft: `${16 + indentLevel}px` }}
      >
        {/* Drag Handle + Expansion Toggle */}
        <div className="col-span-1 flex items-center gap-1">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>

        {/* Type Icon & Title */}
        <div 
          className="col-span-5 flex items-center gap-2 min-w-0"
          onClick={onClick}
        >
          {getTypeIcon(item.type)}
          <span className="font-medium text-gray-900 truncate">
            {item.title}
          </span>
          {hasChildren && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {childItems.length}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="col-span-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>

        {/* Priority */}
        <div className="col-span-1">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
        </div>

        {/* Worktree Status */}
        <div className="col-span-1">
          {item.worktreeName && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <GitBranch className="w-3 h-3" />
              <span className="truncate max-w-[80px]" title={item.worktreeName}>
                {item.worktreeName.split('/').pop()}
              </span>
            </div>
          )}
        </div>

        {/* Effort */}
        <div className="col-span-1">
          {item.estimatedEffort && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{item.estimatedEffort}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="col-span-2 flex items-center justify-end">
          {item.worktreeStatus === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onCheckProgress()
              }}
              className="text-xs"
            >
              <GitBranch className="w-3 h-3 mr-1" />
              Check Progress
            </Button>
          ) : item.status === 'DONE' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onCheckStatus()
              }}
              className="text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Check Status
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onStartWorking()
              }}
              className="text-xs"
            >
              <PlayCircle className="w-3 h-3 mr-1" />
              Start Working
            </Button>
          )}
        </div>
      </div>

      {/* Render Child Items */}
      {hasChildren && isExpanded && (
        <div>
          {childItems
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
            .map((childItem, childIndex) => {
              const childGlobalIndex = allItems.findIndex(t => t.id === childItem.id)
              const childIsExpanded = !collapsedTasks.has(childItem.id)
              return (
                <TaskTreeItem
                  key={childItem.id}
                  item={childItem}
                  index={childIndex}
                  globalIndex={childGlobalIndex}
                  level={level + 1}
                  isExpanded={childIsExpanded}
                  onToggleExpand={() => onToggleTaskExpansion(childItem.id)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={onClick}
                  onStartWorking={onStartWorking}
                  onCheckProgress={onCheckProgress}
                  onCheckStatus={onCheckStatus}
                  draggedItemId={draggedItemId}
                  dragOverIndex={dragOverIndex}
                  allItems={allItems}
                  collapsedTasks={collapsedTasks}
                  onToggleTaskExpansion={onToggleTaskExpansion}
                />
              )
            })}
        </div>
      )}
    </>
  )
}

export default TaskTreeItem