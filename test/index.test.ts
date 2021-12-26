import { createCookieSessionStorage } from '@remix-run/server-runtime'
import { describe, expect, it, vi } from 'vitest'
import 'whatwg-fetch'

import { SupabaseStrategy } from '../src'
import { password, user } from '../mocks/user'

const SUPABASE_URL = 'http://supabase-url.com/supabase-project'
const SUPABASE_KEY = 'public-supabase-key'

const verify = vi.fn()

// You will probably need a sessionStorage to test the strategy.
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb:token',
    secrets: ['s3cr3t'],
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

const strategy = new SupabaseStrategy({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
}, verify)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('SUPABASE_AUTH: general', async() => {
  it('should have the name of the strategy', () => {
    expect(strategy.name).toBe('SUPABASE_AUTH')
  })
  it('should sign in and return the user', async() => {
    const onError = vi.fn()
    try {
      const req = new Request('', { body: JSON.stringify({ email: user.email, password }), method: 'POST' })
      const res = await strategy.authenticate(req, sessionStorage, {
        sessionKey: 'sb:token',
      })
      expect(res.email).toBe(user.email)
    }
    catch (e) {
      onError(e)
    }
    expect(onError).not.toHaveBeenCalled()
  })
  it('should handle faulty requests', async() => {
    const onError = vi.fn()
    try {
      const req = new Request('', { body: JSON.stringify({ email: 12 }), method: 'POST' })
      await strategy.authenticate(req, sessionStorage, {
        sessionKey: 'sb:token',
      })
    }
    catch (e) {
      onError(await e.json())
    }
    expect(onError).toHaveBeenCalledWith({ message: 'Need a valid email and/or password' })
  })
  it('should handle wrong credentials', async() => {
    const onError = vi.fn()
    try {
      const req = new Request('', { body: JSON.stringify({ email: user.email, password: 'TestPassword@123' }), method: 'POST' })
      await strategy.authenticate(req, sessionStorage, {
        sessionKey: 'sb:token',
      })
    }
    catch (e) {
      onError(await e.json())
    }
    expect(onError).toHaveBeenCalledWith({ message: 'Failed to authenticate' })
  })
})
