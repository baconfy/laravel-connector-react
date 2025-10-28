import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {renderHook, waitFor} from '@testing-library/react'
import {ApiProvider, useMutation} from '../src'
import {createSanctumApi} from 'laravel-connector'
import type {ReactNode} from 'react'
import React from 'react'

describe('useMutation', () => {
  let mockApi: ReturnType<typeof createSanctumApi>

  beforeEach(() => {
    mockApi = createSanctumApi({url: 'https://api.example.com'})
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
      .mockResolvedValueOnce({ok: true, headers: new Headers()}) // CSRF
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => mockResponse
      })

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

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => mockResponse
      })

    const {result} = renderHook(() => useMutation('/api/posts/1', 'PUT'), {
      wrapper
    })

    await result.current.mutate(mockBody)

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse)
    })
  })

  it('should perform PATCH mutation successfully', async () => {
    const mockResponse = {id: 1, title: 'Patched Post'}
    const mockBody = {title: 'Patched Post'}

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => mockResponse
      })

    const {result} = renderHook(() => useMutation('/api/posts/1', 'PATCH'), {
      wrapper
    })

    await result.current.mutate(mockBody)

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse)
    })
  })

  it('should perform DELETE mutation successfully', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => null
      })

    const {result} = renderHook(() => useMutation('/api/posts/1', 'DELETE'), {
      wrapper
    })

    await result.current.mutate()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should handle mutation errors', async () => {
    const errorMessage = 'Validation failed'

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => ({message: errorMessage})
      })

    const {result} = renderHook(() => useMutation('/api/posts', 'POST'), {
      wrapper
    })

    await result.current.mutate({title: ''})

    // Correção: Mover todas as asserções de estado final para dentro do waitFor
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
      expect(result.current.errors).toBe(errorMessage) // O erro esperado agora será capturado
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isError).toBe(true)
    })
  })

  it('should call onSuccess callback', async () => {
    const mockResponse = {id: 1, title: 'New Post'}
    const onSuccess = vi.fn()

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => mockResponse
      })

    const {result} = renderHook(
      () => useMutation('/api/posts', 'POST', {onSuccess}),
      {wrapper}
    )

    await result.current.mutate({title: 'New Post'})

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('should call onError callback', async () => {
    const errorMessage = 'Server error'
    const onError = vi.fn()

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => ({message: errorMessage})
      })

    const {result} = renderHook(
      () => useMutation('/api/posts', 'POST', {onError}),
      {wrapper}
    )

    await result.current.mutate({title: 'New Post'})

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorMessage)
    })
  })

  it('should call onSettled callback', async () => {
    const onSettled = vi.fn()

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => ({id: 1})
      })

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
    const mockResponse = { id: 1, title: 'New Post' }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, headers: new Headers() })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      })

    const { result } = renderHook(() => useMutation('/api/posts', 'POST'), {
      wrapper
    })

    await result.current.mutate({ title: 'New Post' })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse)
    })

    // Use act para garantir que o estado foi atualizado
    await waitFor(() => {
      result.current.reset()
    })

    // Aguarde o reset processar
    await waitFor(() => {
      expect(result.current.data).toBeNull()
    })

    expect(result.current.errors).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should use mutateAsync to return data', async () => {
    const mockResponse = {id: 1, title: 'New Post'}

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => mockResponse
      })

    const {result} = renderHook(() => useMutation('/api/posts', 'POST'), {
      wrapper
    })

    const data = await result.current.mutateAsync({title: 'New Post'})

    expect(data).toEqual(mockResponse)
  })

  it('should handle mutation without body (DELETE)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ok: true, headers: new Headers()})
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({'content-type': 'application/json'}),
        json: async () => null
      })

    const {result} = renderHook(() => useMutation('/api/posts/1', 'DELETE'), {
      wrapper
    })

    await result.current.mutate()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})