import type { CookieInit } from '../test/utils'
import { getResWithSession } from '../test/utils'

export const req = new Request('')

export const authenticatedReq = async(init: Request = req, cookieInit?: CookieInit) => {
  const res = await getResWithSession(init, cookieInit)

  return new Request('', { headers: { Cookie: res.headers.get('Cookie') } })
}
