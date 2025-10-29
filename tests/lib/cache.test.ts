import {describe, it, expect, beforeEach} from 'vitest'
import {createQueryCache, getCachedData, setCachedData, invalidateCacheEntry, clearCache, createCacheKey} from '../../src/lib/cache'
import type {QueryCache} from '../../src/types'

describe('Cache Utils', () => {
  let cache: QueryCache

  beforeEach(() => {
    cache = createQueryCache()
  })

  describe('createQueryCache', () => {
    it('should create an empty Map', () => {
      expect(cache).toBeInstanceOf(Map)
      expect(cache.size).toBe(0)
    })
  })

  describe('setCachedData and getCachedData', () => {
    it('should set and get data from cache', () => {
      setCachedData(cache, 'test-key', {name: 'John'}, 5000)
      const data = getCachedData(cache, 'test-key')

      expect(data).toEqual({name: 'John'})
    })

    it('should return undefined for non-existent key', () => {
      const data = getCachedData(cache, 'non-existent')
      expect(data).toBeUndefined()
    })

    it('should return undefined for stale data', () => {
      setCachedData(cache, 'test-key', {name: 'John'}, 0) // staleTime = 0

      // Wait a bit to ensure it's stale
      setTimeout(() => {
        const data = getCachedData(cache, 'test-key')
        expect(data).toBeUndefined()
      }, 10)
    })

    it('should delete stale entries when accessed', () => {
      setCachedData(cache, 'test-key', {name: 'John'}, 0)

      expect(cache.has('test-key')).toBe(true)

      setTimeout(() => {
        getCachedData(cache, 'test-key')
        expect(cache.has('test-key')).toBe(false)
      }, 10)
    })
  })

  describe('invalidateCacheEntry', () => {
    it('should remove entry from cache', () => {
      setCachedData(cache, 'test-key', {name: 'John'}, 5000)
      expect(cache.has('test-key')).toBe(true)

      invalidateCacheEntry(cache, 'test-key')
      expect(cache.has('test-key')).toBe(false)
    })

    it('should not throw when removing non-existent key', () => {
      expect(() => {
        invalidateCacheEntry(cache, 'non-existent')
      }).not.toThrow()
    })
  })

  describe('clearCache', () => {
    it('should clear all entries', () => {
      setCachedData(cache, 'key1', {name: 'John'}, 5000)
      setCachedData(cache, 'key2', {name: 'Jane'}, 5000)

      expect(cache.size).toBe(2)

      clearCache(cache)
      expect(cache.size).toBe(0)
    })
  })

  describe('createCacheKey', () => {
    it('should return endpoint when no params', () => {
      const key = createCacheKey('/users')
      expect(key).toBe('/users')
    })

    it('should return endpoint when params is empty', () => {
      const key = createCacheKey('/users', {})
      expect(key).toBe('/users')
    })

    it('should create key with sorted params', () => {
      const key = createCacheKey('/users', {page: 1, limit: 10})
      expect(key).toBe('/users?{"limit":10,"page":1}')
    })

    it('should create same key regardless of param order', () => {
      const key1 = createCacheKey('/users', {page: 1, limit: 10})
      const key2 = createCacheKey('/users', {limit: 10, page: 1})
      expect(key1).toBe(key2)
    })

    it('should handle complex params', () => {
      const key = createCacheKey('/users', {
        filters: {name: 'John', active: true},
        sort: 'name'
      })
      expect(key).toContain('/users?')
      expect(key).toContain('filters')
      expect(key).toContain('sort')
    })
  })
})