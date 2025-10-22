import {beforeEach, vi} from 'vitest'
import '@testing-library/react'

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock console.error to avoid polluting test output
global.console.error = vi.fn()