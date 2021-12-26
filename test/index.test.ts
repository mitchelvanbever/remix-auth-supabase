import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'whatwg-fetch'

import { SupabaseStrategy } from '../src'
import { password, user } from '../mocks/user'
import { sessionStorage } from '../mocks/sessionStorage'

const SUPABASE_URL = 'http://supabase-url.com/supabase-project'
const SUPABASE_KEY = 'public-supabase-key'

const happyReq = new Request('', {
  body: JSON.stringify({ email: user.email, password }),
  method: 'POST',
})
const faultyReq = new Request('', {
  body: JSON.stringify({ email: 12 }),
  method: 'POST',
})
const faultyCredentialsReq = new Request('', {
  body: JSON.stringify({ email: user.email, password: 'TestPassword@123' }),
  method: 'POST',
})

const verify = vi.fn()

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
    expect.assertions(1)
    await strategy.authenticate(happyReq, sessionStorage, {
      sessionKey: 'sb:token',
    }).then(res => expect(res.email).toBe(user.email))
  })
  it('should handle faulty requests', async() => {
    expect.assertions(1)
    await strategy.authenticate(faultyReq, sessionStorage, {
      sessionKey: 'sb:token',
    }).catch(async e => expect(await e.json()).toEqual({ message: 'Need a valid email and/or password' }))
  })
  it('should handle wrong credentials', async() => {
    expect.assertions(1)
    await strategy.authenticate(faultyCredentialsReq, sessionStorage, {
      sessionKey: 'sb:token',
    }).catch(async e => expect(await e.json()).toEqual({ message: 'Failed to authenticate' }))
  })
})
