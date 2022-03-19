import { sessionStorage } from '../mocks/sessionStorage'
import { SESSION_KEY } from '../mocks/constants'

export interface CookieInit {
  access_token?: string
  refresh_token?: string
  userId?: string
}

export const getCookieHeader = async (req: Request, cookie: any) => {
  const session = await sessionStorage.getSession(req.headers.get('Cookie'))
  session.set(SESSION_KEY, cookie)
  return {
    headers: { 'Set-Cookie': await sessionStorage.commitSession(session) },
  }
}

export const getSessionFromCookie = async (req: Request) =>
  (await sessionStorage.getSession(req.headers.get('Cookie')))?.data

export const getResWithSession = async (
  req: Request,
  cookieInit: CookieInit = {
    refresh_token: 'valid',
    access_token: 'valid',
    userId: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
  }
) =>
  fetch(
    new Request('https://localhosted:6969/profile', {
      ...(await getCookieHeader(req, cookieInit)),
    })
  )
