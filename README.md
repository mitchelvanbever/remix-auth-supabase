# Remix Auth - Supabase Strategy

> Strategy for using supabase with Remix Auth

This strategy aims to provide an easy way to start using supabase authentication on [Remix.run](https://remix.run/) with [remix-auth](https://github.com/sergiodxa/remix-auth) bootstrapped with [remix-auth-template](https://github.com/sergiodxa/remix-auth-strategy-template)) (thanks [@sergiodxa](https://github.com/sergiodxa) 🚀).

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

* Cloudflare works but it does require to supply fetch to the supabase-client as an option

## Introduction
The way remix-auth (and it's templates) are designed was not a direct fit for what I had in mind for a seamless authentication strategy with supabase. After some back and forth between and playing around with [vitest](https://vitest.dev/) as my test suite ⚡ I've settled on the following auth-flow.

It Supports the following:
* Multiple authentication strategies thanks to remix-auth and the verify method (more on this later)
* User object, access_tokens and refresh_tokens are stored in a cookie
* `checkSession` method to protect routes and handle refreshing of tokens (if expired)

## How to use

Install the package (and remix-auth)
* `yarn add remix-auth @afaik/remix-auth-supabase-strategy`
* `pnpm install remix-auth @afaik/remix-auth-supabase-strategy`
* `npm install remix-auth @afaik/remix-auth-supabase-strategy`


First setup the sessionStorage
```js
import { createCookieSessionStorage } from 'remix'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [SESSION_SECRET],
    // 1 hour resembles access_token expiration
    // set it to 1 hour if you want to user to re-log every hour
    // 24 hours refreshes_token if the user visits every 24 hours
    maxAge: 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production',
  },
})
```

Set up a file to export the authenticator(s) and strategy (i.e: `~/auth.server.ts`)
```js
// app/auth.server.ts
import type { Session } from '@supabase/supabase-js'
import { Authenticator } from 'remix-auth'
import { SupabaseStrategy } from '@afaik/remix-auth-supabase-strategy'
import { supabase, supabaseOptions } from '~/utils/supabase'
import { supabaseAnonKey, supabaseUrl } from '~/config'
import { sessionStorage } from '~/session.server'

export const supabaseStrategy = new SupabaseStrategy(
  {
    supabaseUrl,
    supabaseOptions,
    supabaseKey: supabaseAnonKey,
  },
  async ({ req }) => {
    // simple verify example for email/password auth
    const form = await req.formData()
    const email = form?.get('email')
    const password = form?.get('password')
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
      throw new Error('Need a valid email and/or password')

    return supabase.auth.api.signInWithEmail(email, password).then((res) => {
      if (res?.error || !res.data)
        throw new Error(res?.error?.message ?? 'No user found')

      return res?.data
    })
  },
)

export const authenticator = new Authenticator<Session>(
  sessionStorage,
  {
    sessionKey: 'sb:session',
    sessionErrorKey: 'sb:error'
  })

authenticator.use(supabaseStrategy)
```

`~/routes/login.ts`
```js
export const loader: LoaderFunction = async({ request }) =>
  supabaseStrategy.checkSession(
    request,
    sessionStorage,
    {
      sessionKey: 'sb:session',
      sessionErrorKey: 'sb:error',
      successRedirect: '/profile',
    })

export const action: ActionFunction = async({ request }) =>
  authenticator.authenticate('sb', request, {
    successRedirect: '/profile',
    failureRedirect: '/login',
  })
```

`~/routes/profile.ts`
```js
export const loader: LoaderFunction = async({ request }) =>
  supabaseStrategy.checkSession(
    request,
    sessionStorage,
    {
      sessionKey: 'sb:session',
      sessionErrorKey: 'sb:error',
      failureRedirect: '/login',
    })

// handle logout action
export const action: ActionFunction = async({ request }) => {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'))
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  })
}
```
