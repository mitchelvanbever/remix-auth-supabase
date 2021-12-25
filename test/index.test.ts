import { describe, expect, it, vi } from 'vitest'
import { createCookieSessionStorage } from '@remix-run/server-runtime'
import { MyStrategy } from '../src'

describe('MyStrategy', () => {
  const verify = vi.fn()
  // You will probably need a sessionStorage to test the strategy.
  const sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ['s3cr3t'] },
  })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should have the name of the strategy', () => {
    const strategy = new MyStrategy({ something: 'You may need' }, verify)
    expect(strategy.name).toBe('change-me')
  })

  it.todo('Write more tests to check everything works as expected')
})
