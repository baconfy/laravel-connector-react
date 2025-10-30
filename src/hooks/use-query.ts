"use client"

import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {createCacheKey, getCachedData, setCachedData} from '../lib/cache'
import {ApiContext} from '../contexts/api-context'
import {QueryOptions, QueryState} from '../types'

/**
 * Hook for fetching data with caching and automatic refetching
 * Includes security improvements: reset function, abort controller, error validation
 *
 * @param endpoint - The API endpoint to fetch from
 * @param options - Query options for configuration
 * @returns Query state with data, loading, error states and refetch/reset functions
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
  const abortControllerRef = useRef<AbortController | null>(null)

  // Create a cache key
  const cacheKey = createCacheKey(endpoint)

  /**
   * Reset function - Clears all data from memory (security)
   * Used on logout or when you need to clear sensitive data
   *
   * @returns void
   */
  const reset = useCallback(() => {
    setData(undefined)
    setError(null)
    setIsLoading(false)
    setIsFetching(false)
    setIsError(false)
    setIsSuccess(false)
    retryCountRef.current = 0
  }, [])

  /**
   * Fetch function with support for abort controller and error validation
   *
   * @param isRetry - Whether this is a retry attempt
   * @returns Promise<void>
   */
  const fetchData = useCallback(async (isRetry = false): Promise<void> => {
    if (!enabled) return

    if (!isRetry) {
      setIsFetching(true)
      if (!data) {
        setIsLoading(true)
      }
    }

    try {
      const cached = getCachedData<T>(cache, cacheKey)

      if (staleTime > 0 && cached && !isRetry) {
        const finalData = select ? select(cached) : cached

        setData(finalData)
        setIsSuccess(true)
        setIsError(false)
        setError(null)
        setIsFetching(false)
        setIsLoading(false)
        onSuccess?.(finalData)

        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      const response = await api.get(endpoint, {signal})

      // Check if the component is still mounted and the request wasn't aborted
      if (!mountedRef.current) return
      if (signal.aborted) return

      if (response.success && response.data) {
        const finalData = select ? select(response.data) : response.data

        setData(finalData as T)
        setIsSuccess(true)
        setIsError(false)
        setError(null)
        retryCountRef.current = 0

        setCachedData(cache, cacheKey, response.data, staleTime)

        onSuccess?.(finalData as T)
      } else if (response.success && !response.errors) {
        const finalData = select ? select(undefined) : undefined

        setData(finalData as T)
        setIsSuccess(true)
        setIsError(false)
        setError(null)
        retryCountRef.current = 0

        setCachedData(cache, cacheKey, undefined, staleTime)

        onSuccess?.(finalData as T)
      } else {
        throw new Error(response.errors || 'Failed to fetch data')
      }
    } catch (err) {
      if (!mountedRef.current) return
      if (abortControllerRef.current?.signal.aborted) return

      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++

        setTimeout(() => {
          if (mountedRef.current) {
            void fetchData(true)
          }
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

  /**
   * Refetch function - Fetches fresh data and resets retry count
   *
   * @returns Promise<void>
   */
  const refetch = useCallback(async () => {
    retryCountRef.current = 0
    await fetchData()
  }, [fetchData])

  /**
   * Invalidate function - Clears cache and refetches data
   *
   * @returns void
   */
  const invalidate = useCallback(() => {
    contextInvalidate(cacheKey)
    retryCountRef.current = 0
    setData(undefined)
    void fetchData()
  }, [cacheKey, contextInvalidate, fetchData])

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount) {
      void fetchData()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
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

  // Cleanup on unmounting
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {data, error, isLoading, isError, isSuccess, isFetching, refetch, invalidate, reset}
}