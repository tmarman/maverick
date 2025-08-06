'use client'

import React from 'react'
import { parseTextWithMentions, defaultProjectUsers, UserProfile } from '@/lib/username-mentions'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MentionTextProps {
  text: string
  className?: string
  availableUsers?: UserProfile[]
  onMentionClick?: (username: string) => void
  mentionClassName?: string
}

export function MentionText({ 
  text, 
  className,
  availableUsers = defaultProjectUsers,
  onMentionClick,
  mentionClassName
}: MentionTextProps) {
  const segments = parseTextWithMentions(text, availableUsers.map(u => u.username))
  
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention') {
          const user = availableUsers.find(u => u.username === segment.username)
          
          return (
            <Badge
              key={index}
              variant={segment.isValid ? "secondary" : "outline"}
              className={cn(
                "mx-1 cursor-pointer transition-colors",
                segment.isValid 
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                mentionClassName
              )}
              onClick={() => {
                if (segment.isValid && segment.username && onMentionClick) {
                  onMentionClick(segment.username)
                }
              }}
              title={user ? `${user.display} (${user.role})` : `Unknown user: ${segment.username}`}
            >
              {segment.content}
            </Badge>
          )
        }
        
        return <span key={index}>{segment.content}</span>
      })}
    </span>
  )
}

// Component for displaying user avatar with username
export function UserMentionChip({ 
  username, 
  availableUsers = defaultProjectUsers,
  size = 'sm',
  showRole = false,
  className
}: {
  username: string
  availableUsers?: UserProfile[]
  size?: 'xs' | 'sm' | 'md'
  showRole?: boolean
  className?: string
}) {
  const user = availableUsers.find(u => u.username === username)
  
  if (!user) {
    return (
      <Badge variant="outline" className={cn("text-gray-500", className)}>
        @{username}
      </Badge>
    )
  }
  
  const sizeClasses = {
    xs: "h-5 w-5 text-xs",
    sm: "h-6 w-6 text-sm", 
    md: "h-8 w-8 text-base"
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium",
        sizeClasses[size]
      )}>
        {user.display.charAt(0).toUpperCase()}
      </div>
      <span className="font-medium">
        @{user.username}
        {showRole && user.role && (
          <Badge variant="outline" className="ml-2 text-xs">
            {user.role}
          </Badge>
        )}
      </span>
    </div>
  )
}

// Input component with mention autocomplete - using UI Input component

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  availableUsers = defaultProjectUsers,
  showSuggestions = true,
  disabled
}: {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
  availableUsers?: UserProfile[]
  showSuggestions?: boolean
  disabled?: boolean
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<UserProfile[]>([])
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const updateSuggestions = React.useCallback((text: string, position: number) => {
    if (!showSuggestions) return
    
    const beforeCursor = text.slice(0, position)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex === -1) {
      setShowDropdown(false)
      return
    }
    
    const afterAt = beforeCursor.slice(lastAtIndex + 1)
    const spaceIndex = afterAt.indexOf(' ')
    
    if (spaceIndex !== -1) {
      setShowDropdown(false)
      return
    }
    
    const query = afterAt.toLowerCase()
    const filtered = availableUsers
      .filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.display.toLowerCase().includes(query)
      )
      .slice(0, 5)
    
    setSuggestions(filtered)
    setShowDropdown(filtered.length > 0)
  }, [availableUsers, showSuggestions])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const position = e.target.selectionStart || 0
    
    onChange(newValue)
    setCursorPosition(position)
    updateSuggestions(newValue, position)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e)
    }
    
    // Handle suggestion selection
    if (showDropdown && (e.key === 'Tab' || e.key === 'Enter')) {
      if (suggestions.length > 0) {
        e.preventDefault()
        selectSuggestion(suggestions[0])
      }
    }
    
    if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }
  
  const selectSuggestion = (user: UserProfile) => {
    const beforeCursor = value.slice(0, cursorPosition)
    const afterCursor = value.slice(cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const newValue = 
        value.slice(0, lastAtIndex) + 
        `@${user.username} ` + 
        afterCursor
      
      onChange(newValue)
      setShowDropdown(false)
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = lastAtIndex + user.username.length + 2
          inputRef.current.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    }
  }
  
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={(e) => {
          const target = e.target as HTMLInputElement
          setCursorPosition(target.selectionStart || 0)
          updateSuggestions(value, target.selectionStart || 0)
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((user) => (
            <div
              key={user.username}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => selectSuggestion(user)}
            >
              <UserMentionChip 
                username={user.username} 
                availableUsers={[user]}
                size="xs"
              />
              {user.role && (
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}