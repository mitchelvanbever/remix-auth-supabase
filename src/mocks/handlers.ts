import { rest } from 'msw'
import { user, password as userPassword } from './user'

export const validResponse = {
  refresh_token: 'valid', access_token: 'valid', user,
}

export const handlers = [
  rest.post('http://supabase-url.com/supabase-project/auth/v1/token', async(req, res, ctx) => {
    const { email, password, refresh_token } = JSON.parse(req.body as string)

    if (refresh_token) {
      if (refresh_token !== 'valid') return res(ctx.status(401), ctx.json({ error: 'Token expired' }))
      return res(ctx.status(200), ctx.json(validResponse))
    }

    if (!email || !password || password !== userPassword)
      return res(ctx.status(401), ctx.json({ message: 'Wrong email or password' }))
    return res(ctx.status(200), ctx.json(validResponse))
  }),
  rest.get('http://supabase-url.com/supabase-project/auth/v1/user', async(req, res, ctx) => {
    const token = req.headers.get('authorization')?.split('Bearer ')?.[1]

    if (token !== 'valid') return res(ctx.status(401), ctx.json({ error: 'Token expired', user: null }))
    return res(ctx.status(200), ctx.json({ user }))
  }),
  rest.get('https://localhosted:6969/profile', (req, res, ctx) => {
    const setCookie = req.headers.get('Set-Cookie')
    // @ts-expect-error MSW doesn't like this (because fetch usually doesn't let you)
    // see https://mswjs.io/docs/recipes/cookies
    return res(ctx.status(200), ctx.set('Cookie', setCookie))
  }),
]
