import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator, oAuthStrategy } from '~/auth.server';

export const action = async ({ request }: ActionArgs) => {
  await authenticator.logout(request, { redirectTo: '/login' });
};

export const loader = async ({ request }: LoaderArgs) => {
  const session = await oAuthStrategy.checkSession(request, {
    failureRedirect: '/login'
  });

  return json(session?.user);
};

export default function Screen() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <h1>Hello {data?.email ?? 'anon'}</h1>

      <Form method="post">
        <button>Log Out</button>
      </Form>
    </>
  );
}
