import { describe, expect, it } from 'vitest'

import { user } from '../mocks/user'
import { sessionStorage } from '../mocks/sessionStorage'
import { supabaseStrategy } from '../mocks/authenticator'
import { authenticatedReq } from '../mocks/requests'
import { SESSION_ERROR_KEY, SESSION_KEY } from '../mocks/constants'

describe('[external export] revalidate', async() => {
  it('should redirect if cookie is not set', async() => {
    expect.assertions(1)
    await supabaseStrategy.checkSession(new Request(''), sessionStorage,
      {
        sessionKey: SESSION_KEY,
        failureRedirect: '/login',
        sessionErrorKey: SESSION_ERROR_KEY,
      },
    ).catch(res => expect(res.status).toBe(302))
  })
  it('should return null if no cookie is set', async() => {
    expect.assertions(1)
    await supabaseStrategy.checkSession(new Request(''), sessionStorage,
      {
        sessionKey: SESSION_KEY,
        sessionErrorKey: SESSION_ERROR_KEY,
      },
    ).then(res => expect(res).toBe('No session data found'))
  })
  it('should redirect if cookie is set', async() => {
    expect.assertions(2)
    const req = await authenticatedReq()

    await supabaseStrategy.checkSession(req, sessionStorage,
      {
        sessionKey: SESSION_KEY,
        successRedirect: '/login',
        sessionErrorKey: SESSION_ERROR_KEY,
      },
    ).catch(async(res) => {
      // should check if the headers are being flashed
      expect(res.headers.get('Set-Cookie')).toBeDefined()
      expect(res.status).toBe(302)
    })
  })
  it('should return session if cookie is set', async() => {
    expect.assertions(1)
    const req = await authenticatedReq()

    await supabaseStrategy.checkSession(req, sessionStorage,
      {
        sessionKey: SESSION_KEY,
        failureRedirect: '/login',
        sessionErrorKey: SESSION_ERROR_KEY,
      },
    ).then(session =>
      expect(session?.user?.user?.email).toBe(user.email),
    )
  })
  it('should refresh the token with a valid refresh token', async() => {
    const req = await authenticatedReq(new Request(''),
      {
        user,
        access_token: 'expired',
        refresh_token: 'valid',
      })

    const session = await supabaseStrategy.checkSession(req, sessionStorage,
      {
        sessionKey: SESSION_KEY,
        sessionErrorKey: SESSION_ERROR_KEY,
      },
    )

    expect(session?.user?.email).toBe(user.email)
  })
})
