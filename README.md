# Remix Auth - Supabase Strategy

> Strategy for using supabase with Remix Auth

This strategy aims to provide an easy way to start using supabase authentication on [Remix.run](https://remix.run/) with [remix-auth](https://github.com/sergiodxa/remix-auth) bootstrapped with [remix-auth-template](https://github.com/sergiodxa/remix-auth-strategy-template)) (thanks [@sergiodxa](https://github.com/sergiodxa) 🚀).

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

- Cloudflare works but it does require to supply fetch to the supabase-client as an option

## Introduction

The way remix-auth (and it's templates) are designed was not a direct fit for what I had in mind for a seamless authentication strategy with supabase. After some back and forth between and playing around with [vitest](https://vitest.dev/) as my test suite ⚡ I've settled on the following auth-flow.

It Supports the following:

- Multiple authentication strategies thanks to remix-auth and the verify method (more on this later)
- `access_tokens`, `refresh_tokens`and `userId` are stored in a cookie
- `checkSession` method to protect routes (like `authenticator.isAuthenticated`) and **handle refreshing of tokens** (if expired)
- `refreshToken` method to refresh `access_token` and renew `refresh_token` when expire. This method has to be used in a `/refresh` route loader (to be defined in strategy constructor)

## How to use

### Install the package (and remix-auth)

- `yarn add remix-auth remix-auth-supabase`
- `pnpm install remix-auth remix-auth-supabase`
- `npm install remix-auth remix-auth-supabase`

### Breaking change v3 to v4

We now only store `access_token`, `refresh_token` and `userId` in session storage. It prevents huge cookie and it's more in the actual mood. See [Setup authenticator & strategy](#setup-authenticator-&-strategy)

### Setup sessionStorage, strategy, authenticator and refresh route

```js
// app/auth.server.ts
import { createCookieSessionStorage } from 'remix'
import { Authenticator, AuthorizationError } from 'remix-auth'
import { SupabaseStrategy } from 'remix-auth-supabase'
import type { UserSession } from 'remix-auth-supabase'
import { supabaseClient } from '~/supabase'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: ['s3cr3t'], // This should be an env variable
    secure: process.env.NODE_ENV === 'production',
  },
})

export const supabaseStrategy = new SupabaseStrategy(
  {
    supabaseClient,
    sessionStorage,
    refreshRoutePath: '/refresh', // feel free to change that
    refreshFailureRedirect: '/login', // feel free to change that
    sessionKey: 'sb:session', // if not set, default is sb:session
    sessionErrorKey: 'sb:error', // if not set, default is sb:error
  },
  // simple verify example for email/password auth
  async ({ req, supabaseClient }) => {
    const form = await req.formData()
    const email = form?.get('email')
    const password = form?.get('password')

    if (!email) throw new AuthorizationError('Email is required')
    if (typeof email !== 'string')
      throw new AuthorizationError('Email must be a string')

    if (!password) throw new AuthorizationError('Password is required')
    if (typeof password !== 'string')
      throw new AuthorizationError('Password must be a string')

    return supabaseClient.auth.api
      .signInWithEmail(email, password)
      .then(({ data, error }): Session => {
        if (error || !data) {
          throw new AuthorizationError(
            error?.message ?? 'No user session found'
          )
        }

        return data
      })
  }
)

export const authenticator =
  new Authenticator() <
  UserSession >
  (sessionStorage,
  {
    sessionKey: supabaseStrategy.sessionKey,
    sessionErrorKey: supabaseStrategy.sessionErrorKey,
  })

authenticator.use(supabaseStrategy)
```

#### Create a refresh token route

```javascript
// app/routes/refresh.tsx OR where you want
import type { LoaderFunction } from 'remix'
import { supabaseStrategy } from '~/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  await supabaseStrategy.refreshToken(request)
```

### Using the authenticator & strategy 🚀

> `checkSession` works like `authenticator.isAuthenticated` but **handles token refresh**

> When token needs refresh, `checkSession` will throw a redirect to `refreshRoutePath`.
>
> If token is able to refresh, go back to where checkSession was called.
>
> If token is unable to refresh, session is destroy and user is redirect to `refreshFailureRedirect`

```js
// app/routes/login.ts
export const loader: LoaderFunction = async ({ request }) =>
  supabaseStrategy.checkSession(request, {
    successRedirect: '/private',
  })

export const action: ActionFunction = async ({ request }) =>
  authenticator.authenticate('sb', request, {
    successRedirect: '/private',
    failureRedirect: '/login',
  })

export default function LoginPage() {
  return (
    <Form method="post">
      <input type="email" name="email" />
      <input type="password" name="password" />
      <button>Sign In</button>
    </Form>
  )
}
```

```js
// app/routes/private.ts
export const loader: LoaderFunction = async ({ request }) => {
  // If token refresh and successRedirect not set, reload the current route
  const session = await supabaseStrategy.checkSession(request)

  if (!session) {
    // If the user is not authenticated, you can do something or nothing
    // ⚠️ If you do nothing, /profile page is display
  }
}

// Handle logout action
export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' })
}
```

##### Refresh token or redirect

```js
// If token is refreshing and successRedirect not set, it reloads the current route
await supabaseStrategy.checkSession(request, {
  failureRedirect: '/login',
})
```

##### Redirect if authenticated

```js
// If the user is authenticated, redirect to /private
await supabaseStrategy.checkSession(request, {
  successRedirect: '/private',
})
```

##### Get session or null : decide what to do

```js
// Get the session or null, and do different things in your loader/action based on
// the result
const session = await supabaseStrategy.checkSession(request)
if (session) {
  // Here the user is authenticated
  // session : {
  //    access_token: 'eyJhbGciOiJIUzI1NiI...',
  //    refresh_token: 'xyz-abcd',
  //    userId: "14f92779-31cf-54cd-b756-45576e402b45",
  //   }
} else {
  // Here the user is not authenticated
}
```

##### Refresh token on Action

If you want to refresh token during an action, you can !

⚠️ Don't forget to commit this new token in your header

⚠️ If token is unable to refresh, session is destroy and user is redirect to `refreshFailureRedirect` for security reasons

> https://remix.run/docs/en/v1/api/remix#using-sessions

```javascript
import type { ActionFunction } from 'remix'
import { json } from 'remix'
import { AuthorizationError } from 'remix-auth'
import { sessionStorage, supabaseStrategy } from '~/auth.server'
import { supabaseClient } from '~/supabase'

export const action: ActionFunction = async ({ request }) => {
  let userSession = await supabaseStrategy.checkSession(request)

  if (!userSession) {
    userSession = await supabaseStrategy.refreshToken(request)
  }

  if (!userSession) throw new AuthorizationError()

  // or any function needing user access_token
  const { user } = await supabaseClient.auth.api.getUser(
    userSession.access_token
  )

  // mandatory, more info here :
  // https://remix.run/docs/en/v1/api/remix#using-sessions
  const sessionCookie = await sessionStorage.getSession(
    request.headers.get('Cookie')
  )
  sessionCookie.set(supabaseStrategy.sessionKey, userSession)

  return json(
    { user },
    {
      // ⚠️ please, don't forget me
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(sessionCookie),
      },
    }
  )
}
```

### Tips

#### Prevent infinite loop 😱

```js
// app/routes/login.ts
export const loader: LoaderFunction = async ({ request }) => {
  // Beware, never set failureRedirect equals to the current route
  const session = supabaseStrategy.checkSession(request, {
    successRedirect: '/private',
    failureRedirect: '/login', // ❌ DONT'T : infinite loop
  })

  // In this example, session is always null otherwise it would have been redirected
}
```

#### Redirect to

[Example]("https://github.com/mitchelvanbever/remix-auth-supabase-strategy/tree/main/examples/with-redirect-to")

> With Remix.run it's easy to add super UX

```js
// app/routes/private.profile.ts
export const loader: LoaderFunction = async ({ request }) =>
  // If checkSession fails, redirect to login and go back here when authenticated
  supabaseStrategy.checkSession(request, {
    failureRedirect: `/login?redirectTo=/private/profile`,
  })
```

```js
// app/routes/private.ts
export const loader: LoaderFunction = async ({ request }) =>
  // If checkSession fails, redirect to login and go back here when authenticated
  supabaseStrategy.checkSession(request, {
    failureRedirect: `/login`,
  })
```

```js
// app/routes/login.ts
export const loader = async ({ request }) => {
  const redirectTo =
    new URL(request.url).searchParams.get('redirectTo') ?? '/profile'

  return supabaseStrategy.checkSession(request, {
    successRedirect: redirectTo,
  })
}

export const action: ActionFunction = async ({ request }) => {
  // Always clone request when access formData() in action/loader with authenticator
  // 💡 request.formData() can't be called twice
  const data = await request.clone().formData()
  // If authenticate success, redirectTo what found in searchParams
  // Or where you want
  const redirectTo = data.get('redirectTo') ?? '/profile'

  return authenticator.authenticate('sb', request, {
    successRedirect: redirectTo,
    failureRedirect: '/login',
  })
}

export default function LoginPage() {
  const [searchParams] = useSearchParams()

  return (
    <Form method="post">
      <input
        name="redirectTo"
        value={searchParams.get('redirectTo') ?? undefined}
        hidden
        readOnly
      />
      <input type="email" name="email" />
      <input type="password" name="password" />
      <button>Sign In</button>
    </Form>
  )
}
```

## 📖 Examples

- [Email / password]("https://github.com/mitchelvanbever/remix-auth-supabase-strategy/tree/main/examples/email-password")
- [With redirect to]("https://github.com/mitchelvanbever/remix-auth-supabase-strategy/tree/main/examples/with-redirect-to")
- [Magic Link]("https://github.com/mitchelvanbever/remix-auth-supabase-strategy/tree/main/examples/magic-link")
- [Oauth]("https://github.com/mitchelvanbever/remix-auth-supabase-strategy/tree/main/examples/oauth")
