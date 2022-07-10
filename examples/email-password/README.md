# Remix Auth - Supabase Strategy with email and password

Authentication using `signInWithEmail`.

## Preview

Open this example on [CodeSandbox](https://codesandbox.com):

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/mitchelvanbever/remix-auth-supabase/tree/main/examples/email-password)

## Setup

1. Copy `.env.example` to create a new file `.env`:

```sh
cp .env.example .env
```
1. Go to https://app.supabase.io/project/{PROJECT}/api?page=auth to find the keys you need
2. Add your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in `.env`
```env
SUPABASE_SERVICE_ROLE="{SERVICE_ROLE_API_KEY}"
SUPABASE_URL="https://{YOUR_INSTANCE_NAME}.supabase.co"
```

> Note: `SUPABASE_SERVICE_ROLE` is a secret and should never be exposed client side. Make sure you only use this in .server files and isn't passed as an env variable to the client ⚠️

## Using the Remix Auth & SupabaseStrategy 🚀

SupabaseStrategy provides `checkSession` with a similar behavior like Remix Auth Strategy `isAuthenticated` with one difference: *it handles refreshing of the sessions as well*


## Example

This is using `remix-auth`, `remix-auth-supabase` and `supabase-js` packages.

> Thanks to Remix, we can securely use server only authentication with `supabase.auth.api.signInWithEmail`
>
> This function should only be called on a server (`loader` or `action` functions).
>
> **⚠️ Never expose your `service_role` key in the browser**


The `/login` route renders a form with a email and password input. After a submit it runs some validations and store `user` object, `access_token` and `refresh_token` in the session.

The `/private` routes redirects the user to `/login` if it's not logged-in, or shows the user email and a logout form if it's logged-in.

**Handle refreshing of tokens** (if expired) or redirects to `/login` if it fails

More use cases can be found on [Supabase Strategy - Use cases](https://github.com/mitchelvanbever/remix-auth-supabase#using-the-authenticator--strategy-)

## Related Links

- [Remix Auth](https://github.com/sergiodxa/remix-auth)
- [Supabase Strategy](https://github.com/mitchelvanbever/remix-auth-supabase)
- [supabase-js](https://github.com/supabase/supabase-js)
