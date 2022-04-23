import type { User } from '@supabase/supabase-js'

import { sessionStorage } from '../mocks/sessionStorage'
import { user } from '../mocks/user'
import { SESSION_KEY } from '../mocks/constants'

export interface CookieInit { user: Partial<User>; access_token: string; refresh_token: string }

export const getCookieHeader = async(req: Request, cookie: any) => {
  const session = await sessionStorage.getSession(req.headers.get('Cookie'))
  session.set(SESSION_KEY, cookie)
  return { headers: { 'Set-Cookie': await sessionStorage.commitSession(session) } }
}

export const getSessionFromCookie = async(req: Request) =>
  (await sessionStorage.getSession(req.headers.get('Cookie')))?.data

export const getResWithSession = async(req: Request, cookieInit: CookieInit = { refresh_token: 'valid', access_token: 'valid', user }) =>
  fetch(new Request('https://localhosted:6969/profile',
    { ...(await getCookieHeader(req, cookieInit)) },
  ))
