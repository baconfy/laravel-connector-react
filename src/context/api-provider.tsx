"use client";

import React, {createContext, useContext, useMemo} from 'react'
import {createSanctumApi, type SanctumApi} from 'laravel-connector'
import type {ApiProviderProps} from '../types'

const ApiContext = createContext<SanctumApi | null>(null)

/**
 * Provider component for Laravel API context
 * Wraps your app to provide an API instance to all hooks
 */
export function ApiProvider({children, api, config}: ApiProviderProps) {
  const apiInstance = useMemo(() => {
    if (api) return api;
    if (config) return createSanctumApi(config);
    throw new Error('ApiProvider requires either "api" or "config" prop');
  }, [api, config]);

  return <ApiContext.Provider value={apiInstance}>{children}</ApiContext.Provider>
}

/**
 * Hook to access the API instance from context
 * @throws Error if used outside ApiProvider
 */
export function useApiContext(): SanctumApi {
  const context = useContext(ApiContext)

  if (!context) {
    throw new Error('useApiContext must be used within an ApiProvider')
  }

  return context
}