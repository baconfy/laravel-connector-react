import {vi} from 'vitest'

/**
 * Mock API instance
 */
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  getInterceptors: vi.fn(() => ({
    use: vi.fn()
  }))
}

/**
 * Mock Sanctum API instance
 */
export const mockSanctumApi = {
  ...mockApi,
  getCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
  setCsrfToken: vi.fn(),
  hasCsrfToken: vi.fn(),
  initialize: vi.fn()
}

/**
 * Mock laravel-connector module
 */
export const mockLaravelConnector = {
  createApi: vi.fn(() => mockApi),
  createSanctumApi: vi.fn(() => mockSanctumApi)
}

/**
 * Setup mock for laravel-connector
 * Use this in vi.mock()
 */
export function setupLaravelConnectorMock() {
  return mockLaravelConnector
}