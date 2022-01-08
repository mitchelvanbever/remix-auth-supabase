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
* `checkSession` method to protect routes (like `authenticator.isAuthenticated`) and **handle refreshing of tokens** (if expired)

## How to use

### Install the package (and remix-auth)
* `yarn add remix-auth @afaik/remix-auth-supabase-strategy`
* `pnpm install remix-auth @afaik/remix-auth-supabase-strategy`
* `npm install remix-auth @afaik/remix-auth-supabase-strategy`

### Breaking change v2 to v3
To allow for more freedom and support some of the different authentication types the verify no longer just sends the form, 
but it now sends the entire request. See [Setup authenticator & strategy](#setup-authenticator-&-strategy)

### Setup sessionStorage
```js
// app/session.server.ts
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

### Setup authenticator & strategy
```js
// app/auth.server.ts
import type { Session } from '@supabase/supabase-js'
import { Authenticator } from 'remix-auth'
import { SupabaseStrategy } from '@afaik/remix-auth-supabase-strategy'
import { supabase } from '~/utils/supabase'
import { sessionStorage } from '~/session.server'

export const supabaseStrategy = new SupabaseStrategy(
  {
      supabaseClient: supabase,
      sessionStorage,
      sessionKey: 'sb:session', // if not set, default is sb:session
      sessionErrorKey: 'sb:error', // if not set, default is sb:error
  },
  async ({ req, supabaseClient }) => {
    // simple verify example for email/password auth
    const form = await req.formData()
    const email = form?.get('email')
    const password = form?.get('password')
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
      throw new Error('Need a valid email and/or password')

    return supabaseClient.auth.api.signInWithEmail(email, password).then((res) => {
      if (res?.error || !res.data)
        throw new Error(res?.error?.message ?? 'No user found')

      return res?.data
    })
  },
)

export const authenticator = new Authenticator<Session>(
  sessionStorage,
  {
      sessionKey: supabaseStrategy.sessionKey, // keep in sync
      sessionErrorKey: supabaseStrategy.sessionErrorKey, // keep in sync
  })

authenticator.use(supabaseStrategy)
```

### Using the authenticator & strategy 🚀
> `checkSession` works like `authenticator.isAuthenticated` but **handles token refresh**

```js
// app/routes/login.ts
export const loader: LoaderFunction = async({ request }) => 
    supabaseStrategy.checkSession(request, {
        successRedirect: '/profile'
    })

export const action: ActionFunction = async({ request }) =>
  authenticator.authenticate('sb', request, {
    successRedirect: '/profile',
    failureRedirect: '/login',
  })

export default function LoginPage() {
    return (
        <Form method="post">
            <input type="email" name="email" />
            <input type="password" name="password" />
            <button>Sign In</button>
        </Form>
    );
}
```

```js
// app/routes/profile.ts
export const loader: LoaderFunction = async({ request }) => {
    // If token refresh and successRedirect not set, reload the current route
    const session = await supabaseStrategy.checkSession(request);

    if (!session) {
        // If the user is not authenticated, you can do something or nothing
        // ⚠️ If you do nothing, /profile page is display
    }
}

// Handle logout action
export const action: ActionFunction = async({ request }) => {
    await authenticator.logout(request, { redirectTo: "/login" });
}
```

##### Refresh token or redirect
```js
// If token is refreshing and successRedirect not set, it reloads the current route
await supabaseStrategy.checkSession(request, {
    failureRedirect: "/login",
});
```

##### Redirect if authenticated
```js
// If the user is authenticated, redirect to /profile
await supabaseStrategy.checkSession(request, {
    successRedirect: "/profile",
});
```

##### Get session or null : decide what to do
```js
// Get the session or null, and do different things in your loader/action based on
// the result
const session = await supabaseStrategy.checkSession(request);
if (session) {
    // Here the user is authenticated
} else {
    // Here the user is not authenticated
}
```


### Tips
#### Prevent infinite loop 😱
```js
// app/routes/login.ts
export const loader: LoaderFunction = async({ request }) => {
    // Beware, never set failureRedirect equals to the current route
    const session = supabaseStrategy.checkSession(request, {
        successRedirect: '/profile',
        failureRedirect: "/login", // ❌ DONT'T : infinite loop
    });
    
    // In this example, session is always null otherwise it would have been redirected
}
```

#### Redirect to
> With Remix.run it's easy to add super UX
```js
// app/routes/profile.ts
export const loader: LoaderFunction = async({ request }) =>
    // If checkSession fails, redirect to login and go back here when authenticated
    supabaseStrategy.checkSession(request, {
        failureRedirect: `/login?redirectTo=/profile`
    });
```
```js
// app/routes/login.ts
export const loader = async ({ request }) => {
    const redirectTo = new URL(request.url).searchParams.get("redirectTo") ?? "/dashboard";

    return supabaseStrategy.checkSession(request, {
        successRedirect: redirectTo,
    });
};

export const action: ActionFunction = async({ request }) =>{
    // Always clone request when access formData() in action/loader with authenticator
    // 💡 request.formData() can't be called twice
    const data = await request.clone().formData();
    // If authenticate success, redirectTo what found in searchParams 
    // Or where you want
    const redirectTo = data.get("redirectTo") ?? "/dashboard";
    
    return authenticator.authenticate('sb', request, {
        successRedirect: redirectTo,
        failureRedirect: '/login',
    })
}

export default function LoginPage() {
    const [searchParams] = useSearchParams();

    return (
        <Form method="post">
            <input
                name="redirectTo"
                value={searchParams.get("redirectTo") ?? undefined}
                hidden
                readOnly
            />
            <input type="email" name="email" required />
            <input
                type="password"
                name="password"
            />
            <button>Sign In</button>
        </Form>
    );
}
```