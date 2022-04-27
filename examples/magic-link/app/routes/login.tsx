import type { ActionFunction, LoaderFunction } from 'remix';
import { Form, json, redirect, useActionData, useTransition } from 'remix';
import {
  authenticator,
  magicLinkStrategy,
  sessionStorage
} from '~/auth.server';
import { supabaseAdmin } from '~/supabase.server';
import type { ApiError } from '~/supabase.server';

interface LoaderData {
  error: { message: string } | null;
}

interface ActionData {
  error: ApiError | null;
}

export const loader: LoaderFunction = async ({ request }) => {
  await magicLinkStrategy.checkSession(request, {
    successRedirect: '/private'
  });

  const session = await sessionStorage.getSession(
    request.headers.get('Cookie')
  );

  const error = session.get(
    authenticator.sessionErrorKey
  ) as LoaderData['error'];

  return json<LoaderData>({ error });
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.clone().formData();
  const email = form?.get('email');

  if (!email) return json({ error: { message: 'Email is required' } }, 400);
  if (typeof email !== 'string')
    return json({ error: { message: 'Email must be a string' } }, 400);

  const { error } = await supabaseAdmin.auth.api.sendMagicLinkEmail(email, {
    redirectTo: `${process.env.SERVER_URL}/login/callback`
  });

  if (error) return json({ error: { message: error.message } }, error.status);

  return redirect('/login/check-your-emails');
};

export default function Screen() {
  const transition = useTransition();
  const { error } = useActionData<ActionData>() || {};

  return (
    <Form method="post">
      {error && <div>{error.message}</div>}
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" />
      </div>
      <button>
        {transition.submission ? 'Sending you a magic link' : 'Send Magic Link'}
      </button>
    </Form>
  );
}
