import {useCallback, useEffect, useRef, useState} from 'react'
import {useApiContext} from '../context/api-provider'
import type {UseApiOptions, UseApiResult} from '../types'

/**
 * Hook for fetching data from Laravel API with automatic refetching
 *
 * @param endpoint - API endpoint to fetch from
 * @param options - Configuration options for the hook
 */
export function useApi<T = any>(endpoint: string, options: UseApiOptions = {}): UseApiResult<T> {
  const api = useApiContext()
  const [state, setState] = useState<{ data: T | null; errors: any; isLoading: boolean; isSuccess: boolean; }>({data: null, errors: null, isLoading: true, isSuccess: false})

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchRef = useRef<string | null>(null)
  const isMountedRef = useRef<boolean>(true)

  const {enabled = true, refetchInterval, refetchOnWindowFocus = false, onSuccess, onError, params} = options
  const fetchKey = JSON.stringify({endpoint, params})

  const fetchData = useCallback(async () => {
    lastFetchRef.current = fetchKey

    setState(prev => ({...prev, isLoading: true}))

    const result = await api.get<T>(endpoint, {params})

    if (!isMountedRef.current) return

    setState({data: result.data, errors: result.errors, isLoading: false, isSuccess: !result.errors})

    if (result.data && onSuccess) {
      await onSuccess(result.data)
    }

    if (result.errors && onError) {
      await onError(result.errors)
    }
  }, [endpoint, api, onSuccess, onError, params, fetchKey])

  useEffect(() => {
    if (!enabled) {
      setState({data: null, errors: null, isLoading: false, isSuccess: false})
      return
    }

    if (lastFetchRef.current === fetchKey) {
      return
    }

    lastFetchRef.current = fetchKey

    fetchData()

    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(fetchData, refetchInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, enabled, refetchInterval, fetchKey])

  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return

    const handleFocus = () => {
      fetchData()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetchOnWindowFocus, enabled, fetchData])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const mutate = useCallback((newData: T | null) => {
    setState(prev => ({...prev, data: newData}))
  }, [])

  return {...state, isError: !!state.errors, refetch: fetchData, mutate}
}