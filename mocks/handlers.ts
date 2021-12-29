import { rest } from 'msw'
import { user, password as userPassword } from './user'

export const handlers = [
  rest.post('http://supabase-url.com/supabase-project/auth/v1/token', async(req, res, ctx) => {
    const { email, password } = JSON.parse(req.body as string)
    if (!email || !password || password !== userPassword)
      return res(ctx.status(401), ctx.json({ message: 'Wrong email or password' }))
    return res(ctx.status(200), ctx.json({ user }))
  }),
  rest.get('https://localhosted:6969/profile', (req, res, ctx) => {
    const setCookie = req.headers.get('Set-Cookie')
    // @ts-expect-error MSW doesn't like this (because fetch usually doesn't let you)
    // see https://mswjs.io/docs/recipes/cookies
    return res(ctx.status(200), ctx.set('Cookie', setCookie))
  }),
]
