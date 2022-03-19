import { describe, expect, it } from 'vitest'

import { matchRequestUrl } from 'msw'
import { sessionStorage } from '../mocks/sessionStorage'
import { supabaseStrategy } from '../mocks/authenticator'
import { authenticatedReq } from '../mocks/requests'
import { REFRESH_ROUTE_PATH, SESSION_KEY } from '../mocks/constants'
import { server } from '../mocks/server'
import { validSession } from '../mocks/session'

describe('checkSession', async () => {
  it('should redirect if cookie is not set', async () => {
    expect.assertions(2)
    await supabaseStrategy
      .checkSession(new Request(''), {
        failureRedirect: '/login',
      })
      .catch((res) => {
        expect(res.status).toBe(302)
        expect(res.headers.get('Location')).toEqual('/login')
      })
  })
  it('should return null if no cookie is set', async () => {
    expect.assertions(1)
    await supabaseStrategy
      .checkSession(new Request(''))
      .then((res) => expect(res).toBe(null))
  })
  it('should redirect if cookie is set', async () => {
    expect.assertions(2)
    const req = await authenticatedReq()

    await supabaseStrategy
      .checkSession(req, {
        successRedirect: '/login',
      })
      .catch(async (res) => {
        // should check if the headers are being flashed
        expect(res.headers.get('Set-Cookie')).toBeDefined()
        expect(res.status).toBe(302)
      })
  })
  it('should return session if cookie is set', async () => {
    expect.assertions(1)
    const req = await authenticatedReq()

    await supabaseStrategy
      .checkSession(req, {
        failureRedirect: '/login',
      })
      .then((session) => expect(session).toEqual(validSession))
  })
  it('should redirect to refresh route path if token is expired', async () => {
    expect.assertions(2)
    const req = await authenticatedReq(
      new Request('https://localhost/private'),
      {
        access_token: 'expired',
        refresh_token: 'invalid',
        userId: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
      }
    )

    await supabaseStrategy.checkSession(req).catch((res) => {
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toEqual(
        `${REFRESH_ROUTE_PATH}?redirectTo=%2Fprivate`
      )
    })
  })
})
