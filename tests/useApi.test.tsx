import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {renderHook, waitFor} from '@testing-library/react'
import {ApiProvider, useApi} from '../src'
import {createSanctumApi} from 'laravel-connector'
import type {ReactNode} from 'react'
import React from 'react'

describe('useApi', () => {
  let mockApi: ReturnType<typeof createSanctumApi>

  beforeEach(() => {
    mockApi = createSanctumApi({baseUrl: 'https://api.example.com'})
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({children}: { children: ReactNode }) => (
    <ApiProvider api={mockApi}>{children}</ApiProvider>
  )

  it('should fetch data successfully', async () => {
    const mockData = {id: 1, name: 'Test'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    const {result} = renderHook(() => useApi('/api/posts'), {wrapper})

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.errors).toBeNull()
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it('should handle errors correctly', async () => {
    const errorMessage = 'Not found'

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => ({message: errorMessage})
    })

    const {result} = renderHook(() => useApi('/api/posts/999'), {wrapper})

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.errors).toBe(errorMessage)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(true)
  })

  it('should not fetch when enabled is false', async () => {
    const mockData = {id: 1, name: 'Test'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    const {result} = renderHook(
      () => useApi('/api/posts', {enabled: false}),
      {wrapper}
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should call onSuccess callback when fetch succeeds', async () => {
    const mockData = {id: 1, name: 'Test'}
    const onSuccess = vi.fn()

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    renderHook(() => useApi('/api/posts', {onSuccess}), {wrapper})

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData)
    })
  })

  it('should call onError callback when fetch fails', async () => {
    const errorMessage = 'Server error'
    const onError = vi.fn()

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => ({message: errorMessage})
    })

    renderHook(() => useApi('/api/posts', {onError}), {wrapper})

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorMessage)
    })
  })

  it('should refetch data when refetch is called', async () => {
    const mockData = {id: 1, name: 'Test'}
    const mockDataRefetch = {id: 2, name: 'Refetched'} // Novo dado para a refetch

    const fetchMock = vi.fn() as any;
    global.fetch = fetchMock;

    // Mock response for initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })
    // Mock response for refetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockDataRefetch
    })

    const {result} = renderHook(() => useApi('/api/posts'), {wrapper})

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual(mockData)
      expect((global.fetch as any).mock.calls.length).toBe(1)
    })

    await result.current.refetch()

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBe(2)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual(mockDataRefetch)
    })
  })

  it('should mutate data optimistically', async () => {
    const mockData = {id: 1, name: 'Test'}
    const newData = {id: 1, name: 'Updated'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    const {result} = renderHook(() => useApi('/api/posts/1'), {wrapper})

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })

    // Call mutate
    result.current.mutate(newData)

    // Wait for state update
    await waitFor(() => {
      expect(result.current.data).toEqual(newData)
    })
  })

  it('should add query params to request', async () => {
    const mockData = [{id: 1}]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    renderHook(
      () =>
        useApi('/api/posts', {
          params: {page: 1, limit: 10}
        }),
      {wrapper}
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/posts?page=1&limit=10',
        expect.any(Object)
      )
    })
  })

  it('should setup refetch interval when provided', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    const mockData = {id: 1, name: 'Test'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    const {unmount} = renderHook(
      () => useApi('/api/posts', {refetchInterval: 5000}),
      {wrapper}
    )

    // Wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify the interval was set with the correct time (5000 ms)
    await waitFor(() => {
      const intervalCalls = setIntervalSpy.mock.calls.filter(
        call => call[1] === 5000
      )
      expect(intervalCalls.length).toBeGreaterThan(0)
    })

    // Cleanup and verify interval was cleared
    unmount()

    await waitFor(() => {
      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  it('should not setup refetch interval when not provided', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')

    const mockData = {id: 1, name: 'Test'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    renderHook(() => useApi('/api/posts'), {wrapper})

    // Wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify NO interval was set with our custom interval
    const customIntervalCalls = setIntervalSpy.mock.calls.filter(
      call => call[1] !== 50 // Filter out waitFor's internal intervals
    )
    expect(customIntervalCalls.length).toBe(0)

    setIntervalSpy.mockRestore()
  })

  it('should register window focus listener when refetchOnWindowFocus is true', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const mockData = {id: 1, name: 'Test'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    const {unmount} = renderHook(
      () => useApi('/api/posts', {refetchOnWindowFocus: true}),
      {wrapper}
    )

    // Wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify focus listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function))

    // Unmount and verify cleanup
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function))

    // Restore spies
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('should not register window focus listener when refetchOnWindowFocus is false', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    const mockData = {id: 1, name: 'Test'}

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({'content-type': 'application/json'}),
      json: async () => mockData
    })

    renderHook(
      () => useApi('/api/posts', {refetchOnWindowFocus: false}),
      {wrapper}
    )

    // Wait for initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify focus listener was NOT added
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('focus', expect.any(Function))

    addEventListenerSpy.mockRestore()
  })
})