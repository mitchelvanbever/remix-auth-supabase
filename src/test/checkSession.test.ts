import { user } from '../mocks/user'
import { sessionStorage } from '../mocks/sessionStorage'
import { supabaseStrategy } from '../mocks/authenticator'
import { authenticatedReq } from '../mocks/requests'
import { SESSION_KEY } from '../mocks/constants'
import { validResponse } from '../mocks/handlers'

describe('[external export] revalidate', async() => {
  it('should redirect if cookie is not set', async() => {
    expect.assertions(1)
    await supabaseStrategy.checkSession(new Request(''),
      {
        failureRedirect: '/login',
      },
    ).catch(res => expect(res.status).toBe(302))
  })
  it('should return null if no cookie is set', async() => {
    expect.assertions(1)
    await supabaseStrategy.checkSession(new Request(''),
    ).then(res => expect(res).toBe(null))
  })
  it('should redirect if cookie is set', async() => {
    expect.assertions(2)
    const req = await authenticatedReq()

    await supabaseStrategy.checkSession(req,
      {
        successRedirect: '/login',
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

    await supabaseStrategy.checkSession(req,
      {
        failureRedirect: '/login',
      },
    ).then(session => expect(session).toEqual(validResponse))
  })
  it('should return null if refresh token fails', async() => {
    expect.assertions(1)
    const req = await authenticatedReq(new Request('https://localhost'),
      {
        user,
        access_token: 'expired',
        refresh_token: 'invalid',
      })

    await supabaseStrategy.checkSession(req,
    ).then(res => expect(res).toBe(null))
  })
  it('should refresh the token with a valid refresh token', async() => {
    expect.assertions(3)
    const req = await authenticatedReq(new Request('https://localhost/profile'),
      {
        user,
        access_token: 'expired',
        refresh_token: 'valid',
      })

    await supabaseStrategy.checkSession(req,
    ).catch(async(error) => {
      const cookies = (await sessionStorage.getSession(error.headers.get('Set-Cookie')))?.data
      expect(cookies?.[SESSION_KEY]).toEqual(validResponse)
      expect(error.status).toEqual(302)
      expect(error.headers.get('Location')).toEqual('/profile')
    })
  })
  it('should refresh the token with a valid refresh token and redirect is successRedirect is set', async() => {
    expect.assertions(3)
    const req = await authenticatedReq(new Request('https://localhost'),
      {
        user,
        access_token: 'expired',
        refresh_token: 'valid',
      })

    await supabaseStrategy.checkSession(req, { successRedirect: '/dashboard' },
    ).catch(async(error) => {
      const cookies = (await sessionStorage.getSession(error.headers.get('Set-Cookie')))?.data
      expect(cookies?.[SESSION_KEY]).toEqual(validResponse)
      expect(error.status).toEqual(302)
      expect(error.headers.get('Location')).toEqual('/dashboard')
    })
  })
})
