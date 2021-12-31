import { describe, expect, it } from 'vitest'

import { Authenticator } from 'remix-auth'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { SupabaseStrategy } from '../src'
import { password, user } from '../mocks/user'
import { sessionStorage } from '../mocks/sessionStorage'

const SUPABASE_URL = 'http://supabase-url.com/supabase-project'
const SUPABASE_KEY = 'public-supabase-key'

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {},
)

const verify = ({ form }: { form?: FormData }) => {
  const email = form.get('email')
  const password = form.get('password')
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
    throw new Error('Need a valid email and/or password')

  return supabaseClient.auth.api.signInWithEmail(email, password).then((res) => {
    if (res?.error || !res.data)
      throw new Error(res?.error?.message ?? 'No user found')

    return res?.data
  })
}

const supabaseStrategy = new SupabaseStrategy({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
}, verify)

const authenticator = new Authenticator<Session>(sessionStorage, { sessionKey: 'session', sessionErrorKey: 'session-error' })

authenticator.use(supabaseStrategy)

const getCookieHeader = async(req: Request) => {
  const session = await sessionStorage.getSession(req.headers.get('Cookie'))
  session.set('session', { refresh_token: 'test-token', access_token: 'test-token', user })
  return { headers: { 'Set-Cookie': await sessionStorage.commitSession(session) } }
}

const getSessionFromCookie = async(req: Request) => (await sessionStorage.getSession(req.headers.get('Cookie')))?.data

const getReqWithSession = async() =>
  fetch(
    new Request('https://localhosted:6969/profile',
      {
        ...(await getCookieHeader(new Request(''))),
      },
    ))

describe('authenticate', async() => {
  it('should handle faulty requests', async() => {
    const fData = new FormData()
    fData.append('email', user.email)

    expect.assertions(1)

    await authenticator.authenticate('sb', new Request('',
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
    await authenticator.authenticate('sb', new Request('',
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
    await authenticator.authenticate('sb', new Request('',
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
    const res = await getReqWithSession()
    const subsequentReq = new Request('', { headers: { Cookie: res.headers.get('Cookie') } })

    const sesh = await getSessionFromCookie(subsequentReq)
    expect(sesh).toEqual({
      session: {
        user,
        access_token: 'test-token',
        refresh_token: 'test-token',
      },
    })

    const isAuthenticated = await authenticator.isAuthenticated(subsequentReq)
    expect(isAuthenticated).not.toBe(null)
  })
})

describe('[external export] revalidate', async() => {
  it('should return the user with a valid access token', async() => {
    const res = await getReqWithSession()
    const req = new Request('', { headers: { Cookie: res.headers.get('Cookie') } })

    const session = await supabaseStrategy.checkSession(
      req,
      sessionStorage,
      {
        sessionKey: 'sb:session',
        sessionErrorKey: 'sb:error',
        failureRedirect: '/login',
      },
    )

    expect(session?.user?.email).toBe(user.email)
  })
  it.todo('should refresh the token with a valid refresh token')
  it.todo('should redirect when no user could be found')
})
