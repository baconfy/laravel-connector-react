import {useCallback, useRef, useState} from 'react'
import {useApiContext} from '../context/api-provider'
import type {UseMutationOptions, UseMutationResult} from '../types'
import type {Response} from 'laravel-connector'

type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Hook for making mutations (POST, PUT, PATCH, DELETE) to Laravel API
 *
 * @param endpoint - API endpoint to mutate
 * @param method - HTTP method to use (default: POST)
 * @param options - Configuration options for the hook
 */
export function useMutation<T = any>(
  endpoint: string,
  method: MutationMethod = 'POST',
  options: UseMutationOptions = {}
): UseMutationResult<T> {
  const api = useApiContext()
  const [state, setState] = useState<{
    data: T | null
    errors: any
    isLoading: boolean
    isSuccess: boolean
  }>({
    data: null,
    errors: null,
    isLoading: false,
    isSuccess: false
  })

  const isMountedRef = useRef(true)

  const {onSuccess, onError, onSettled} = options

  const executeMutation = useCallback(
    async (body?: any): Promise<Response<T>> => {
      setState({
        data: null,
        errors: null,
        isLoading: true,
        isSuccess: false
      })

      let result: Response<T>

      try {
        switch (method) {
          case 'POST':
            result = await api.post<T>(endpoint, body)
            break
          case 'PUT':
            result = await api.put<T>(endpoint, body)
            break
          case 'PATCH':
            result = await api.patch<T>(endpoint, body)
            break
          case 'DELETE':
            result = await api.delete<T>(endpoint)
            break
          default:
            throw new Error(`Unsupported method: ${method}`)
        }

        // Only update state if the component is still mounted
        if (!isMountedRef.current) return result

        setState({
          data: result.data,
          errors: result.errors,
          isLoading: false,
          isSuccess: !result.errors
        })

        if (result.data && onSuccess) {
          await onSuccess(result.data)
        }

        if (result.errors && onError) {
          await onError(result.errors)
        }

        return result
      } finally {
        if (onSettled) {
          await onSettled()
        }
      }
    },
    [api, endpoint, method, onSuccess, onError, onSettled]
  )

  const mutate = useCallback(
    async (body?: any): Promise<void> => {
      await executeMutation(body)
    },
    [executeMutation]
  )

  const mutateAsync = useCallback(
    async (body?: any): Promise<T | null> => {
      const result = await executeMutation(body)
      return result.data
    },
    [executeMutation]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      errors: null,
      isLoading: false,
      isSuccess: false
    })
  }, [])

  // Cleanup on unmounting
  useCallback(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    ...state,
    isError: !!state.errors,
    mutate,
    mutateAsync,
    reset
  }
}