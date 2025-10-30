import {it, expect, describe} from 'vitest'
import {renderHook} from '@testing-library/react'
import {useSanctum, SanctumProvider, ApiProvider} from '../../src'
import {ReactNode} from 'react'

describe('useSanctum', () => {
  it('should throw error when used outside SanctumProvider', () => {
    expect(() => {
      renderHook(() => useSanctum())
    }).toThrow('useSanctum must be used within a SanctumProvider')
  })

  it('should throw error when used inside ApiProvider (not SanctumProvider)', () => {
    const wrapper = ({children}: { children: ReactNode }) => (
      <ApiProvider url="https://api.example.com">
        {children}
      </ApiProvider>
    )

    expect(() => {
      renderHook(() => useSanctum(), {wrapper})
    }).toThrow('useSanctum must be used within a SanctumProvider')
  })

  it('should return Sanctum API instance when used inside SanctumProvider', () => {
    const wrapper = ({children}: { children: ReactNode }) => (
      <SanctumProvider url="https://api.example.com">
        {children}
      </SanctumProvider>
    )

    const {result} = renderHook(() => useSanctum(), {wrapper})

    expect(result.current).toBeDefined()
    expect(result.current.get).toBeDefined()
    expect(result.current.post).toBeDefined()
    expect(result.current.put).toBeDefined()
    expect(result.current.patch).toBeDefined()
    expect(result.current.delete).toBeDefined()
    expect(result.current.initialize).toBeDefined()
  })

  it('should return same Sanctum API instance on re-render', () => {
    const wrapper = ({children}: { children: ReactNode }) => (
      <SanctumProvider url="https://api.example.com">
        {children}
      </SanctumProvider>
    )

    const {result, rerender} = renderHook(() => useSanctum(), {wrapper})

    const firstApi = result.current
    rerender()
    const secondApi = result.current

    expect(firstApi).toBe(secondApi)
  })

  it('should be a valid SanctumApi instance', () => {
    const wrapper = ({children}: { children: ReactNode }) => (
      <SanctumProvider url="https://api.example.com">
        {children}
      </SanctumProvider>
    )

    const {result} = renderHook(() => useSanctum(), {wrapper})

    expect(typeof result.current.initialize).toBe('function')
  })
})