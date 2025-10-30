import {Api, SanctumApi, Response} from 'laravel-connector'

/**
 * Configuration for the API Provider
 */
export interface ApiProviderConfig {
  url: string
  useSanctum?: boolean
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  retryDelay?: number
  withCredentials?: boolean
  useCsrfToken?: boolean
  csrfCookiePath?: string
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  staleTime: number
}

/**
 * Query cache
 */
export type QueryCache = Map<string, CacheEntry>

/**
 * API Context value
 */
export interface ApiContextValue {
  api: Api | SanctumApi
  cache: QueryCache
  invalidateQuery: (key: string) => void
  invalidateAll: () => void
}

/**
 * Query options for useQuery hook
 */
export interface QueryOptions<T = any> {
  enabled?: boolean
  refetchOnMount?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number | false
  staleTime?: number
  retry?: number
  retryDelay?: number
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  select?: (data: any) => T
  initialData?: T
}

/**
 * Query state returned by useQuery
 */
export interface QueryState<T = any> {
  data: T | undefined
  error: any
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching: boolean
  refetch: () => Promise<void>
  invalidate: () => void
  reset: () => void
}

/**
 * HTTP methods for mutations
 */
export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Mutation options for useMutation hook
 */
export interface MutationOptions<TData = any, TVariables = any> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: any, variables: TVariables) => void
  onSettled?: (data: TData | undefined, error: any, variables: TVariables) => void
  retry?: number
  retryDelay?: number
}

/**
 * Mutation state returned by useMutation
 */
export interface MutationState<TData = any, TVariables = any> {
  data: TData | undefined
  error: any
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  mutate: (variables: TVariables) => Promise<Response<TData>>
  mutateAsync: (variables: TVariables) => Promise<Response<TData>>
  reset: () => void
}

// Re-export Response from laravel-connector for convenience
export type {Response}