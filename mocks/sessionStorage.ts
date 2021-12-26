import { createCookieSessionStorage } from '@remix-run/server-runtime'

// You will probably need a sessionStorage to test the strategy.
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb:token',
    secrets: ['s3cr3t'],
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})
