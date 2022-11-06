import type { ActionArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { authenticator } from '~/auth.server';

export const action = async ({ request }: ActionArgs) => {
  await authenticator.authenticate('sb-magic-link', request, {
    successRedirect: '/private',
    failureRedirect: '/login'
  });
};

export default function Index() {
  return (
    <>
      <h1>Index page</h1>
      <ul>
        <li>
          <Link to="/private">Go to private page</Link>
        </li>
        <li>
          <Link to="/login">Go to login page</Link>
        </li>
      </ul>
    </>
  );
}
