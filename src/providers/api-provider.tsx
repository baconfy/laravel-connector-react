"use client"

import {useMemo, useCallback, ReactNode} from 'react'
import {createApi} from 'laravel-connector'
import {ApiContext} from '../contexts/api-context'
import {ApiProviderConfig, QueryCache} from '../types'
import {createQueryCache, invalidateCacheEntry, clearCache} from '../lib/cache'

export interface ApiProviderProps extends Omit<ApiProviderConfig, 'useSanctum' | 'withCredentials' | 'useCsrfToken' | 'csrfCookiePath'> {
  children: ReactNode
}

/**
 * ApiProvider component that provides a basic API instance to the entire app
 * Uses this for non-Sanctum APIs. For Sanctum authentication, use SanctumProvider instead.
 */
export function ApiProvider({children, url, headers = {}, timeout, retries, retryDelay}: ApiProviderProps) {
  const api = useMemo(() => {
    const config = {url, headers, timeout, retries, retryDelay}
    return createApi(config)
  }, [url, headers, timeout, retries, retryDelay])

  const cache = useMemo<QueryCache>(() => createQueryCache(), [])

  const invalidateQuery = useCallback((key: string) => {
    invalidateCacheEntry(cache, key)
  }, [cache])

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