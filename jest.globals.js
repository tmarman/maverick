// Global setup for Jest tests
// This file runs before all tests and sets up global mocks and polyfills

// Mock Next.js Request/Response for testing
global.Request = class MockRequest {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
}

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map()
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}

// Mock fetch globally
global.fetch = jest.fn()

// Mock crypto for node environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '12345678-1234-1234-1234-123456789012'
  }
})

// Mock DOM methods used in components
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true
})