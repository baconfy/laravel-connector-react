import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {renderHook, waitFor} from '@testing-library/react'
import {ApiProvider, useMutation} from '../src'
import {createSanctumApi} from 'laravel-connector'
import type {ReactNode} from 'react'
import React from 'react'

// Helper to create a complete Response mock
const createMockResponse = (data: any, status: number, ok: boolean) => {
  const jsonData = JSON.stringify(data)
  return {
    ok,
    status,
    headers: new Headers({'content-type': 'application/json'}),
    json: async () => data,
    text: async () => jsonData,
    blob: async () => new Blob([jsonData]),
    arrayBuffer: async () => new TextEncoder().encode(jsonData).buffer,
    formData: async () => new FormData(),
    clone: function () {
      return this
    },
    body: null,
    bodyUsed: false,
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: ''
  } as Response
}

describe('useMutation', () => {
  let mockApi: ReturnType<typeof createSanctumApi>

  beforeEach(() => {
    mockApi = createSanctumApi({baseUrl: 'https://api.example.com'})
    document.cookie = 'XSRF-TOKEN=test-token'
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({children}: { children: ReactNode }) => (
    <ApiProvider api={mockApi}>{children}</ApiProvider>
  )

  it('should perform POST mutation successfully', async () => {
    const mockResponse = {id: 1, title: 'New Post'}
    const mockBody = {title: 'New Post'}

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true)) // CSRF
      .mockResolvedValueOnce(createMockResponse(mockResponse, 201, true))

    const {result} = renderHook(() => useMutation('/api/posts', 'POST'), {
      wrapper
    })

    expect(result.current.isLoading).toBe(false)

    await result.current.mutate(mockBody)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.errors).toBeNull()
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('should perform PUT mutation successfully', async () => {
    const mockResponse = {id: 1, title: 'Updated Post'}
    const mockBody = {title: 'Updated Post'}

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(mockResponse, 200, true))

    const {result} = renderHook(() => useMutation('/api/posts/1', 'PUT'), {
      wrapper
    })

    // Manually trigger CSRF fetch to populate token
    await mockApi.get('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock only the actual PUT request
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(mockResponse, 200, true))

    await result.current.mutate(mockBody)

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should perform PATCH mutation successfully', async () => {
    const mockResponse = {id: 1, title: 'Patched Post'}
    const mockBody = {title: 'Patched Post'}

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.get('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock only the actual PATCH request
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(mockResponse, 200, true))

    const {result} = renderHook(() => useMutation('/api/posts/1', 'PATCH'), {
      wrapper
    })

    await result.current.mutate(mockBody)

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should perform DELETE mutation successfully', async () => {
    // Simulate CSRF token already fetched
    global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.get('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock only the actual DELETE request
    global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse(null, 204, true))

    const {result} = renderHook(() => useMutation('/api/posts/1', 'DELETE'), {wrapper})

    await result.current.mutate()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeNull()
    })
  })

  it('should handle mutation errors', async () => {
    const errorMessage = 'Validation failed'

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.post('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock the error response
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({message: errorMessage}, 422, false))

    const {result} = renderHook(() => useMutation('/api/posts', 'POST'), {
      wrapper
    })

    await result.current.mutate({title: ''})

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
      expect(result.current.errors).toBe(errorMessage)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isError).toBe(true)
    })
  })

  it('should call onSuccess callback', async () => {
    const mockResponse = {id: 1, title: 'New Post'}
    const onSuccess = vi.fn()

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.post('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock the success response
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(mockResponse, 201, true))

    const {result} = renderHook(
      () => useMutation('/api/posts', 'POST', {onSuccess}),
      {wrapper}
    )

    await result.current.mutate({title: 'New Post'})

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockResponse)
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should call onError callback', async () => {
    const errorMessage = 'Server error'
    const onError = vi.fn()

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.post('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock the error response
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({message: errorMessage}, 500, false))

    const {result} = renderHook(
      () => useMutation('/api/posts', 'POST', {onError}),
      {wrapper}
    )

    await result.current.mutate({title: 'New Post'})

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorMessage)
      expect(result.current.isError).toBe(true)
    })
  })

  it('should call onSettled callback', async () => {
    const onSettled = vi.fn()

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true)) // CSRF
      .mockResolvedValueOnce(createMockResponse({id: 1}, 201, true))

    const {result} = renderHook(
      () => useMutation('/api/posts', 'POST', {onSettled}),
      {wrapper}
    )

    await result.current.mutate({title: 'New Post'})

    await waitFor(() => {
      expect(onSettled).toHaveBeenCalled()
    })
  })

  it('should reset mutation state', async () => {
    const mockResponse = {id: 1, title: 'New Post'}

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate a token
    await mockApi.post('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock the success response
    global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockResponse, 201, true))

    const {result} = renderHook(() => useMutation('/api/posts', 'POST'), {wrapper})

    await result.current.mutate({title: 'New Post'})

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.isSuccess).toBe(true)
    })

    // Reset the state
    result.current.reset()

    await waitFor(() => {
      expect(result.current.data).toBeNull()
      expect(result.current.errors).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  it('should use mutateAsync to return data', async () => {
    const mockResponse = {id: 1, title: 'New Post'}

    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.post('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock the success response
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(mockResponse, 201, true))

    const {result} = renderHook(() => useMutation('/api/posts', 'POST'), {
      wrapper
    })

    const data = await result.current.mutateAsync({title: 'New Post'})

    expect(data).toEqual(mockResponse)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should handle mutation without body (DELETE)', async () => {
    // Simulate CSRF token already fetched
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    // Manually trigger CSRF fetch to populate token
    await mockApi.delete('/sanctum/csrf-cookie')
    vi.clearAllMocks()

    // Now mock only the actual DELETE request
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(null, 204, true))

    const {result} = renderHook(() => useMutation('/api/posts/1', 'DELETE'), {
      wrapper
    })

    await result.current.mutate()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })
})