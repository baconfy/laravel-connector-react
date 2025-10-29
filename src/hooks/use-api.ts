import {useContext} from 'react'
import {ApiContext} from '../contexts/api-context'
import {Api, SanctumApi} from 'laravel-connector'

/**
 * Hook to access the API instance from context
 *
 * @returns The API instance (Api or SanctumApi)
 * @throws Error if used outside of ApiProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useApi()
 *
 *   const handleFetch = async () => {
 *     const response = await api.get('/users')
 *     if (response.success) {
 *       console.log(response.data)
 *     }
 *   }
 *
 *   return <button onClick={handleFetch}>Fetch Users</button>
 * }
 * ```
 */
export function useApi(): Api | SanctumApi {
  const context = useContext(ApiContext)

  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }

  return context.api
}