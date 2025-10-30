"use client"

import {useCallback, useRef, useState} from 'react'
import {useApi} from './use-api'
import {HttpMethod, MutationOptions, MutationState, Response} from '../types'

/**
 * Hook for performing mutations (POST, PUT, PATCH, DELETE)
 *
 * @param endpoint - The API endpoint to mutate
 * @param method - The HTTP method to use (POST, PUT, PATCH, DELETE)
 * @param options - Mutation options for callbacks and retry
 * @returns Mutation state with mutate function and loading states
 */
export function useMutation<TData = any, TVariables = any>(endpoint: string, method: HttpMethod = 'POST', options: MutationOptions<TData, TVariables> = {}): MutationState<TData, TVariables> {
  const api = useApi()

  const {onSuccess, onError, onSettled, retry = 0, retryDelay = 1000} = options

  const [data, setData] = useState<TData | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<any>(null)
  const [isError, setIsError] = useState(false)

  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)

  // Mutation function
  const mutate = useCallback(async (variables: TVariables): Promise<Response<TData>> => {
    setIsLoading(true)
    setIsError(false)
    setError(null)
    retryCountRef.current = 0 // Reset retry count on new mutation

    const executeMutation = async (): Promise<Response<TData>> => {
      try {
        let response: Response<TData>

        switch (method.toUpperCase()) {
          case 'POST':
            response = await api.post<TData>(endpoint, variables)
            break
          case 'PUT':
            response = await api.put<TData>(endpoint, variables)
            break
          case 'PATCH':
            response = await api.patch<TData>(endpoint, variables)
            break
          case 'DELETE':
            response = await api.delete<TData>(endpoint)
            break
          default:
            throw new Error(`Unsupported method: ${method}`)
        }

        if (!mountedRef.current) return response

        if (response.success && response.data) {
          setData(response.data)
          setIsSuccess(true)
          setIsError(false)
          setError(null)

          retryCountRef.current = 0

          onSuccess?.(response.data, variables)
          onSettled?.(response.data, null, variables)
        } else if (response.success && !response.errors) {
          setIsSuccess(true)
          setIsError(false)
          setError(null)

          retryCountRef.current = 0

          onSuccess?.(undefined as any, variables)
          onSettled?.(undefined, null, variables)
        } else {
          throw new Error(response.errors || 'Mutation failed')
        }

        return response
      } catch (err) {
        if (!mountedRef.current) throw err

        // Retry logic
        if (retryCountRef.current < retry) {
          retryCountRef.current++
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current))
          return await executeMutation()
        }

        setError(err)
        setIsError(true)
        setIsSuccess(false)

        onError?.(err, variables)
        onSettled?.(undefined, err, variables)

        throw err
      } finally {
        if (mountedRef.current && retryCountRef.current === 0) {
          setIsLoading(false)
        }
      }
    }

    try {
      return await executeMutation()
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [endpoint, method, api, retry, retryDelay, onSuccess, onError, onSettled])

  // Async mutation function (same as mutate but explicit)
  const mutateAsync = mutate

  // Reset function
  const reset = useCallback(() => {
    setData(undefined)
    setError(null)
    setIsLoading(false)
    setIsError(false)
    setIsSuccess(false)
    retryCountRef.current = 0
  }, [])

  // Cleanup
  useCallback(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {data, error, isLoading, isError, isSuccess, mutate, mutateAsync, reset}
}