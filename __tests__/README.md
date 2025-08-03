# Maverick Testing Guide

This document provides comprehensive information about the testing setup and best practices for the Maverick platform.

## Testing Stack

- **Test Runner**: Jest 29.7.0
- **React Testing**: React Testing Library 14.1.2
- **Test Environment**: jsdom for browser simulation
- **Coverage**: Built-in Jest coverage with v8 provider
- **Mocking**: Jest mocking capabilities with custom utilities

## Test Structure

```
__tests__/                      # Integration and e2e tests
src/
  ├── lib/__tests__/            # Unit tests for utilities
  ├── components/__tests__/     # Component tests
  └── app/api/__tests__/        # API route tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Patterns

```bash
# Run specific test file
npm test validation.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="validation"

# Run tests for specific component
npm test VibeChat
```

## Test Categories

### 1. Unit Tests (`src/lib/__tests__/`)

Tests for utility functions and business logic:

- **Validation Library** (`validation.test.ts`)
  - Field validation rules
  - Form validation
  - Input sanitization
  - File validation
  - Rate limiting

- **Error Handling** (`error-handling.test.ts`)
  - Custom error classes
  - Logging utilities
  - Error response creation
  - Retry logic
  - Request context extraction

- **Security** (`security.test.ts`)
  - Input sanitization
  - IP extraction
  - Request validation
  - CSP header generation
  - Suspicious activity detection

### 2. API Tests (`src/app/api/__tests__/`)

Integration tests for API endpoints:

- **Health Check** (`health.test.ts`)
  - Service status checking
  - Response format validation
  - Error handling
  - Logging verification

### 3. Component Tests (`src/components/__tests__/`)

React component tests:

- **VibeChat** (`VibeChat.test.tsx`)
  - User interaction testing
  - State management
  - API integration
  - Error handling
  - Accessibility

## Test Utilities and Mocks

### Global Mocks

Located in `jest.setup.js`:

- **Next.js Router**: Navigation and routing
- **Next.js Image**: Image component
- **NextAuth**: Authentication
- **ResizeObserver**: Browser API
- **IntersectionObserver**: Browser API
- **window.matchMedia**: Media queries

### Custom Test Utilities

```typescript
// Example: Testing API responses
const mockFetch = jest.fn()
global.fetch = mockFetch

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ data: 'test' })
})
```

### Component Testing Patterns

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Basic rendering
render(<Component prop="value" />)

// Finding elements
screen.getByText('Click me')
screen.getByRole('button')
screen.getByPlaceholderText('Enter text')

// User interactions
fireEvent.click(screen.getByRole('button'))
fireEvent.change(input, { target: { value: 'new value' } })

// Async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

## Coverage Requirements

Current coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Exclusions

- Type definition files (`.d.ts`)
- Story files (`.stories.tsx`)
- Layout components
- Page components (for now)

## Best Practices

### 1. Test Organization

```typescript
describe('ComponentName', () => {
  describe('feature group', () => {
    it('should do specific thing', () => {
      // Test implementation
    })
  })
})
```

### 2. Mocking Strategy

- Mock external dependencies at the module level
- Use `jest.fn()` for function mocks
- Clear mocks between tests with `jest.clearAllMocks()`

### 3. Async Testing

```typescript
// For API calls
await waitFor(() => {
  expect(mockFetch).toHaveBeenCalledWith('/api/endpoint')
})

// For state updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument()
})
```

### 4. Error Testing

```typescript
// Test error boundaries
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

// Test error states
expect(() => validateField('', { required: true }, 'field')).toThrow()
```

### 5. User-Centric Testing

Focus on testing behavior from the user's perspective:

```typescript
// Good: Test user interactions
fireEvent.click(screen.getByText('Submit'))
expect(screen.getByText('Success message')).toBeInTheDocument()

// Avoid: Testing implementation details
expect(component.state.isSubmitting).toBe(false)
```

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `waitFor` for async operations
2. **DOM Cleanup**: Tests should clean up after themselves
3. **Mock Persistence**: Clear mocks between tests
4. **Console Warnings**: Mock console methods to avoid noise

### Debug Mode

```bash
# Run specific test with debug info
npm test -- --verbose ComponentName.test.tsx

# Run with coverage details
npm test -- --coverage --verbose
```

### VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": "watch"
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:ci && npm run lint"
    }
  }
}
```

## Performance Testing

### Bundle Analysis

```bash
# Analyze test bundle
npx jest --listTests

# Check test performance
npm test -- --verbose --detectOpenHandles
```

### Memory Leaks

```bash
# Detect memory leaks in tests
npm test -- --detectOpenHandles --forceExit
```

## Writing New Tests

### Checklist

- [ ] Test file follows naming convention (`*.test.ts` or `*.test.tsx`)
- [ ] All public functions/components are tested
- [ ] Error cases are covered
- [ ] Async operations use `waitFor`
- [ ] Mocks are properly cleaned up
- [ ] Tests are user-centric
- [ ] Coverage meets thresholds

### Template

```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    // Test user interactions
  })

  it('should handle error states', () => {
    // Test error handling
  })
})
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)