import { createCookieSessionStorage } from '@remix-run/server-runtime'

// You will probably need a sessionStorage to test the strategy.
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    name: 'sb',
    secrets: ['s3cr3t'],
    maxAge: 60 * 60, // 1 hour
  },
})
