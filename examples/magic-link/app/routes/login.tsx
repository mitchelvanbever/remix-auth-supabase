import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useTransition } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { authenticator, magicLinkStrategy, sessionStorage } from '~/auth.server';
import { supabaseAdmin } from '~/supabase.server';

export const loader = async ({ request }: LoaderArgs) => {
  await magicLinkStrategy.checkSession(request, {
    successRedirect: '/private'
  });

  const session = await sessionStorage.getSession(request.headers.get('Cookie'));

  const error = session.get(authenticator.sessionErrorKey);

  return json({ error });
};

export const action = async ({ request }: ActionArgs) => {
  const form = await request.clone().formData();
  const email = form?.get('email');

  if (!email) return json({ error: { message: 'Email is required' } }, 400);
  if (typeof email !== 'string') return json({ error: { message: 'Email must be a string' } }, 400);

  const { error } = await supabaseAdmin.auth.api.sendMagicLinkEmail(email, {
    redirectTo: `${process.env.SERVER_URL}/login/callback`
  });

  if (error) return json({ error: { message: error.message } }, error.status);

  throw redirect('/login/check-your-emails');
};

export default function Screen() {
  const transition = useTransition();
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      {actionData?.error && <div>{actionData?.error.message}</div>}
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" />
      </div>
      <button>{transition.submission ? 'Sending you a magic link' : 'Send Magic Link'}</button>
    </Form>
  );
}
