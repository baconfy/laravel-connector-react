import {CacheEntry, QueryCache} from '../types'

/**
 * Creates a new query cache
 */
export function createQueryCache(): QueryCache {
  return new Map()
}

/**
 * Gets cached data if it's still fresh
 */
export function getCachedData<T>(cache: QueryCache, key: string): T | undefined {
  const entry = cache.get(key)

  if (!entry) return undefined

  const now = Date.now()

  const isStale = now - entry.timestamp >= entry.staleTime

  if (isStale) {
    cache.delete(key)
    return undefined
  }

  return entry.data as T
}

/**
 * Sets data in cache
 */
export function setCachedData<T>(cache: QueryCache, key: string, data: T, staleTime: number): void {
  const entry: CacheEntry<T> = {data, timestamp: Date.now(), staleTime}

  cache.set(key, entry)
}

/**
 * Invalidates a specific cache entry
 */
export function invalidateCacheEntry(cache: QueryCache, key: string): void {
  cache.delete(key)
}

/**
 * Clears all cache entries
 */
export function clearCache(cache: QueryCache): void {
  cache.clear()
}

/**
 * Creates a cache key from endpoint and params
 */
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint
  }

  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key]
    return acc
  }, {} as Record<string, any>)

  return `${endpoint}?${JSON.stringify(sortedParams)}`
}