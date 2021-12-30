# Remix Auth - Supabase Strategy

> Strategy for using supabase with Remix Auth

This strategy aims to provide an easy way to start using supabase authentication with [Remix.run](https://remix.run/).

For now it supports only email & password authentication but we'll support several strategies given time. Feel free to leave an issue describing the supabase auth method you need the desperate support for 🥰

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ❗          |

* Cloudflare should work but it does require to supply fetch to the supabase as an option

## How to use

Start by installing the strategy `yarn add @afaik/remix-auth-supabase-strategy` | `pnpm install @afaik/remix-auth-supabase-strategy` | `npm install @afaik/remix-auth-supabase-strategy`

Signing up the user is up to you but is pretty straightforward following the examples of using the supabase.

Set up a sessionStorage to pass to the Supabase Strategy.

Set up `~/auth.server.ts`
```js
  export const authenticator = new Authenticator<User>(sessionStorage, { sessionErrorKey: 'session-error', sessionKey: 'session' })
  authenticator.use(
    new SupabaseStrategy(
      {
        supabaseUrl,
        supabaseOptions,
        supabaseKey: supabaseAnonKey,
      },
    ),
    'supabase',
  )
```

`~/routes/login.ts`
```js
  export const loader: LoaderFunction = async({ request }) =>
    authenticator.isAuthenticated(request, { successRedirect: '/profile' }) // returns the entire session

  export const action: ActionFunction = async({ request }) =>
    // redirect based on the response
    authenticator.authenticate('supabase', request, {
      successRedirect: '/profile',
      failureRedirect: '/login',
    })
```

`~/routes/profile.ts`
```js
  export const loader: LoaderFunction = async({ request }) =>
    authenticator.isAuthenticated(request, { failureRedirect: '/login' }) // returns the entire session

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
