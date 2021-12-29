import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Authenticator } from 'remix-auth'
import type { Session } from '@supabase/supabase-js'
import { SupabaseStrategy } from '../src'
import { password, user } from '../mocks/user'
import { sessionStorage } from '../mocks/sessionStorage'

const SUPABASE_URL = 'http://supabase-url.com/supabase-project'
const SUPABASE_KEY = 'public-supabase-key'

export const authenticator = new Authenticator<Session>(sessionStorage, { sessionKey: 'session', sessionErrorKey: 'session-error' })

authenticator.use(
  // @ts-expect-error it wants verify but we don't use it
  new SupabaseStrategy({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
  }),
  'supabase',
)

// simple helper to set session cookie
const getCookieHeader = async(req: Request) => {
  const session = await sessionStorage.getSession(req.headers.get('Cookie'))
  session.set('session', user)
  return { headers: { 'Set-Cookie': await sessionStorage.commitSession(session) } }
}

// simple helper to get session cookie
const getSessionFromCookie = async(res: Response) => (await sessionStorage.getSession(res.headers.get('Cookie')))?.data

beforeEach(() => {
  vi.resetAllMocks()
})

describe('authenticate', async() => {
  it('should handle faulty requests', async() => {
    const fData = new FormData()
    fData.append('email', user.email)

    expect.assertions(1)

    await authenticator.authenticate('supabase', new Request('',
      {
        method: 'POST',
        body: fData,
      },
    ),
    ).catch(async e =>
      expect(await e.json()).toEqual({ message: 'Need a valid email and/or password' }),
    )
  })
  it('should handle wrong credentials', async() => {
    const fData = new FormData()
    fData.append('email', user.email)
    fData.append('password', 'WrongPassword123')

    expect.assertions(1)
    await authenticator.authenticate('supabase', new Request('',
      {
        method: 'POST',
        body: fData,
      },
    ),
    ).catch(async e =>
      expect(await e.json()).toEqual({ message: 'Wrong email or password' }))
  })
  it('should sign in and return the user', async() => {
    const fData = new FormData()

    fData.append('email', user.email)
    fData.append('password', password)

    expect.assertions(1)
    await authenticator.authenticate('supabase', new Request('',
      {
        method: 'POST',
        body: fData,
      },
    ),
    ).then(res => expect(res?.user?.email).toBe(user.email))
  })
})

describe('isAuthenticated', async() => {
  it('should return the user', async() => {
    const req = new Request('')
    const cookieHeaders = await getCookieHeader(req)
    const res = await fetch(new Request('https://localhosted:6969/profile', { ...cookieHeaders })) // mimic authenticated cookieHeaders

    // determine the response has been set with the correct cookie
    const sesh = await getSessionFromCookie(res)
    expect(sesh).toEqual({ session: user })

    // @ts-expect-error would normally be a request
    const isAuthenticated = await authenticator.isAuthenticated(res)
    expect(isAuthenticated).not.toBe(null)
  })
})
