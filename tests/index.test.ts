import {describe, it, expect} from 'vitest'
import * as exports from '../src/index'

describe('Package Exports', () => {
  it('should export ApiProvider', () => {
    expect(exports.ApiProvider).toBeDefined()
    expect(typeof exports.ApiProvider).toBe('function')
  })

  it('should export SanctumProvider', () => {
    expect(exports.SanctumProvider).toBeDefined()
    expect(typeof exports.SanctumProvider).toBe('function')
  })

  it('should export ApiContext', () => {
    expect(exports.ApiContext).toBeDefined()
    expect(exports.ApiContext.displayName).toBe('ApiContext')
  })

  it('should export hooks', () => {
    expect(exports.useApi).toBeDefined()
    expect(typeof exports.useApi).toBe('function')

    expect(exports.useQuery).toBeDefined()
    expect(typeof exports.useQuery).toBe('function')

    expect(exports.useMutation).toBeDefined()
    expect(typeof exports.useMutation).toBe('function')
  })

  it('should export cache utilities', () => {
    expect(exports.createQueryCache).toBeDefined()
    expect(exports.getCachedData).toBeDefined()
    expect(exports.setCachedData).toBeDefined()
    expect(exports.invalidateCacheEntry).toBeDefined()
    expect(exports.clearCache).toBeDefined()
    expect(exports.createCacheKey).toBeDefined()
  })

  it('should have correct number of exports', () => {
    const exportKeys = Object.keys(exports)
    expect(exportKeys.length).toBe(13)
  })
})