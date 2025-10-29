'use client'

import {useMemo, useCallback, ReactNode} from 'react'
import {createApi, createSanctumApi} from 'laravel-connector'
import {ApiContext} from '../contexts/api-context'
import {ApiProviderConfig, QueryCache} from '../types'
import {createQueryCache, invalidateCacheEntry, clearCache} from '../lib/cache'

export interface ApiProviderProps extends ApiProviderConfig {
  children: ReactNode
}

/**
 * ApiProvider component that provides an API instance to the entire app
 *
 * @example
 * ```tsx
 * <ApiProvider url="https://api.example.com" useSanctum={true}>
 *   <App />
 * </ApiProvider>
 * ```
 */
export function ApiProvider({children, url, useSanctum = false, headers = {}, timeout, retries, retryDelay, withCredentials, useCsrfToken, csrfCookiePath}: ApiProviderProps) {
  const api = useMemo(() => {
    const config = {url, headers, timeout, retries, retryDelay}

    return useSanctum
      ? createSanctumApi({...config, withCredentials, useCsrfToken, csrfCookiePath})
      : createApi(config)
  }, [url, useSanctum, JSON.stringify(headers), timeout, retries, retryDelay, withCredentials, useCsrfToken, csrfCookiePath])

  // Create query cache
  const cache = useMemo<QueryCache>(() => createQueryCache(), [])

  // Invalidate specific query
  const invalidateQuery = useCallback((key: string) => {
    invalidateCacheEntry(cache, key)
  }, [cache])

  // Invalidate all queries
  const invalidateAll = useCallback(() => {
    clearCache(cache)
  }, [cache])

  const value = useMemo(() => ({api, cache, invalidateQuery, invalidateAll}), [api, cache, invalidateQuery, invalidateAll])

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  )
}