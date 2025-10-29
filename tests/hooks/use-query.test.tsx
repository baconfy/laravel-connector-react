import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {renderHook, waitFor, act} from '@testing-library/react'
import {ApiProvider, useQuery} from '../../src'
import {ReactNode} from 'react'
import {mockApi} from '../mocks/laravel-connector'

describe('useQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({children}: { children: ReactNode }) => (
    <ApiProvider url="https://api.example.com">
      {children}
    </ApiProvider>
  )

  it('should throw error when used outside ApiProvider', () => {
    expect(() => {
      renderHook(() => useQuery('/users'))
    }).toThrow('useQuery must be used within an ApiProvider')
  })

  it('should fetch data successfully', async () => {
    const mockData = [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(mockData)
    expect(result.current.isError).toBe(false)
    expect(mockApi.get).toHaveBeenCalledWith('/users')
  })

  it('should handle errors', async () => {
    const mockError = new Error('Network error')

    mockApi.get.mockRejectedValueOnce(mockError)

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toEqual(mockError)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should use initial data', () => {
    const initialData = [{id: 1, name: 'John'}]

    const {result} = renderHook(
      () => useQuery('/users', {initialData, refetchOnMount: false}),
      {wrapper}
    )

    expect(result.current.data).toEqual(initialData)
  })

  it('should not fetch when enabled is false', async () => {
    renderHook(() => useQuery('/users', {enabled: false}), {wrapper})

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('should refetch when refetch is called', async () => {
    const mockData1 = [{id: 1, name: 'John'}]
    const mockData2 = [{id: 2, name: 'Jane'}]

    mockApi.get.mockResolvedValue({success: true, data: mockData1})

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData1)

    // Update mock for refetch
    mockApi.get.mockResolvedValue({success: true, data: mockData2})

    // Refetch wrapped in act
    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2)
    })

    expect(mockApi.get).toHaveBeenCalledTimes(2)
  })

  it('should call onSuccess callback', async () => {
    const mockData = [{id: 1, name: 'John'}]
    const onSuccess = vi.fn()

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    renderHook(() => useQuery('/users', {onSuccess}), {wrapper})

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData)
    })
  })

  it('should call onError callback', async () => {
    const mockError = new Error('Network error')
    const onError = vi.fn()

    mockApi.get.mockRejectedValueOnce(mockError)

    renderHook(() => useQuery('/users', {onError}), {wrapper})

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })

    expect(onError).toHaveBeenCalledWith(mockError)
  })

  it('should transform data with select', async () => {
    const mockData = [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(
      () => useQuery('/users', {
        select: (data) => data.map((u: any) => u.name)
      }),
      {wrapper}
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(['John', 'Jane'])
  })

  it('should retry on failure', async () => {
    const mockError = new Error('Network error')
    const mockData = [{id: 1, name: 'John'}]

    // First two calls fail, third succeeds
    mockApi.get
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({success: true, data: mockData})

    const {result} = renderHook(
      () => useQuery('/users', {retry: 2, retryDelay: 50}),
      {wrapper}
    )

    // Should eventually succeed after retries
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    }, {timeout: 3000})

    expect(result.current.data).toEqual(mockData)
    expect(mockApi.get).toHaveBeenCalledTimes(3)
  })

  it('should not fetch on mount when refetchOnMount is false', async () => {
    renderHook(() => useQuery('/users', {refetchOnMount: false}), {wrapper})

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('should set isFetching correctly', async () => {
    const mockData = [{id: 1, name: 'John'}]

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    // Should be fetching initially
    expect(result.current.isFetching).toBe(true)

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })
  })

  it('should invalidate cache', async () => {
    const mockData1 = [{id: 1, name: 'John'}]
    const mockData2 = [{id: 2, name: 'Jane'}]

    mockApi.get.mockResolvedValue({success: true, data: mockData1})

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData1)

    // Update mock for invalidate
    mockApi.get.mockResolvedValue({success: true, data: mockData2})

    // Invalidate wrapped in act
    act(() => {
      result.current.invalidate()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2)
    })

    expect(mockApi.get).toHaveBeenCalledTimes(2)
  })
})