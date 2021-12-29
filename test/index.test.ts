import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SupabaseStrategy } from '../src'
import { password, user } from '../mocks/user'
import { sessionStorage } from '../mocks/sessionStorage'

const SUPABASE_URL = 'http://supabase-url.com/supabase-project'
const SUPABASE_KEY = 'public-supabase-key'

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
    const fData = new FormData()

    fData.append('email', user.email)
    fData.append('password', password)

    expect.assertions(1)
    await strategy.authenticate(new Request('',
      {
        method: 'POST',
        body: fData,
      },
    ),
    sessionStorage,
    { sessionKey: 'session', throwOnError: false },
    ).then(res => expect(res?.user?.email).toBe(user.email))
  })
  it('should handle faulty requests', async() => {
    const fData = new FormData()
    fData.append('email', user.email)

    expect.assertions(1)

    await strategy.authenticate(new Request('',
      {
        method: 'POST',
        body: fData,
      },
    ),
    sessionStorage,
    {},
    ).catch(async e =>
      expect(await e.json()).toEqual({ message: 'Need a valid email and/or password' }))
  })
  it('should handle wrong credentials', async() => {
    const fData = new FormData()
    fData.append('email', user.email)
    fData.append('password', 'WrongPassword123')

    expect.assertions(1)
    await strategy.authenticate(new Request('',
      {
        method: 'POST',
        body: fData,
      },
    ),
    sessionStorage,
    {},
    ).catch(async e =>
      expect(await e.json()).toEqual({ message: 'Wrong email or password' }))
  })
})
