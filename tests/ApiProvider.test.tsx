import {describe, expect, it} from 'vitest'
import {render, screen} from '@testing-library/react'
import {ApiProvider, useApiContext} from '../src'
import {createSanctumApi} from 'laravel-connector'
import React from 'react'

describe('ApiProvider', () => {
  const mockApi = createSanctumApi({
    baseUrl: 'https://api.example.com'
  })

  describe('with api instance prop (legacy)', () => {
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

    it('should render children correctly', () => {
      render(
        <ApiProvider api={mockApi}>
          <div>Child Component</div>
        </ApiProvider>
      )

      expect(screen.getByText('Child Component')).toBeDefined()
    })
  })

  describe('with config prop', () => {
    it('should create and provide API instance from config', () => {
      function TestComponent() {
        const api = useApiContext()
        return <div>API is {api ? 'available' : 'unavailable'}</div>
      }

      render(
        <ApiProvider config={{baseUrl: 'https://config.example.com'}}>
          <TestComponent/>
        </ApiProvider>
      )

      expect(screen.getByText('API is available')).toBeDefined()
    })

    it('should render children correctly with config', () => {
      render(
        <ApiProvider config={{baseUrl: 'https://api.example.com'}}>
          <div>Child Component</div>
        </ApiProvider>
      )

      expect(screen.getByText('Child Component')).toBeDefined()
    })

    it('should memoize API instance with same config', () => {
      const apiInstances: any[] = []

      function TestComponent() {
        const api = useApiContext()
        apiInstances.push(api)
        return <div>Test</div>
      }

      const config = { baseUrl: 'https://api.example.com' }

      const {rerender} = render(
        <ApiProvider config={config}>
          <TestComponent/>
        </ApiProvider>
      )

      rerender(
        <ApiProvider config={config}>
          <TestComponent/>
        </ApiProvider>
      )

      // Should be the same instance due to memoization
      expect(apiInstances[0]).toBe(apiInstances[1])
    })
  })

  describe('error handling', () => {
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

    it('should throw error when neither api nor config is provided', () => {
      // Suppress console.error for this test
      const consoleError = console.error
      console.error = () => {
      }

      function TestComponent() {
        return <div>Test</div>
      }

      expect(() => {
        render(
          // @ts-expect-error - Testing invalid props
          <ApiProvider>
            <TestComponent/>
          </ApiProvider>
        )
      }).toThrow('ApiProvider requires either "api" or "config" prop')

      console.error = consoleError
    })
  })
})