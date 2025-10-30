import {describe, it, expect} from 'vitest'
import {render, screen} from '@testing-library/react'
import {SanctumProvider, ApiContext} from '../../src'
import '@testing-library/jest-dom'
import {useContext} from 'react'

describe('SanctumProvider', () => {
  it('should render children', () => {
    render(
      <SanctumProvider url="https://api.example.com">
        <div>Test Child</div>
      </SanctumProvider>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide API context', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context ? 'Has Context' : 'No Context'}</div>
    }

    render(
      <SanctumProvider url="https://api.example.com">
        <TestComponent/>
      </SanctumProvider>
    )

    expect(screen.getByText('Has Context')).toBeInTheDocument()
  })

  it('should create Sanctum API instance with correct config', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.api ? 'Has API' : 'No API'}</div>
    }

    render(
      <SanctumProvider url="https://api.example.com" timeout={5000}>
        <TestComponent/>
      </SanctumProvider>
    )

    expect(screen.getByText('Has API')).toBeInTheDocument()
  })

  it('should provide cache', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.cache ? 'Has Cache' : 'No Cache'}</div>
    }

    render(
      <SanctumProvider url="https://api.example.com">
        <TestComponent/>
      </SanctumProvider>
    )

    expect(screen.getByText('Has Cache')).toBeInTheDocument()
  })

  it('should provide invalidateQuery function', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.invalidateQuery ? 'Has Invalidate' : 'No Invalidate'}</div>
    }

    render(
      <SanctumProvider url="https://api.example.com">
        <TestComponent/>
      </SanctumProvider>
    )

    expect(screen.getByText('Has Invalidate')).toBeInTheDocument()
  })

  it('should provide invalidateAll function', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.invalidateAll ? 'Has InvalidateAll' : 'No InvalidateAll'}</div>
    }

    render(
      <SanctumProvider url="https://api.example.com">
        <TestComponent/>
      </SanctumProvider>
    )

    expect(screen.getByText('Has InvalidateAll')).toBeInTheDocument()
  })

  it('should always use Sanctum API (no useSanctum flag)', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      // Check that the API has the initialize method (characteristic of SanctumApi)
      const isSanctumApi = context?.api && 'initialize' in context.api
      return <div>{isSanctumApi ? 'Is Sanctum API' : 'Not Sanctum API'}</div>
    }

    render(
      <SanctumProvider url="https://api.example.com">
        <TestComponent/>
      </SanctumProvider>
    )

    expect(screen.getByText('Is Sanctum API')).toBeInTheDocument()
  })
})