import type { LoaderFunction } from 'remix';
import { json, useLoaderData } from 'remix';
import { authenticator, oAuthStrategy, sessionStorage } from '~/auth.server';
import { signInWithGithub } from '~/supabase.client';

interface LoaderData {
  error: { message: string } | null;
}

export const loader: LoaderFunction = async ({ request }) => {
  await oAuthStrategy.checkSession(request, {
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

export default function Screen() {
  const { error } = useLoaderData<LoaderData>();

  return (
    <>
      {error && <div>{error.message}</div>}

      <p>
        <button onClick={() => signInWithGithub()}>Sign in with Github</button>
      </p>
    </>
  );
}
