import type { CookieInit } from '../test/utils'
import { getResWithSession } from '../test/utils'

export const req = new Request('')

export const authenticatedReq = async(init: Request = req, cookieInit?: CookieInit) => {
  const res = await getResWithSession(init, cookieInit)

  const headersInit: HeadersInit | undefined = res?.headers?.get('Cookie') ? { Cookie: res.headers.get('Cookie') as string } : undefined

  return new Request(init, { headers: headersInit })
}
