import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticator, oAuthStrategy, sessionStorage } from '~/auth.server';
import { signInWithGithub } from '~/supabase.client';

export const loader = async ({ request }: LoaderArgs) => {
  await oAuthStrategy.checkSession(request, {
    successRedirect: '/private'
  });

  const session = await sessionStorage.getSession(request.headers.get('Cookie'));

  const error = session.get(authenticator.sessionErrorKey);

  return json({ error });
};

export default function Screen() {
  const { error } = useLoaderData<typeof loader>();

  return (
    <>
      {error && <div>{error.message}</div>}

      <p>
        <button onClick={() => signInWithGithub()}>Sign in with Github</button>
      </p>
    </>
  );
}
