import type { HeadersInit } from '@remix-run/node';
import type { CookieInit } from '../test/utils';
import { getResWithSession } from '../test/utils';

const mockUrl = new URL('/test/authenticated', 'http://localhost');
export const req = new Request(mockUrl);

export const authenticatedReq = async (init: Request = req, cookieInit?: CookieInit) => {
  const res = await getResWithSession(init, cookieInit);

  const headersInit: HeadersInit | undefined = res?.headers?.get('Cookie')
    ? { Cookie: res.headers.get('Cookie') as string }
    : undefined;

  return new Request(init, { headers: headersInit });
};
