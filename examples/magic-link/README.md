# Remix Auth - Supabase Strategy with Magic Link

Authentication using `signIn with magic link`.


## Preview

Open this example on [CodeSandbox](https://codesandbox.com):

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/mitchelvanbever/remix-auth-supabase/tree/main/examples/magic-link)

## Setup

1. Copy `.env.example` to create a new file `.env`:

```sh
cp .env.example .env
```
2. Go to https://app.supabase.io/project/{PROJECT}/api?page=auth to find your secrets
3. Add your `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `PUBLIC_SUPABASE_ANON_KEY` and `SERVER_URL` in `.env`
```env
SUPABASE_SERVICE_ROLE="{SERVICE_KEY}"
PUBLIC_SUPABASE_ANON_KEY="{ANON_KEY}"
SUPABASE_URL="https://{YOUR_INSTANCE_NAME}.supabase.co"
SERVER_URL="{YOUR_REMIX_SERVER_URL}"
```

> In local env, `SERVER_URL` is `http://localhost:3000`
>
> In production, `SERVER_URL` is your remix server public URL

## Using the Remix Auth & SupabaseStrategy 🚀

SupabaseStrategy provides `checkSession` working like Remix Auth `isAuthenticated` but handles token refresh

You must use `checkSession` instead of `isAuthenticated`


## Example

This is using Remix Auth, `remix-auth-supabase` and `supabase-js` packages.

> **⚠️ Never expose your `service_role` key in the browser**


The `/login` route renders a form with a email and password input. After a submit it runs some validations and store `user` object, `access_token` and `refresh_token` in the session.

The `/private` routes redirects the user to `/login` if it's not logged-in, or shows the user email and a logout form if it's logged-in.

**Handle refreshing of tokens** (if expired) or redirects to `/login` if it fails

More use cases can be found on [Supabase Strategy - Use cases](https://github.com/mitchelvanbever/remix-auth-supabase#using-the-authenticator--strategy-)

## Related Links

- [Remix Auth](https://github.com/sergiodxa/remix-auth)
- [Supabase Strategy](https://github.com/mitchelvanbever/remix-auth-supabase)
- [supabase-js](https://github.com/supabase/supabase-js)
