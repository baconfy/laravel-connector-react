import {describe, expect, it} from 'vitest'
import {render, screen} from '@testing-library/react'
import {ApiProvider, useApiContext} from '../src'
import {createSanctumApi} from 'laravel-connector'
import React from 'react'

describe('ApiProvider', () => {
  const mockApi = createSanctumApi({
    baseUrl: 'https://api.example.com'
  })

  it('should provide API instance to children', () => {
    function TestComponent() {
      const api = useApiContext()
      return <div>API is {api ? 'available' : 'unavailable'}</div>
    }

    render(
      <ApiProvider api={mockApi}>
        <TestComponent/>
      </ApiProvider>
    )

    expect(screen.getByText('API is available')).toBeDefined()
  })

  it('should throw error when useApiContext is used outside provider', () => {
    function TestComponent() {
      try {
        useApiContext()
        return <div>No error</div>
      } catch (error) {
        return <div>{(error as Error).message}</div>
      }
    }

    render(<TestComponent/>)

    expect(screen.getByText('useApiContext must be used within an ApiProvider')).toBeDefined()
  })

  it('should render children correctly', () => {
    render(
      <ApiProvider api={mockApi}>
        <div>Child Component</div>
      </ApiProvider>
    )

    expect(screen.getByText('Child Component')).toBeDefined()
  })
})