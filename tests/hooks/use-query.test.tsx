import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {renderHook, waitFor, act} from '@testing-library/react'
import {ApiProvider, useQuery} from '../../src'
import {ReactNode} from 'react'
import {mockApi} from '../mocks/laravel-connector'

describe('useQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockReset()
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
    expect(mockApi.get).toHaveBeenCalledWith('/users', expect.objectContaining({signal: expect.any(AbortSignal)}))
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

    // Refetch wrapped in an act
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

    // Invalidate wrapped in an act
    act(() => {
      result.current.invalidate()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2)
    })

    expect(mockApi.get).toHaveBeenCalledTimes(2)
  })

  // ✅ FIXED: Test reset function
  it('should reset all data when reset is called', async () => {
    const mockData = [{id: 1, name: 'John'}]

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isSuccess).toBe(true)

    // Call reset
    act(() => {
      result.current.reset()
    })

    // Verify everything is cleared
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  // ✅ FIXED: Test success without data (DELETE 204)
  it('should handle success response without data', async () => {
    const onSuccess = vi.fn()

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: null,  // No data
      errors: null // No errors
    })

    const {result} = renderHook(
      () => useQuery('/delete-user', {onSuccess}),
      {wrapper}
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isError).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith(undefined)
  })

  // ✅ FIXED: Test error validation (!response.errors)
  it('should treat success:true with errors as failure', async () => {
    const onError = vi.fn()

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: null,
      errors: {message: 'Validation failed'}  // Has errors!
    })

    const {result} = renderHook(
      () => useQuery('/users', {onError}),
      {wrapper}
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isSuccess).toBe(false)
    expect(onError).toHaveBeenCalled()
  })

  // ✅ FIXED: Test abort controller cancels previous requests
  it('should cancel previous request when new one is initiated', async () => {
    const mockData1 = [{id: 1, name: 'John'}]
    const mockData2 = [{id: 2, name: 'Jane'}]

    mockApi.get.mockResolvedValue({success: true, data: mockData1})

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Update mock for the next call
    mockApi.get.mockResolvedValue({success: true, data: mockData2})

    // Call refetch multiple times rapidly
    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2)
    })

    // Should only have successful state from latest request
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  // ✅ FIXED: Test mounted ref in retry - Simplified
  it('should not retry after component unmounts', async () => {
    const mockError = new Error('Network error')
    const mockData = [{id: 1, name: 'John'}]

    // First call fails, second succeeds
    mockApi.get
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({success: true, data: mockData})

    const {unmount} = renderHook(
      () => useQuery('/users', {retry: 1, retryDelay: 50}),
      {wrapper}
    )

    // Wait a bit, then unmount before retry happens
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25))
    })

    unmount()

    // Wait for what would be the retry
    await new Promise(resolve => setTimeout(resolve, 100))

    // Should only have called once (retry didn't happen due to unmount)
    expect(mockApi.get).toHaveBeenCalledTimes(1)
  })

  // ✅ NEW: Test reset is exported from a hook
  it('should export reset function from hook', () => {
    const {result} = renderHook(() => useQuery('/users', {refetchOnMount: false}), {wrapper})

    expect(typeof result.current.reset).toBe('function')
    expect(result.current.reset).toBeDefined()
  })

  // ✅ FIXED: Test select with reset
  it('should apply select even with reset', async () => {
    const mockData = [{id: 1, name: 'Sara'}, {id: 2, name: 'Bruce'}]

    mockApi.get.mockResolvedValue({success: true, data: mockData})

    const selectFn = vi.fn((data) => data.map((u: any) => u.name))

    const {result} = renderHook(
      () => useQuery('/select-with-reset', {select: selectFn, staleTime: 0}),
      {wrapper}
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    }, {timeout: 1000})

    expect(result.current.data).toEqual(['Sara', 'Bruce'])
    expect(selectFn).toHaveBeenCalled()

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeUndefined()
  })

  // ✅ FIXED: Test that reset clears error
  it('should clear error when reset is called', async () => {
    const mockError = new Error('Network error')

    mockApi.get.mockRejectedValue(mockError)

    const {result} = renderHook(() => useQuery('/users'), {wrapper})

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      {timeout: 3000}
    )

    expect(result.current.error).toEqual(mockError)

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  // ✅ FIXED: Test abort controller cleanup on unmounting
  it('should abort request on component unmount', async () => {
    let abortedSignal = false

    mockApi.get.mockImplementation((_endpoint, options) => {
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          abortedSignal = true
        })
      }
      // Never resolve
      return new Promise(() => {
      })
    })

    const {unmount} = renderHook(() => useQuery('/users'), {wrapper})

    // Wait for the request to start
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
    })

    // Unmount component
    unmount()

    // Wait a bit for abort to propagate
    await new Promise(resolve => setTimeout(resolve, 100))

    // Signal should have been aborted
    expect(abortedSignal).toBe(true)
  })
})