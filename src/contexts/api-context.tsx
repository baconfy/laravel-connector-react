'use client'

import {createContext} from 'react'
import {ApiContextValue} from '../types'

/**
 * API Context for providing API instance throughout the app
 */
export const ApiContext = createContext<ApiContextValue | null>(null)

ApiContext.displayName = 'ApiContext'