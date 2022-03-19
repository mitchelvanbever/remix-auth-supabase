import { Authenticator, AuthorizationError } from 'remix-auth'
import type { UserSession, VerifyParams } from '..'
import { SupabaseStrategy } from '..'
import {
  REFRESH_FAILURE_REDIRECT,
  REFRESH_ROUTE_PATH,
  SESSION_ERROR_KEY,
  SESSION_KEY,
} from './constants'
import { sessionStorage } from './sessionStorage'
import { supabaseClient } from './supabase'

export const verify = async ({ req, supabaseClient }: VerifyParams) => {
  const form = await req.formData()
  const email = form.get('email')
  const password = form.get('password')

  if (
    !email ||
    typeof email !== 'string' ||
    !password ||
    typeof password !== 'string'
  )
    throw new Error('Need a valid email and/or password')

  return supabaseClient.auth.api
    .signInWithEmail(email, password)
    .then(({ data, error }) => {
      if (error || !data) {
        throw new AuthorizationError(error?.message ?? 'No user session found')
      }

      return data
    })
}

export const supabaseStrategy = new SupabaseStrategy(
  {
    supabaseClient,
    sessionStorage,
    refreshFailureRedirect: REFRESH_FAILURE_REDIRECT,
    refreshRoutePath: REFRESH_ROUTE_PATH,
    sessionErrorKey: SESSION_ERROR_KEY,
    sessionKey: SESSION_KEY,
  },
  verify
)

export const authenticator = new Authenticator<UserSession>(sessionStorage, {
  sessionKey: SESSION_KEY,
  sessionErrorKey: SESSION_ERROR_KEY,
})

authenticator.use(supabaseStrategy)
