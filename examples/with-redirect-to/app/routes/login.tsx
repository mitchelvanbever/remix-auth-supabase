import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData, useSearchParams } from '@remix-run/react';
import { authenticator, sessionStorage, supabaseStrategy } from '~/auth.server';

export const action = async ({ request }: ActionArgs) => {
  const data = await request.clone().formData();
  const redirectTo = (data.get('redirectTo') ?? '/private') as string;

  await authenticator.authenticate('sb', request, {
    successRedirect: redirectTo,
    failureRedirect: '/login'
  });
};

export const loader = async ({ request }: LoaderArgs) => {
  const redirectTo = new URL(request.url).searchParams.get('redirectTo') ?? '/private';

  await supabaseStrategy.checkSession(request, {
    successRedirect: redirectTo
  });

  const session = await sessionStorage.getSession(request.headers.get('Cookie'));

  const error = session.get(authenticator.sessionErrorKey);

  return json({ error });
};

export default function Screen() {
  const [searchParams] = useSearchParams();
  const { error } = useLoaderData<typeof loader>();

  return (
    <Form method="post">
      {error && <div>{error.message}</div>}
      <input name="redirectTo" value={searchParams.get('redirectTo') ?? undefined} hidden readOnly />
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input type="password" name="password" id="password" />
      </div>

      <button>Log In</button>
    </Form>
  );
}
