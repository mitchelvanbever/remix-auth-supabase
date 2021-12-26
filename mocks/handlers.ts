import { rest } from 'msw'
import { user, password as userPassword } from './user'

export const handlers = [
  rest.post('http://supabase-url.com/supabase-project/auth/v1/token', async(req, res, ctx) => {
    const { email, password } = JSON.parse(req.body as string)
    if (!email || !password || password !== userPassword)
      return res(ctx.status(401), ctx.json({ message: 'Wrong email or password' }))
    return res(ctx.status(200), ctx.json({ user }))
  }),
]
