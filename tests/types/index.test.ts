import {describe, it, expect} from 'vitest'
import type {ApiProviderConfig, CacheEntry, QueryCache, ApiContextValue} from '../../src'
import {createApi} from 'laravel-connector'

describe('Types', () => {
  it('should have ApiProviderConfig interface', () => {
    const config: ApiProviderConfig = {
      url: 'https://api.example.com'
    }
    expect(config.url).toBe('https://api.example.com')
  })

  it('should have CacheEntry interface', () => {
    const entry: CacheEntry<string> = {
      data: 'test',
      timestamp: Date.now(),
      staleTime: 5000
    }
    expect(entry.data).toBe('test')
    expect(entry.timestamp).toBeGreaterThan(0)
  })

  it('should have QueryCache type as Map', () => {
    const cache: QueryCache = new Map()
    cache.set('key', {data: 'value', timestamp: Date.now(), staleTime: 5000})
    expect(cache.size).toBe(1)
  })

  it('should have ApiContextValue interface', () => {
    const mockApi = createApi({url: 'https://api.example.com'})
    const mockCache: QueryCache = new Map()

    const contextValue: ApiContextValue = {
      api: mockApi,
      cache: mockCache,
      invalidateQuery: () => {
      },
      invalidateAll: () => {
      }
    }

    expect(contextValue.api).toBeDefined()
    expect(contextValue.cache).toBeInstanceOf(Map)
    expect(typeof contextValue.invalidateQuery).toBe('function')
    expect(typeof contextValue.invalidateAll).toBe('function')
  })
})