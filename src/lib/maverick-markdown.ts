/**
 * Maverick Markdown Parser
 * Handles special ::syntax for smart snippets, agents, and interactive elements
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

// Smart snippet types
export type SmartSnippetType = 
  | 'task' 
  | 'agent' 
  | 'team'
  | 'worktree-suggestion'
  | 'task-suggestion'
  | 'smart-section'
  | 'claim-worktree'
  | 'related-task'
  | 'chat-suggestion'
  | 'metric'
  | 'add-agent'
  | 'invite-member'

export interface SmartSnippet {
  id: string
  type: SmartSnippetType
  text: string
  attributes?: Record<string, string>
  action: string
  metadata?: any
  prompt?: string // For smart-section inline agents
  body?: string   // For smart-section content
}

export interface ParsedMarkdown {
  html: string
  snippets: SmartSnippet[]
  rawContent: string
}

// Custom remark plugin to extract our special syntax
function remarkMaverickSnippets() {
  return function transformer(tree: any) {
    const snippets: SmartSnippet[] = []
    
    // Walk the AST and find our special syntax
    function visit(node: any) {
      if (node.type === 'text') {
        // Match ::type[text]{key=value, key2=value2} pattern
        const snippetRegex = /::([\w-]+)\[([^\]]*)\](?:\{([^}]*)\})?/g
        let match
        
        while ((match = snippetRegex.exec(node.value)) !== null) {
          const [fullMatch, type, text, attributesStr] = match
          
          // Parse attributes
          const attributes: Record<string, string> = {}
          if (attributesStr) {
            // Parse key=value pairs, handling quotes
            const attrRegex = /(\w+)=(?:"([^"]*)"|([^,}\s]+))/g
            let attrMatch
            while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
              const [, key, quotedValue, unquotedValue] = attrMatch
              attributes[key] = quotedValue || unquotedValue
            }
          }
          
          const snippet: SmartSnippet = {
            id: `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type as SmartSnippetType,
            text: text.trim(),
            attributes,
            action: getActionForType(type as SmartSnippetType),
            metadata: attributes,
            prompt: attributes.prompt,
            body: attributes.body
          }
          
          snippets.push(snippet)
          
          // Replace with placeholder for rendering
          node.value = node.value.replace(
            fullMatch, 
            `<div class="maverick-snippet" data-snippet-id="${snippet.id}"></div>`
          )
        }
      }
      
      // Recursively visit children
      if (node.children) {
        node.children.forEach(visit)
      }
    }
    
    visit(tree)
    
    // Store snippets on the tree for later extraction
    tree.data = tree.data || {}
    tree.data.maverickSnippets = snippets
  }
}

function getActionForType(type: SmartSnippetType): string {
  switch (type) {
    case 'task': return 'create-task'
    case 'agent': return 'add-agent'
    case 'team': return 'invite-member'
    case 'worktree-suggestion': return 'suggest-worktree'
    case 'task-suggestion': return 'suggest-task'
    case 'smart-section': return 'render-smart-section'
    case 'claim-worktree': return 'claim-worktree'
    case 'related-task': return 'link-task'
    case 'chat-suggestion': return 'apply-suggestion'
    case 'metric': return 'display-metric'
    case 'add-agent': return 'show-agent-templates'
    case 'invite-member': return 'show-invite-form'
    default: return 'unknown'
  }
}

export class MaverickMarkdownParser {
  private processor: any
  
  constructor() {
    this.processor = unified()
      .use(remarkParse)
      .use(remarkMaverickSnippets)
      .use(remarkRehype)
      .use(rehypeStringify)
  }
  
  async parse(markdown: string): Promise<ParsedMarkdown> {
    const result = await this.processor.process(markdown)
    
    // Extract snippets from both processed tree and direct extraction (for HTML snippets)
    const treeSnippets = result.data?.maverickSnippets || []
    const extractedSnippets = this.extractSnippets(markdown)
    
    // Combine and deduplicate snippets
    const allSnippets = [...treeSnippets, ...extractedSnippets]
    const uniqueSnippets = allSnippets.filter((snippet, index, array) => 
      array.findIndex(s => s.id === snippet.id) === index
    )
    
    // Clean HTML by removing snippet divs (they'll be rendered as React components)
    let cleanHtml = String(result)
    uniqueSnippets.forEach(snippet => {
      if (snippet.metadata?.htmlGenerated) {
        const snippetRegex = new RegExp(`<div class="maverick-snippet" data-snippet-id="${snippet.id}"[^>]*><\/div>`, 'g')
        cleanHtml = cleanHtml.replace(snippetRegex, `[SNIPPET:${snippet.id}]`)
      }
    })
    
    return {
      html: cleanHtml,
      snippets: uniqueSnippets,
      rawContent: markdown
    }
  }
  
  // Helper to extract just snippets without full processing
  extractSnippets(markdown: string): SmartSnippet[] {
    const snippets: SmartSnippet[] = []
    
    // Extract ::syntax snippets
    const snippetRegex = /::([\w-]+)\[([^\]]*)\](?:\{([^}]*)\})?/g
    let match
    
    while ((match = snippetRegex.exec(markdown)) !== null) {
      const [, type, text, attributesStr] = match
      
      const attributes: Record<string, string> = {}
      if (attributesStr) {
        const attrRegex = /(\w+)=(?:"([^"]*)"|([^,}\s]+))/g
        let attrMatch
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
          const [, key, quotedValue, unquotedValue] = attrMatch
          attributes[key] = quotedValue || unquotedValue
        }
      }
      
      snippets.push({
        id: `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type as SmartSnippetType,
        text: text.trim(),
        attributes,
        action: getActionForType(type as SmartSnippetType),
        metadata: attributes,
        prompt: attributes.prompt,
        body: attributes.body
      })
    }
    
    // Extract HTML div snippets from AI responses
    const htmlSnippetRegex = /<div class="maverick-snippet" data-snippet-id="([^"]+)"[^>]*><\/div>/g
    let htmlMatch
    
    while ((htmlMatch = htmlSnippetRegex.exec(markdown)) !== null) {
      const [, snippetId] = htmlMatch
      
      // Parse snippet ID to extract action info
      const action = this.getActionFromSnippetId(snippetId)
      const text = this.getTextFromAction(action)
      
      snippets.push({
        id: snippetId,
        type: 'task', // Default to task for HTML snippets
        text,
        attributes: {},
        action,
        metadata: { htmlGenerated: true }
      })
    }
    
    return snippets
  }
  
  private getActionFromSnippetId(snippetId: string): string {
    // Parse the snippet ID to determine action
    if (snippetId.includes('task') || snippetId.includes('create')) return 'create-task'
    if (snippetId.includes('agent')) return 'add-agent'
    if (snippetId.includes('team') || snippetId.includes('invite')) return 'invite-member'
    if (snippetId.includes('plan')) return 'plan-feature'
    return 'create-task' // Default action
  }
  
  private getTextFromAction(action: string): string {
    switch (action) {
      case 'create-task': return 'Create Task'
      case 'add-agent': return 'Add Agent'
      case 'invite-member': return 'Invite Member'
      case 'plan-feature': return 'Plan Feature'
      default: return 'Take Action'
    }
  }
}

// Export singleton instance
export const maverickParser = new MaverickMarkdownParser()

// Utility functions for common patterns
export function createTaskSnippet(title: string, options?: { 
  priority?: string
  assignee?: string
  worktree?: string
}): string {
  const attrs = Object.entries(options || {})
    .map(([k, v]) => `${k}="${v}"`)
    .join(', ')
  
  return `::task[${title}]${attrs ? `{${attrs}}` : ''}`
}

export function createAgentSnippet(name: string, options?: {
  status?: string
  tasks?: number
  efficiency?: number
  current?: string
}): string {
  const attrs = Object.entries(options || {})
    .map(([k, v]) => `${k}="${v}"`)
    .join(', ')
    
  return `::agent[${name}]${attrs ? `{${attrs}}` : ''}`
}

export function createSmartSection(title: string, prompt: string, body: string): string {
  return `::smart-section[${title}]{prompt="${prompt}", body="${body}"}`
}