import {
  validateField,
  validateForm,
  ValidationRules,
  sanitizeInput,
  sanitizeMarkdown,
  validateFile,
  clientRateLimiter,
  Patterns,
  ErrorMessages
} from '../validation'

describe('Validation Library', () => {
  
  describe('validateField', () => {
    it('should validate required fields', () => {
      const result = validateField('', { required: true }, 'test field')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('test field is required')
    })

    it('should pass validation for non-required empty fields', () => {
      const result = validateField('', { required: false }, 'test field')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate minimum length', () => {
      const result = validateField('ab', { minLength: 3 }, 'test field')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('test field must be at least 3 characters')
    })

    it('should validate maximum length', () => {
      const result = validateField('abcdef', { maxLength: 5 }, 'test field')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('test field must be no more than 5 characters')
    })

    it('should validate patterns', () => {
      const result = validateField('test123!', { pattern: /^[a-z0-9-]+$/ }, 'test field')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('test field format is invalid')
    })

    it('should run custom validation', () => {
      const customRule = {
        custom: (value: string) => value.includes('bad') ? 'Contains forbidden word' : null
      }
      const result = validateField('this is bad', customRule, 'test field')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Contains forbidden word')
    })

    it('should pass valid input', () => {
      const result = validateField('valid-test-123', {
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: /^[a-z0-9-]+$/
      }, 'test field')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('ValidationRules', () => {
    it('should validate project names correctly', () => {
      // Valid project names
      expect(validateField('my-project', ValidationRules.projectName, 'project name').isValid).toBe(true)
      expect(validateField('project123', ValidationRules.projectName, 'project name').isValid).toBe(true)
      
      // Invalid project names
      expect(validateField('My-Project', ValidationRules.projectName, 'project name').isValid).toBe(false)
      expect(validateField('-project', ValidationRules.projectName, 'project name').isValid).toBe(false)
      expect(validateField('project-', ValidationRules.projectName, 'project name').isValid).toBe(false)
      expect(validateField('project--name', ValidationRules.projectName, 'project name').isValid).toBe(false)
      expect(validateField('a', ValidationRules.projectName, 'project name').isValid).toBe(false)
    })

    it('should validate email addresses correctly', () => {
      expect(validateField('test@example.com', ValidationRules.email, 'email').isValid).toBe(true)
      expect(validateField('user+tag@domain.co.uk', ValidationRules.email, 'email').isValid).toBe(true)
      
      expect(validateField('invalid-email', ValidationRules.email, 'email').isValid).toBe(false)
      expect(validateField('test@', ValidationRules.email, 'email').isValid).toBe(false)
      expect(validateField('@example.com', ValidationRules.email, 'email').isValid).toBe(false)
    })

    it('should validate passwords correctly', () => {
      expect(validateField('Password123', ValidationRules.password, 'password').isValid).toBe(true)
      
      expect(validateField('password', ValidationRules.password, 'password').isValid).toBe(false) // no uppercase
      expect(validateField('PASSWORD', ValidationRules.password, 'password').isValid).toBe(false) // no lowercase
      expect(validateField('Password', ValidationRules.password, 'password').isValid).toBe(false) // no number
      expect(validateField('Pass1', ValidationRules.password, 'password').isValid).toBe(false) // too short
    })

    it('should validate work item titles correctly', () => {
      expect(validateField('Valid task title', ValidationRules.workItemTitle, 'title').isValid).toBe(true)
      
      expect(validateField('  Leading spaces', ValidationRules.workItemTitle, 'title').isValid).toBe(false)
      expect(validateField('Trailing spaces  ', ValidationRules.workItemTitle, 'title').isValid).toBe(false)
      expect(validateField('ab', ValidationRules.workItemTitle, 'title').isValid).toBe(false)
    })

    it('should validate UUIDs correctly', () => {
      expect(validateField('123e4567-e89b-12d3-a456-426614174000', ValidationRules.uuid, 'id').isValid).toBe(true)
      
      expect(validateField('invalid-uuid', ValidationRules.uuid, 'id').isValid).toBe(false)
      expect(validateField('123e4567-e89b-12d3-a456', ValidationRules.uuid, 'id').isValid).toBe(false)
    })
  })

  describe('validateForm', () => {
    it('should validate multiple fields at once', () => {
      const data = {
        projectName: 'my-project',
        email: 'test@example.com',
        title: 'Valid title'
      }
      
      const rules = {
        projectName: ValidationRules.projectName,
        email: ValidationRules.email,
        title: ValidationRules.workItemTitle
      }
      
      const result = validateForm(data, rules)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should collect all errors from multiple fields', () => {
      const data = {
        projectName: 'Invalid-Project-Name',
        email: 'invalid-email',
        title: 'ab'
      }
      
      const rules = {
        projectName: ValidationRules.projectName,
        email: ValidationRules.email,
        title: ValidationRules.workItemTitle
      }
      
      const result = validateForm(data, rules)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(2)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>normal text')).toBe('scriptalert("xss")/scriptnormal text')
      expect(sanitizeInput('Hello <b>world</b>')).toBe('Hello bworld/b')
    })

    it('should remove javascript: URLs', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")')
      expect(sanitizeInput('onload=malicious()')).toBe('malicious()')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world')
    })

    it('should limit length', () => {
      const longString = 'a'.repeat(20000)
      const result = sanitizeInput(longString)
      expect(result.length).toBeLessThanOrEqual(10000)
    })

    it('should handle non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
      expect(sanitizeInput(123 as any)).toBe('')
    })
  })

  describe('sanitizeMarkdown', () => {
    it('should allow basic markdown but remove scripts', () => {
      const input = '# Title\n**bold** text\n<script>alert("xss")</script>'
      const result = sanitizeMarkdown(input)
      expect(result).toContain('# Title')
      expect(result).toContain('**bold** text')
      expect(result).not.toContain('<script>')
    })

    it('should handle larger content for markdown', () => {
      const longMarkdown = '# '.repeat(30000)
      const result = sanitizeMarkdown(longMarkdown)
      expect(result.length).toBeLessThanOrEqual(50000)
    })
  })

  describe('validateFile', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
      const file = new File([''], name, { type })
      Object.defineProperty(file, 'size', { value: size })
      return file
    }

    it('should validate file size', () => {
      const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg') // 10MB
      const result = validateFile(largeFile, { maxSize: 5 * 1024 * 1024 }) // 5MB limit
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File size must be less than 5MB')
    })

    it('should validate file types', () => {
      const txtFile = createMockFile('document.txt', 1024, 'text/plain')
      const result = validateFile(txtFile, { allowedTypes: ['image/jpeg', 'image/png'] })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File type text/plain is not allowed')
    })

    it('should validate file extensions', () => {
      const file = createMockFile('document.doc', 1024, 'application/msword')
      const result = validateFile(file, { allowedExtensions: ['jpg', 'png', 'pdf'] })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File extension must be one of: jpg, png, pdf')
    })

    it('should warn about suspicious extensions', () => {
      const exeFile = createMockFile('program.exe', 1024, 'application/x-msdownload')
      const result = validateFile(exeFile)
      
      expect(result.isValid).toBe(true) // No rules broken
      expect(result.warnings).toContain('This file type may contain executable code')
    })

    it('should pass valid files', () => {
      const imageFile = createMockFile('photo.jpg', 1024, 'image/jpeg')
      const result = validateFile(imageFile, {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['jpg', 'jpeg', 'png']
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('clientRateLimiter', () => {
    beforeEach(() => {
      // Reset rate limiter between tests
      clientRateLimiter.reset('test-key')
    })

    it('should allow requests within limit', () => {
      expect(clientRateLimiter.check('test-key', 5, 60000)).toBe(true)
      expect(clientRateLimiter.check('test-key', 5, 60000)).toBe(true)
      expect(clientRateLimiter.check('test-key', 5, 60000)).toBe(true)
    })

    it('should block requests exceeding limit', () => {
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        expect(clientRateLimiter.check('test-key', 5, 60000)).toBe(true)
      }
      
      // Next request should be blocked
      expect(clientRateLimiter.check('test-key', 5, 60000)).toBe(false)
    })

    it('should reset after time window', () => {
      // Fill the rate limit
      for (let i = 0; i < 3; i++) {
        clientRateLimiter.check('test-key', 3, 100) // 100ms window
      }
      
      expect(clientRateLimiter.check('test-key', 3, 100)).toBe(false)
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          expect(clientRateLimiter.check('test-key', 3, 100)).toBe(true)
          resolve(undefined)
        }, 150)
      })
    })

    it('should handle different keys independently', () => {
      expect(clientRateLimiter.check('key1', 2, 60000)).toBe(true)
      expect(clientRateLimiter.check('key2', 2, 60000)).toBe(true)
      expect(clientRateLimiter.check('key1', 2, 60000)).toBe(true)
      expect(clientRateLimiter.check('key2', 2, 60000)).toBe(true)
      
      // Both keys should now be at limit
      expect(clientRateLimiter.check('key1', 2, 60000)).toBe(false)
      expect(clientRateLimiter.check('key2', 2, 60000)).toBe(false)
    })
  })

  describe('Patterns', () => {
    it('should match project names correctly', () => {
      expect(Patterns.projectName.test('my-project')).toBe(true)
      expect(Patterns.projectName.test('project123')).toBe(true)
      expect(Patterns.projectName.test('My-Project')).toBe(false)
      expect(Patterns.projectName.test('project_name')).toBe(false)
    })

    it('should match usernames correctly', () => {
      expect(Patterns.username.test('user123')).toBe(true)
      expect(Patterns.username.test('user_name')).toBe(true)
      expect(Patterns.username.test('user-name')).toBe(true)
      expect(Patterns.username.test('ab')).toBe(false) // too short
      expect(Patterns.username.test('this_username_is_too_long')).toBe(false) // too long
    })

    it('should match semantic versions correctly', () => {
      expect(Patterns.semver.test('1.0.0')).toBe(true)
      expect(Patterns.semver.test('10.20.30')).toBe(true)
      expect(Patterns.semver.test('1.0')).toBe(false)
      expect(Patterns.semver.test('v1.0.0')).toBe(false)
    })

    it('should match hex colors correctly', () => {
      expect(Patterns.hexColor.test('#ffffff')).toBe(true)
      expect(Patterns.hexColor.test('#000000')).toBe(true)
      expect(Patterns.hexColor.test('#ABC123')).toBe(true)
      expect(Patterns.hexColor.test('ffffff')).toBe(false) // missing #
      expect(Patterns.hexColor.test('#fff')).toBe(false) // too short
    })

    it('should match IP addresses correctly', () => {
      expect(Patterns.ipAddress.test('192.168.1.1')).toBe(true)
      expect(Patterns.ipAddress.test('10.0.0.1')).toBe(true)
      expect(Patterns.ipAddress.test('255.255.255.255')).toBe(true)
      expect(Patterns.ipAddress.test('256.1.1.1')).toBe(false) // out of range
      expect(Patterns.ipAddress.test('192.168.1')).toBe(false) // incomplete
    })
  })

  describe('ErrorMessages', () => {
    it('should generate appropriate error messages', () => {
      expect(ErrorMessages.required('name')).toBe('name is required')
      expect(ErrorMessages.minLength('password', 8)).toBe('password must be at least 8 characters')
      expect(ErrorMessages.maxLength('title', 100)).toBe('title must be no more than 100 characters')
      expect(ErrorMessages.fileSize(5)).toBe('File size must be less than 5MB')
    })
  })
})