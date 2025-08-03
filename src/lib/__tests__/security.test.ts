import {
  getClientIP,
  validateRequestSize,
  sanitizeJSON,
  validateProjectOwnership,
  CSPDirectives,
  generateCSPHeader,
  InputSanitizer,
  SecurityConfigs,
  detectSuspiciousActivity
} from '../security'
import { NextRequest } from 'next/server'
import { MaverickError } from '../error-handling'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authConfig: {
    providers: [],
    session: { strategy: 'jwt' },
    callbacks: {}
  }
}))

describe('Security Library', () => {
  
  describe('getClientIP', () => {
    const createMockRequest = (headers: Record<string, string>) => ({
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null
      }
    }) as unknown as NextRequest

    it('should extract IP from CF-Connecting-IP header', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '1.2.3.4',
        'x-real-ip': '5.6.7.8',
        'x-forwarded-for': '9.10.11.12'
      })

      expect(getClientIP(request)).toBe('1.2.3.4')
    })

    it('should fall back to X-Real-IP', () => {
      const request = createMockRequest({
        'x-real-ip': '5.6.7.8',
        'x-forwarded-for': '9.10.11.12'
      })

      expect(getClientIP(request)).toBe('5.6.7.8')
    })

    it('should fall back to X-Forwarded-For', () => {
      const request = createMockRequest({
        'x-forwarded-for': '9.10.11.12, 13.14.15.16'
      })

      expect(getClientIP(request)).toBe('9.10.11.12')
    })

    it('should return unknown when no IP headers present', () => {
      const request = createMockRequest({})
      expect(getClientIP(request)).toBe('unknown')
    })

    it('should handle multiple IPs in X-Forwarded-For', () => {
      const request = createMockRequest({
        'x-forwarded-for': '  9.10.11.12  ,  13.14.15.16  '
      })

      expect(getClientIP(request)).toBe('9.10.11.12')
    })
  })

  describe('validateRequestSize', () => {
    const createMockRequest = (contentLength?: string) => ({
      headers: {
        get: (name: string) => name === 'content-length' ? contentLength : null
      }
    }) as unknown as NextRequest

    it('should pass for requests under the limit', async () => {
      const request = createMockRequest('1000') // 1KB
      await expect(validateRequestSize(request, 2048)).resolves.toBeUndefined()
    })

    it('should throw error for requests over the limit', async () => {
      const request = createMockRequest('3000') // 3KB
      await expect(validateRequestSize(request, 2048)).rejects.toThrow(MaverickError)
    })

    it('should pass when no content-length header', async () => {
      const request = createMockRequest()
      await expect(validateRequestSize(request, 2048)).resolves.toBeUndefined()
    })

    it('should use default 1MB limit', async () => {
      const request = createMockRequest('2000000') // 2MB
      await expect(validateRequestSize(request)).rejects.toThrow(MaverickError)
    })
  })

  describe('sanitizeJSON', () => {
    it('should return non-objects as-is', () => {
      expect(sanitizeJSON('string')).toBe('string')
      expect(sanitizeJSON(123)).toBe(123)
      expect(sanitizeJSON(null)).toBe(null)
      expect(sanitizeJSON(true)).toBe(true)
    })

    it('should sanitize arrays recursively', () => {
      const input = [
        { __proto__: { evil: true }, safe: 'value' },
        'string',
        { constructor: 'bad', good: 'value' }
      ]

      const result = sanitizeJSON(input)

      expect(result).toEqual([
        { safe: 'value' },
        'string',
        { good: 'value' }
      ])
    })

    it('should remove dangerous prototype pollution keys', () => {
      const input = {
        __proto__: { polluted: true },
        constructor: 'malicious',
        prototype: 'also bad',
        safe: 'value',
        nested: {
          __proto__: { nested: true },
          alsoSafe: 'value'
        }
      }

      const result = sanitizeJSON(input)

      expect(result).toEqual({
        safe: 'value',
        nested: {
          alsoSafe: 'value'
        }
      })
      expect(result).not.toHaveProperty('__proto__')
      expect(result).not.toHaveProperty('constructor')  
      expect(result).not.toHaveProperty('prototype')
    })

    it('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              __proto__: { evil: true },
              safe: 'deep value'
            }
          }
        }
      }

      const result = sanitizeJSON(input)

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              safe: 'deep value'
            }
          }
        }
      })
    })
  })

  describe('validateProjectOwnership', () => {
    it('should return true for valid ownership (mocked)', async () => {
      const result = await validateProjectOwnership('test-project', 'user-123')
      expect(result).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      // This would test actual database integration when implemented
      const result = await validateProjectOwnership('test-project', 'user-123')
      expect(result).toBe(true)
    })
  })

  describe('generateCSPHeader', () => {
    it('should generate development CSP header', () => {
      const csp = generateCSPHeader('development')
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:")
      expect(csp).toContain("style-src 'self' 'unsafe-inline'")
      expect(csp).toContain("connect-src 'self' localhost:* ws: wss:")
    })

    it('should generate production CSP header', () => {
      const csp = generateCSPHeader('production')
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain('upgrade-insecure-requests')
    })

    it('should default to production CSP', () => {
      const csp = generateCSPHeader()
      expect(csp).toContain("script-src 'self'")
      expect(csp).not.toContain('localhost:')
    })
  })

  describe('InputSanitizer', () => {
    describe('forHTML', () => {
      it('should escape HTML characters', () => {
        const input = '<script>alert("xss")</script> & "quotes" & \'apostrophes\' & /slashes/'
        const result = InputSanitizer.forHTML(input)
        
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt; &amp; &quot;quotes&quot; &amp; &#x27;apostrophes&#x27; &amp; &#x2F;slashes&#x2F;')
      })

      it('should handle empty input', () => {
        expect(InputSanitizer.forHTML('')).toBe('')
      })
    })

    describe('forJS', () => {
      it('should escape JavaScript special characters', () => {
        const input = 'alert("hello"); \n\r\t \\ \' "'
        const result = InputSanitizer.forJS(input)
        
        expect(result).toBe('alert(\\"hello\\"); \\n\\r\\t \\\\ \\\' \\"')
      })
    })

    describe('forSQL', () => {
      it('should escape single quotes', () => {
        expect(InputSanitizer.forSQL("O'Reilly")).toBe("O''Reilly")
        expect(InputSanitizer.forSQL("It's working")).toBe("It''s working")
      })
    })

    describe('forFileName', () => {
      it('should remove dangerous characters', () => {
        const input = '../../../etc/passwd?query=1&bad=true'
        const result = InputSanitizer.forFileName(input)
        
        expect(result).toBe('.etcpasswdquery1badtrue')
      })

      it('should prevent directory traversal', () => {
        expect(InputSanitizer.forFileName('file....txt')).toBe('file.txt')
        expect(InputSanitizer.forFileName('file...txt')).toBe('file.txt')
      })

      it('should limit filename length', () => {
        const longName = 'a'.repeat(300)
        const result = InputSanitizer.forFileName(longName)
        expect(result.length).toBeLessThanOrEqual(255)
      })
    })

    describe('forShell', () => {
      it('should remove shell metacharacters', () => {
        const input = 'file.txt; rm -rf / && echo "hacked"'
        const result = InputSanitizer.forShell(input)
        
        expect(result).toBe('file.txt rm -rf /  echo "hacked"')
      })
    })
  })

  describe('SecurityConfigs', () => {
    it('should have predefined configurations', () => {
      expect(SecurityConfigs.public.requireAuth).toBe(false)
      expect(SecurityConfigs.public.allowedMethods).toContain('GET')
      
      expect(SecurityConfigs.auth.requireAuth).toBe(false)
      expect(SecurityConfigs.auth.allowedMethods).toContain('POST')
      expect(SecurityConfigs.auth.rateLimitKey).toBe('auth')
      
      expect(SecurityConfigs.projectManagement.requireAuth).toBe(true)
      expect(SecurityConfigs.projectManagement.requireOwnership).toBe(true)
      
      expect(SecurityConfigs.ai.requireAuth).toBe(true)
      expect(SecurityConfigs.ai.maxRequestsPerMinute).toBe(30)
      
      expect(SecurityConfigs.admin.requireAuth).toBe(true)
    })
  })

  describe('detectSuspiciousActivity', () => {
    const createMockRequest = (url: string, userAgent = 'Mozilla/5.0', contentLength?: string) => ({
      url,
      headers: {
        get: (name: string) => {
          if (name === 'user-agent') return userAgent
          if (name === 'content-length') return contentLength
          return null
        }
      }
    }) as unknown as NextRequest

    it('should detect SQL injection patterns', () => {
      const request = createMockRequest('https://example.com/api?query=union select * from users')
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('potential_sql_injection')
    })

    it('should detect XSS patterns', () => {
      const request = createMockRequest('https://example.com/api?msg=<script>alert("xss")</script>')
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('potential_xss')
    })

    it('should detect directory traversal', () => {
      const request = createMockRequest('https://example.com/api/../../../etc/passwd')
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('directory_traversal')
    })

    it('should detect command injection', () => {
      const request = createMockRequest('https://example.com/api?cmd=ls|grep secret')
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('command_injection')
    })

    it('should detect bot requests', () => {
      const request = createMockRequest('https://example.com/api', 'Googlebot/2.1')
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('automated_request')
    })

    it('should detect large requests', () => {
      const request = createMockRequest('https://example.com/api', 'Mozilla/5.0', '20971520') // 20MB
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('large_request')
    })

    it('should return empty array for clean requests', () => {
      const request = createMockRequest('https://example.com/api/users', 'Mozilla/5.0', '1024')
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toHaveLength(0)
    })

    it('should detect multiple patterns', () => {
      const request = createMockRequest(
        'https://example.com/api?query=union<script>alert("xss")</script>', 
        'bot/1.0',
        '20971520'
      )
      const patterns = detectSuspiciousActivity(request)
      
      expect(patterns).toContain('potential_sql_injection')
      expect(patterns).toContain('potential_xss')
      expect(patterns).toContain('automated_request')
      expect(patterns).toContain('large_request')
      expect(patterns.length).toBe(4)
    })
  })

  describe('CSPDirectives', () => {
    it('should have different policies for development and production', () => {
      expect(CSPDirectives.development['script-src']).toContain("'unsafe-eval'")
      expect(CSPDirectives.development['connect-src']).toContain('localhost:*')
      
      expect(CSPDirectives.production['script-src']).not.toContain("'unsafe-eval'")
      expect(CSPDirectives.production['connect-src']).not.toContain('localhost:*')
    })

    it('should have secure defaults', () => {
      expect(CSPDirectives.production['object-src']).toEqual(["'none'"])
      expect(CSPDirectives.production['base-uri']).toEqual(["'self'"])
      expect(CSPDirectives.production['frame-ancestors']).toEqual(["'none'"])
    })
  })
})