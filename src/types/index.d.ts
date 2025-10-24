import type {SanctumApi} from 'laravel-connector'
import React from "react";

export interface UseApiOptions {
  enabled?: boolean
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: any) => void | Promise<void>
  onError?: (error: any) => void | Promise<void>
  params?: Record<string, any>
}

export interface UseApiResult<T> {
  data: T | null
  errors: any
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
  mutate: (newData: T | null) => void
}

export interface UseMutationOptions {
  onSuccess?: (data: any) => void | Promise<void>
  onError?: (error: any) => void | Promise<void>
  onSettled?: () => void | Promise<void>
}

export interface UseMutationResult<T> {
  data: T | null
  errors: any
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  mutate: (body?: any) => Promise<void>
  mutateAsync: (body?: any) => Promise<T | null>
  reset: () => void
}

export type ApiProviderProps = {
  children: React.ReactNode;
} & (
  | { api: SanctumApi; config?: never }
  | { config: Parameters<typeof import('laravel-connector').createSanctumApi>[0]; api?: never }
  );

export type AuthProviderProps = { children: React.ReactNode; };