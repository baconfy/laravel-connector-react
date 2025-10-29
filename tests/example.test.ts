import {describe, it, expect} from 'vitest'

describe('Test Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true)
  })

  it('should have vitest working', () => {
    const sum = (a: number, b: number) => a + b
    expect(sum(2, 3)).toBe(5)
  })
})