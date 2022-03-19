import { createCookieSessionStorage } from 'remix'
import { Authenticator, AuthorizationError } from 'remix-auth'
import { SupabaseStrategy } from 'remix-auth-supabase'
import type { UserSession } from 'remix-auth-supabase'
import { supabaseAdmin } from '~/supabase.server'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: ['s3cr3t'], // This should be an env variable
    secure: process.env.NODE_ENV === 'production',
  },
})

export const magicLinkStrategy = new SupabaseStrategy(
  {
    supabaseClient: supabaseAdmin,
    sessionStorage,
    sessionKey: 'sb:session',
    sessionErrorKey: 'sb:error',
    refreshRoutePath: '/refresh',
    refreshFailureRedirect: '/login',
  },
  async ({ req }) => {
    const form = await req.formData()
    const session = form?.get('session')

    if (typeof session !== 'string')
      throw new AuthorizationError('session not found')

    return JSON.parse(session)
  }
)

export const authenticator = new Authenticator<UserSession>(sessionStorage, {
  sessionKey: magicLinkStrategy.sessionKey,
  sessionErrorKey: magicLinkStrategy.sessionErrorKey,
})

authenticator.use(magicLinkStrategy, 'sb-magic-link')
