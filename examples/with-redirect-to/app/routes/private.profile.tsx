import type { ActionFunction, LoaderFunction } from 'remix';
import { Form, json, useLoaderData } from 'remix';
import { authenticator, supabaseStrategy } from '~/auth.server';

interface LoaderData {
  email?: string;
}

export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' });
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await supabaseStrategy.checkSession(request, {
    failureRedirect: '/login?redirectTo=/private/profile'
  });

  return json<LoaderData>({ email: session.user?.email });
};

export default function Screen() {
  const { email } = useLoaderData<LoaderData>();
  return (
    <>
      <h1>Hello {email}</h1>
      <h2>Welcome in Private Profile</h2>

      <Form method="post">
        <button>Log Out</button>
      </Form>
    </>
  );
}
