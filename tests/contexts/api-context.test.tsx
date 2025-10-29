import {describe, it, expect} from 'vitest'
import {ApiContext} from '../../src'

describe('ApiContext', () => {
  it('should have displayName', () => {
    expect(ApiContext.displayName).toBe('ApiContext')
  })

  it('should be a valid React Context', () => {
    expect(ApiContext).toBeDefined()
    expect(ApiContext.Provider).toBeDefined()
    expect(ApiContext.Consumer).toBeDefined()
  })
})