import { createCookieSessionStorage } from '@remix-run/node';
import { Authenticator, AuthorizationError } from 'remix-auth';
import { SupabaseStrategy } from 'remix-auth-supabase';
import type { Session } from '~/supabase.server';
import { supabaseAdmin } from '~/supabase.server';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: ['s3cr3t'], // This should be an env variable
    secure: process.env.NODE_ENV === 'production'
  }
});

export const oAuthStrategy = new SupabaseStrategy(
  {
    supabaseClient: supabaseAdmin,
    sessionStorage,
    sessionKey: 'sb:session',
    sessionErrorKey: 'sb:error'
  },
  async ({ req }) => {
    const form = await req.formData();
    const session = form?.get('session');

    if (typeof session !== 'string') throw new AuthorizationError('session not found');

    return JSON.parse(session);
  }
);

export const authenticator = new Authenticator<Session>(sessionStorage, {
  sessionKey: oAuthStrategy.sessionKey,
  sessionErrorKey: oAuthStrategy.sessionErrorKey
});

authenticator.use(oAuthStrategy, 'sb-oauth');
