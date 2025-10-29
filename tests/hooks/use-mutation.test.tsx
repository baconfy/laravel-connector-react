import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {renderHook, act} from '@testing-library/react'
import {useMutation} from '../../src/hooks/use-mutation'
import {ApiProvider} from '../../src'
import {ReactNode} from 'react'
import {mockApi} from '../mocks/laravel-connector'

describe('useMutation', () => {
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
      renderHook(() => useMutation('/users', 'POST'))
    }).toThrow('useApi must be used within an ApiProvider')
  })

  it('should execute POST mutation successfully', async () => {
    const mockData = {id: 1, name: 'John'}
    const variables = {name: 'John', email: 'john@example.com'}

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useMutation('/users', 'POST'), {wrapper})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()

    let response
    await act(async () => {
      response = await result.current.mutate(variables)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(mockData)
    expect(mockApi.post).toHaveBeenCalledWith('/users', variables)
    expect(response).toEqual({success: true, data: mockData})
  })

  it('should execute PUT mutation successfully', async () => {
    const mockData = {id: 1, name: 'John Updated'}
    const variables = {name: 'John Updated'}

    mockApi.put.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useMutation('/users/1', 'PUT'), {wrapper})

    await act(async () => {
      await result.current.mutate(variables)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockData)
    expect(mockApi.put).toHaveBeenCalledWith('/users/1', variables)
  })

  it('should execute PATCH mutation successfully', async () => {
    const mockData = {id: 1, name: 'John Patched'}
    const variables = {name: 'John Patched'}

    mockApi.patch.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useMutation('/users/1', 'PATCH'), {wrapper})

    await act(async () => {
      await result.current.mutate(variables)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockData)
    expect(mockApi.patch).toHaveBeenCalledWith('/users/1', variables)
  })

  it('should execute DELETE mutation successfully', async () => {
    mockApi.delete.mockResolvedValueOnce({
      success: true,
      data: {message: 'Deleted'}
    })

    const {result} = renderHook(() => useMutation('/users/1', 'DELETE'), {wrapper})

    await act(async () => {
      await result.current.mutate({})
    })

    expect(result.current.isSuccess).toBe(true)
    expect(mockApi.delete).toHaveBeenCalledWith('/users/1')
  })

  it('should handle errors', async () => {
    const mockError = new Error('Network error')

    mockApi.post.mockRejectedValueOnce(mockError)

    const {result} = renderHook(() => useMutation('/users', 'POST'), {wrapper})

    await act(async () => {
      try {
        await result.current.mutate({name: 'John'})
      } catch (err) {
        // Expected to throw
      }
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toEqual(mockError)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should call onSuccess callback', async () => {
    const mockData = {id: 1, name: 'John'}
    const variables = {name: 'John'}
    const onSuccess = vi.fn()

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(
      () => useMutation('/users', 'POST', {onSuccess}),
      {wrapper}
    )

    await act(async () => {
      await result.current.mutate(variables)
    })

    expect(onSuccess).toHaveBeenCalledWith(mockData, variables)
  })

  it('should call onError callback', async () => {
    const mockError = new Error('Network error')
    const variables = {name: 'John'}
    const onError = vi.fn()

    mockApi.post.mockRejectedValueOnce(mockError)

    const {result} = renderHook(
      () => useMutation('/users', 'POST', {onError}),
      {wrapper}
    )

    await act(async () => {
      try {
        await result.current.mutate(variables)
      } catch (err) {
        // Expected to throw
      }
    })

    expect(onError).toHaveBeenCalledWith(mockError, variables)
  })

  it('should call onSettled callback on success', async () => {
    const mockData = {id: 1, name: 'John'}
    const variables = {name: 'John'}
    const onSettled = vi.fn()

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(
      () => useMutation('/users', 'POST', {onSettled}),
      {wrapper}
    )

    await act(async () => {
      await result.current.mutate(variables)
    })

    expect(onSettled).toHaveBeenCalledWith(mockData, null, variables)
  })

  it('should call onSettled callback on error', async () => {
    const mockError = new Error('Network error')
    const variables = {name: 'John'}
    const onSettled = vi.fn()

    mockApi.post.mockRejectedValueOnce(mockError)

    const {result} = renderHook(
      () => useMutation('/users', 'POST', {onSettled}),
      {wrapper}
    )

    await act(async () => {
      try {
        await result.current.mutate(variables)
      } catch (err) {
        // Expected to throw
      }
    })

    expect(onSettled).toHaveBeenCalledWith(undefined, mockError, variables)
  })

  // TODO: Fix retry test - the retry logic works but test is flaky
  it('should retry on failure and eventually succeed', async () => {
    const mockData = {id: 1, name: 'John'}
    const variables = {name: 'John'}
    let attemptCount = 0

    // Mock that fails twice then succeeds
    mockApi.post.mockImplementation(async () => {
      attemptCount++
      if (attemptCount <= 2) {
        throw new Error('Network error')
      }
      return {success: true, data: mockData}
    })

    const {result} = renderHook(
      () => useMutation('/users', 'POST', {retry: 2, retryDelay: 10}),
      {wrapper}
    )

    // Execute mutation with retries
    let response
    await act(async () => {
      response = await result.current.mutate(variables)
    })

    // Should succeed after retries
    expect(attemptCount).toBe(3) // Called 3 times total
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toEqual(mockData)
    expect(response).toEqual({success: true, data: mockData})
  })

  it('should reset state', async () => {
    const mockData = {id: 1, name: 'John'}

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useMutation('/users', 'POST'), {wrapper})

    await act(async () => {
      await result.current.mutate({name: 'John'})
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isSuccess).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should use mutateAsync', async () => {
    const mockData = {id: 1, name: 'John'}

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const {result} = renderHook(() => useMutation('/users', 'POST'), {wrapper})

    let response
    await act(async () => {
      response = await result.current.mutateAsync({name: 'John'})
    })

    expect(response).toEqual({success: true, data: mockData})
    expect(result.current.data).toEqual(mockData)
  })
})