import { describe, expect, it } from 'vitest'

import { matchRequestUrl } from 'msw'
import { sessionStorage } from '../mocks/sessionStorage'
import { supabaseStrategy } from '../mocks/authenticator'
import { authenticatedReq } from '../mocks/requests'
import {
  REFRESH_FAILURE_REDIRECT,
  REFRESH_ROUTE_PATH,
  SESSION_KEY,
} from '../mocks/constants'
import { server } from '../mocks/server'
import { validSession } from '../mocks/session'

describe('refreshToken', async () => {
  it('should refresh the token with a valid refresh token and redirect', async () => {
    expect.assertions(3)
    const req = await authenticatedReq(
      new Request(
        `https://localhost${REFRESH_ROUTE_PATH}?redirectTo=%2Fprofile`
      ),
      {
        access_token: 'expired',
        refresh_token: 'valid',
        userId: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
      }
    )

    await supabaseStrategy.refreshToken(req).catch(async (res) => {
      const cookies = (
        await sessionStorage.getSession(res.headers.get('Set-Cookie'))
      )?.data
      expect(cookies?.[SESSION_KEY]).toEqual(validSession)
      expect(res.status).toEqual(302)
      expect(res.headers.get('Location')).toEqual('/profile')
    })
  })

  it('should redirect if missing redirectTo', async () => {
    expect.assertions(4)

    const sendRequests = new Map()

    server.events.on('request:start', (req) => {
      const matchesMethod = req.method === 'POST'
      const matchesUrl = matchRequestUrl(
        req.url,
        '/supabase-project/auth/v1/token?grant_type=refresh_token',
        'http://supabase-url.com'
      ).matches

      if (matchesMethod && matchesUrl) sendRequests.set(req.id, req)
    })

    const currentSession = {
      access_token: 'expired',
      refresh_token: 'valid',
      expires_at: -1,
      userId: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
    }
    const req = await authenticatedReq(
      new Request(`https://localhost${REFRESH_ROUTE_PATH}`),
      currentSession
    )

    await supabaseStrategy.refreshToken(req).catch(async (res) => {
      const cookies = (
        await sessionStorage.getSession(res.headers.get('Set-Cookie'))
      )?.data
      expect(cookies?.[SESSION_KEY]).toEqual(currentSession)
      expect(res.status).toEqual(302)
      expect(res.headers.get('Location')).toEqual(REFRESH_FAILURE_REDIRECT)
    })

    server.events.removeAllListeners()

    expect(sendRequests.size).toEqual(0)
  })

  it('should redirect if no refresh_token found in session', async () => {
    expect.assertions(4)

    const sendRequests = new Map()

    server.events.on('request:start', (req) => {
      const matchesMethod = req.method === 'POST'
      const matchesUrl = matchRequestUrl(
        req.url,
        '/supabase-project/auth/v1/token?grant_type=refresh_token',
        'http://supabase-url.com'
      ).matches

      if (matchesMethod && matchesUrl) sendRequests.set(req.id, req)
    })

    const currentSession = {
      access_token: 'expired',
      expires_at: -1,
      userId: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
    }
    const req = await authenticatedReq(
      new Request(
        `https://localhost${REFRESH_ROUTE_PATH}?redirectTo=%2Fprofile`
      ),
      currentSession
    )

    await supabaseStrategy.refreshToken(req).catch(async (res) => {
      const cookies = (
        await sessionStorage.getSession(res.headers.get('Set-Cookie'))
      )?.data
      expect(cookies?.[SESSION_KEY]).toEqual(currentSession)
      expect(res.status).toEqual(302)
      expect(res.headers.get('Location')).toEqual(REFRESH_FAILURE_REDIRECT)
    })

    server.events.removeAllListeners()

    expect(sendRequests.size).toEqual(0)
  })

  it('should redirect and destroy session if unable to refresh token', async () => {
    expect.assertions(4)

    const sendRequests = new Map()

    server.events.on('request:start', (req) => {
      const matchesMethod = req.method === 'POST'
      const matchesUrl = matchRequestUrl(
        req.url,
        '/supabase-project/auth/v1/token?grant_type=refresh_token',
        'http://supabase-url.com'
      ).matches

      if (matchesMethod && matchesUrl) sendRequests.set(req.id, req)
    })

    const currentSession = {
      access_token: 'expired',
      refresh_token: 'invalid',
      expires_at: -1,
      userId: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
    }
    const req = await authenticatedReq(
      new Request(
        `https://localhost${REFRESH_ROUTE_PATH}?redirectTo=%2Fprofile`
      ),
      currentSession
    )

    await supabaseStrategy.refreshToken(req).catch(async (res) => {
      const cookies = (
        await sessionStorage.getSession(res.headers.get('Set-Cookie'))
      )?.data
      expect(cookies?.[SESSION_KEY]).toBeUndefined()
      expect(res.status).toEqual(302)
      expect(res.headers.get('Location')).toEqual(REFRESH_FAILURE_REDIRECT)
    })

    server.events.removeAllListeners()

    expect(sendRequests.size).toEqual(1)
  })
})
