import {describe, it, expect} from 'vitest'
import {render, screen} from '@testing-library/react'
import {ApiProvider, ApiContext} from '../../src'
import '@testing-library/jest-dom'
import {useContext} from 'react'

describe('ApiProvider', () => {
  it('should render children', () => {
    render(
      <ApiProvider url="https://api.example.com">
        <div>Test Child</div>
      </ApiProvider>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide API context', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context ? 'Has Context' : 'No Context'}</div>
    }

    render(
      <ApiProvider url="https://api.example.com">
        <TestComponent/>
      </ApiProvider>
    )

    expect(screen.getByText('Has Context')).toBeInTheDocument()
  })

  it('should create API instance with correct config', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.api ? 'Has API' : 'No API'}</div>
    }

    render(
      <ApiProvider url="https://api.example.com" timeout={5000}>
        <TestComponent/>
      </ApiProvider>
    )

    expect(screen.getByText('Has API')).toBeInTheDocument()
  })

  it('should provide cache', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.cache ? 'Has Cache' : 'No Cache'}</div>
    }

    render(
      <ApiProvider url="https://api.example.com">
        <TestComponent/>
      </ApiProvider>
    )

    expect(screen.getByText('Has Cache')).toBeInTheDocument()
  })

  it('should provide invalidateQuery function', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.invalidateQuery ? 'Has Invalidate' : 'No Invalidate'}</div>
    }

    render(
      <ApiProvider url="https://api.example.com">
        <TestComponent/>
      </ApiProvider>
    )

    expect(screen.getByText('Has Invalidate')).toBeInTheDocument()
  })

  it('should provide invalidateAll function', () => {
    function TestComponent() {
      const context = useContext(ApiContext)
      return <div>{context?.invalidateAll ? 'Has InvalidateAll' : 'No InvalidateAll'}</div>
    }

    render(
      <ApiProvider url="https://api.example.com">
        <TestComponent/>
      </ApiProvider>
    )

    expect(screen.getByText('Has InvalidateAll')).toBeInTheDocument()
  })
})