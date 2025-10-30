"use client"

import {useContext} from 'react'
import {ApiContext} from '../contexts/api-context'
import {SanctumApi} from 'laravel-connector'

/**
 * Hook to access the Sanctum API instance from context
 * Only use this when inside a SanctumProvider
 *
 * @returns The Sanctum API instance
 * @throws Error if used outside SanctumProvider
 * @throws Error if used with generic ApiProvider
 */
export function useSanctum(): SanctumApi {
  const context = useContext(ApiContext)

  if (!context) {
    throw new Error('useSanctum must be used within a SanctumProvider')
  }

  if (!('initialize' in context.api)) {
    throw new Error('useSanctum must be used within a SanctumProvider')
  }

  return context.api as SanctumApi
}