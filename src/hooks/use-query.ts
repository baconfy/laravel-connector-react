'use client'

import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {ApiContext} from '../contexts/api-context'
import {QueryOptions, QueryState} from '../types'
import {createCacheKey, getCachedData, setCachedData} from '../lib/cache'

/**
 * Hook for fetching data with caching and automatic refetching
 *
 * @param endpoint - The API endpoint to fetch from
 * @param options - Query options for configuration
 * @returns Query state with data, loading, error states and refetch function
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { data, isLoading, isError, error, refetch } = useQuery('/users', {
 *     refetchOnMount: true,
 *     staleTime: 5000,
 *     onSuccess: (users) => console.log('Loaded:', users)
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (isError) return <div>Error: {error}</div>
 *
 *   return (
 *     <div>
 *       {data.map(user => <div key={user.id}>{user.name}</div>)}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useQuery<T = any>(endpoint: string, options: QueryOptions<T> = {}): QueryState<T> {
  const context = useContext(ApiContext)

  if (!context) {
    throw new Error('useQuery must be used within an ApiProvider')
  }

  const {api, cache, invalidateQuery: contextInvalidate} = context

  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    refetchInterval = false,
    staleTime = 0,
    retry = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    select,
    initialData
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  // Create cache key
  const cacheKey = createCacheKey(endpoint)

  // Fetch function
  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return

    if (!isRetry) {
      setIsFetching(true)
      if (!data) {
        setIsLoading(true)
      }
    }

    try {
      // Check cache first
      const cached = getCachedData<T>(cache, cacheKey)
      if (cached && !isRetry) {
        setData(select ? select(cached) : cached)
        setIsSuccess(true)
        setIsError(false)
        setError(null)
        setIsFetching(false)
        setIsLoading(false)
        onSuccess?.(select ? select(cached) : cached)
        return
      }

      const response = await api.get(endpoint)

      if (!mountedRef.current) return

      if (response.success && response.data) {
        const finalData = select ? select(response.data) : response.data
        setData(finalData as T)
        setIsSuccess(true)
        setIsError(false)
        setError(null)
        retryCountRef.current = 0

        // Cache the data
        setCachedData(cache, cacheKey, response.data, staleTime)

        onSuccess?.(finalData as T)
      } else {
        throw new Error(response.errors || 'Failed to fetch data')
      }
    } catch (err) {
      if (!mountedRef.current) return

      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++
        setTimeout(() => {
          void fetchData(true)
        }, retryDelay * retryCountRef.current)
        return
      }

      setError(err)
      setIsError(true)
      setIsSuccess(false)
      onError?.(err)
    } finally {
      if (mountedRef.current) {
        setIsFetching(false)
        setIsLoading(false)
      }
    }
  }, [endpoint, enabled, api, cache, cacheKey, staleTime, select, retry, retryDelay, onSuccess, onError, data])

  // Refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0
    await fetchData()
  }, [fetchData])

  // Invalidate function
  const invalidate = useCallback(() => {
    contextInvalidate(cacheKey)
    retryCountRef.current = 0
    void fetchData()
  }, [cacheKey, contextInvalidate, fetchData])

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount) {
      void fetchData()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        void fetchData()
      }, refetchInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }

    return undefined
  }, [refetchInterval, enabled, fetchData])

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return undefined

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void fetchData()
      }
    }

    window.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetchOnWindowFocus, enabled, fetchData])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {data, error, isLoading, isError, isSuccess, isFetching, refetch, invalidate}
}