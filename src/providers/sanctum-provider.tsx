"use client"

import {useMemo, useCallback, ReactNode, useEffect} from 'react'
import {createSanctumApi} from 'laravel-connector'
import {ApiContext} from '../contexts/api-context'
import {ApiProviderConfig, QueryCache} from '../types'
import {createQueryCache, invalidateCacheEntry, clearCache} from '../lib/cache'

export interface SanctumProviderProps extends Omit<ApiProviderConfig, 'useSanctum'> {
  children: ReactNode
}

/**
 * SanctumProvider component that provides a Sanctum API instance to the entire app
 * Automatically initializes the session and manages cache
 */
export function SanctumProvider({children, url, headers = {}, timeout, retries, retryDelay, withCredentials, useCsrfToken, csrfCookiePath}: SanctumProviderProps) {
  const api = useMemo(() => {
    const config = {url, headers, timeout, retries, retryDelay}

    return createSanctumApi({...config, withCredentials, useCsrfToken, csrfCookiePath})
  }, [url, headers, timeout, retries, retryDelay, withCredentials, useCsrfToken, csrfCookiePath])

  const cache = useMemo<QueryCache>(() => createQueryCache(), [])

  const invalidateQuery = useCallback((key: string) => {
    invalidateCacheEntry(cache, key)
  }, [cache])

  const invalidateAll = useCallback(() => {
    clearCache(cache)
  }, [cache])

  const value = useMemo(() => ({api, cache, invalidateQuery, invalidateAll}), [api, cache, invalidateQuery, invalidateAll])

  useEffect(() => {
    const initializeSession = async () => {
      await api.initialize()
    }

    void initializeSession()
  }, [api])

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  )
}