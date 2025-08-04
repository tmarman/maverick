import { prisma } from './prisma'
import { withRetry } from './database-health'

export interface ClaudeConnectionData {
  claudeUserId?: string
  email?: string
  subscriptionType?: 'free' | 'pro' | 'max'
  apiKey: string
  scopes?: string[]
}

export class ClaudeService {
  /**
   * Store Claude API key for a user
   */
  static async storeConnection(userId: string, data: ClaudeConnectionData) {
    return withRetry(() => prisma.claudeConnection.upsert({
      where: { userId },
      update: {
        claudeUserId: data.claudeUserId,
        email: data.email,
        subscriptionType: data.subscriptionType,
        accessToken: data.apiKey, // Store API key as access token
        scopes: data.scopes ? JSON.stringify(data.scopes) : null,
        updatedAt: new Date()
      },
      create: {
        userId,
        claudeUserId: data.claudeUserId,
        email: data.email,
        subscriptionType: data.subscriptionType,
        accessToken: data.apiKey,
        scopes: data.scopes ? JSON.stringify(data.scopes) : null,
      }
    }))
  }

  /**
   * Get Claude connection for a user
   */
  static async getConnection(userId: string) {
    return withRetry(() => prisma.claudeConnection.findUnique({
      where: { userId }
    }))
  }

  /**
   * Remove Claude connection for a user
   */
  static async removeConnection(userId: string) {
    return withRetry(() => prisma.claudeConnection.delete({
      where: { userId }
    }))
  }

  /**
   * Test Claude API key validity
   */
  static async testApiKey(apiKey: string): Promise<{ valid: boolean, error?: string, userInfo?: any }> {
    try {
      // Test the API key by making a simple request to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Test'
            }
          ]
        })
      })

      if (response.ok) {
        return { valid: true }
      } else {
        const error = await response.text()
        return { valid: false, error: `API test failed: ${error}` }
      }
    } catch (error) {
      return { 
        valid: false, 
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Get user's Claude API key (for internal use only)
   */
  static async getApiKey(userId: string): Promise<string | null> {
    const connection = await this.getConnection(userId)
    return connection?.accessToken || null
  }

  /**
   * Check if user has Claude connection
   */
  static async hasConnection(userId: string): Promise<boolean> {
    const connection = await this.getConnection(userId)
    return !!connection
  }
}

// Export default instance
export const claudeService = ClaudeService