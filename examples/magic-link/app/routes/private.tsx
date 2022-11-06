import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { authenticator, magicLinkStrategy } from '~/auth.server';

interface LoaderData {
  email?: string;
}

export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' });
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await magicLinkStrategy.checkSession(request, {
    failureRedirect: '/login'
  });

  return json<LoaderData>({ email: session.user?.email });
};

export default function Screen() {
  const { email } = useLoaderData<LoaderData>();
  return (
    <>
      <h1>Hello {email ?? 'anon'}</h1>

      <Form method="post">
        <button>Log Out</button>
      </Form>
    </>
  );
}
