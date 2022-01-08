import type { AuthSession } from '@supabase/supabase-js'
import { Authenticator } from 'remix-auth'
import type { VerifyParams } from '..'
import { SupabaseStrategy } from '..'
import { SESSION_ERROR_KEY, SESSION_KEY } from './constants'
import { sessionStorage } from './sessionStorage'
import { supabaseClient } from './supabase'

export const verify = async({ req, supabaseClient }: VerifyParams) => {
  const form = await req.formData()
  const email = form.get('email')
  const password = form.get('password')

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
    throw new Error('Need a valid email and/or password')

  return supabaseClient.auth.api.signInWithEmail(email, password).then((res) => {
    if (res?.error || !res.data) throw new Error(res?.error?.message ?? 'No user found')
    return res?.data
  })
}

export const supabaseStrategy = new SupabaseStrategy({
  supabaseClient,
  sessionStorage,
}, verify)

export const authenticator = new Authenticator<AuthSession>(
  sessionStorage,
  {
    sessionKey: SESSION_KEY, sessionErrorKey: SESSION_ERROR_KEY,
  })

authenticator.use(supabaseStrategy)
