// GitHub-style username mentions system
// Handles @username parsing, validation, and rendering

interface UserMention {
  username: string
  display: string
  position: number
  length: number
}

interface UserProfile {
  username: string
  display: string
  email?: string
  avatar?: string
  role?: 'owner' | 'admin' | 'member' | 'viewer'
  isActive?: boolean
}

// Extract @username mentions from text
export function extractMentions(text: string): UserMention[] {
  const mentions: UserMention[] = []
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      display: `@${match[1]}`,
      position: match.index,
      length: match[0].length
    })
  }

  return mentions
}

// Validate username format (GitHub-style rules)
export function isValidUsername(username: string): boolean {
  // GitHub username rules:
  // - May only contain alphanumeric characters or single hyphens
  // - Cannot begin or end with a hyphen
  // - Maximum is 39 characters
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![a-zA-Z0-9]*-))*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/
  return regex.test(username) && username.length <= 39
}

// Parse text and return segments with mention information
export function parseTextWithMentions(text: string, validUsers: string[] = []): Array<{
  type: 'text' | 'mention'
  content: string
  username?: string
  isValid?: boolean
}> {
  const mentions = extractMentions(text)
  const segments: Array<{
    type: 'text' | 'mention'
    content: string
    username?: string
    isValid?: boolean
  }> = []

  let lastIndex = 0

  mentions.forEach(mention => {
    // Add text before mention
    if (mention.position > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, mention.position)
      })
    }

    // Add mention
    segments.push({
      type: 'mention',
      content: mention.display,
      username: mention.username,
      isValid: validUsers.length === 0 || validUsers.includes(mention.username)
    })

    lastIndex = mention.position + mention.length
  })

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  return segments
}

// Get suggested usernames based on input
export function getSuggestedUsernames(input: string, availableUsers: UserProfile[]): UserProfile[] {
  if (!input.startsWith('@')) return []
  
  const query = input.slice(1).toLowerCase()
  if (query.length === 0) return availableUsers.slice(0, 5)

  return availableUsers
    .filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.display.toLowerCase().includes(query)
    )
    .slice(0, 8)
}

// Create mention-aware input handler
export function createMentionInputHandler(
  availableUsers: UserProfile[],
  onMentionSelect?: (username: string) => void
) {
  return {
    handleKeyDown: (e: KeyboardEvent, currentValue: string, cursorPosition: number) => {
      // Handle @ key to start mention
      if (e.key === '@') {
        // Could trigger mention dropdown here
        return true
      }
      
      // Handle tab/enter for mention completion
      if ((e.key === 'Tab' || e.key === 'Enter') && currentValue.includes('@')) {
        const mentions = extractMentions(currentValue)
        const currentMention = mentions.find(m => 
          cursorPosition >= m.position && cursorPosition <= m.position + m.length
        )
        
        if (currentMention && onMentionSelect) {
          onMentionSelect(currentMention.username)
          e.preventDefault()
          return false
        }
      }
      
      return true
    },
    
    getSuggestions: (value: string, cursorPosition: number) => {
      // Find if cursor is in a mention
      const beforeCursor = value.slice(0, cursorPosition)
      const lastAtIndex = beforeCursor.lastIndexOf('@')
      
      if (lastAtIndex === -1) return []
      
      const afterAt = beforeCursor.slice(lastAtIndex)
      const spaceIndex = afterAt.indexOf(' ')
      
      if (spaceIndex !== -1) return []
      
      return getSuggestedUsernames(afterAt, availableUsers)
    }
  }
}

// Format mentions for storage (convert to standardized format)
export function formatMentionsForStorage(text: string, validUsers: UserProfile[]): string {
  const userMap = new Map(validUsers.map(u => [u.username.toLowerCase(), u]))
  
  return text.replace(/@([a-zA-Z0-9_-]+)/g, (match, username) => {
    const user = userMap.get(username.toLowerCase())
    if (user) {
      return `@${user.username}` // Ensure consistent casing
    }
    return match // Keep original if user not found
  })
}

// Get all mentioned users from text
export function getMentionedUsers(text: string, availableUsers: UserProfile[]): UserProfile[] {
  const mentions = extractMentions(text)
  const userMap = new Map(availableUsers.map(u => [u.username.toLowerCase(), u]))
  
  const mentionedUsers: UserProfile[] = []
  const seen = new Set<string>()
  
  mentions.forEach(mention => {
    const user = userMap.get(mention.username.toLowerCase())
    if (user && !seen.has(user.username)) {
      mentionedUsers.push(user)
      seen.add(user.username)
    }
  })
  
  return mentionedUsers
}

// Default project users (can be extended from database)
export const defaultProjectUsers: UserProfile[] = [
  {
    username: 'tim',
    display: 'Tim',
    role: 'owner',
    isActive: true
  },
  {
    username: 'jack',
    display: 'Jack',
    role: 'admin',
    isActive: true
  }
]

// Generate mention notification content
export function generateMentionNotification(
  mentioningUser: string,
  workItemTitle: string,
  context: 'chat' | 'task' | 'comment'
): string {
  const contextMap = {
    chat: 'mentioned you in a chat message',
    task: 'mentioned you in a task',
    comment: 'mentioned you in a comment'
  }
  
  return `${mentioningUser} ${contextMap[context]} about "${workItemTitle}"`
}