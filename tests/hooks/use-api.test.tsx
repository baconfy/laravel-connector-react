import {it, expect} from 'vitest'
import {renderHook} from '@testing-library/react'
import {useApi, ApiProvider} from '../../src'
import {ReactNode} from 'react'

it('should throw error when used outside ApiProvider', () => {
  expect(() => {
    renderHook(() => useApi())
  }).toThrow('useApi must be used within an ApiProvider')
})

it('should return API instance when used inside ApiProvider', () => {
  const wrapper = ({children}: { children: ReactNode }) => (
    <ApiProvider url="https://api.example.com">
      {children}
    </ApiProvider>
  )

  const {result} = renderHook(() => useApi(), {wrapper})

  expect(result.current).toBeDefined()
  expect(result.current.get).toBeDefined()
  expect(result.current.post).toBeDefined()
  expect(result.current.put).toBeDefined()
  expect(result.current.patch).toBeDefined()
  expect(result.current.delete).toBeDefined()
})

it('should return same API instance on re-render', () => {
  const wrapper = ({children}: { children: ReactNode }) => (
    <ApiProvider url="https://api.example.com">
      {children}
    </ApiProvider>
  )

  const {result, rerender} = renderHook(() => useApi(), {wrapper})

  const firstApi = result.current
  rerender()
  const secondApi = result.current

  expect(firstApi).toBe(secondApi)
})

it('should work with Sanctum API', () => {
  const wrapper = ({children}: { children: ReactNode }) => (
    <ApiProvider url="https://api.example.com" useSanctum={true}>
      {children}
    </ApiProvider>
  )

  const {result} = renderHook(() => useApi(), {wrapper})

  expect(result.current).toBeDefined()
  expect(result.current.get).toBeDefined()
})
