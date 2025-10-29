import {expect, afterEach, vi, beforeEach} from 'vitest'
import {cleanup} from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Mock laravel-connector globally
vi.mock('laravel-connector', async () => {
  const {setupLaravelConnectorMock} = await import('./mocks/laravel-connector')
  return setupLaravelConnectorMock()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock fetch globally
global.fetch = vi.fn()