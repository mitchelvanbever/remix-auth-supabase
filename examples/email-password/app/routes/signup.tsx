import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { AuthorizationError } from 'remix-auth';
import { supabaseClient } from '~/supabase';

// export const loader = async({ request }: LoaderArgs) => {
//   await authenticator.authenticate('sb', request, {
//     successRedirect: '/private',
//     throwOnError: false,
//   })
// }

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const email = form?.get('email');
  const password = form?.get('password');

  if (!email) throw new AuthorizationError('Email is required');
  if (typeof email !== 'string') throw new AuthorizationError('Email must be a string');

  if (!password) throw new AuthorizationError('Password is required');
  if (typeof password !== 'string') throw new AuthorizationError('Password must be a string');

  // const isEmail = z.string().email().nonempty().safeParse(email)
  // const isPassword = z.string().min(6).max(66).safeParse(password)

  // if (!isEmail.success) {
  //   return {
  //     fieldErrors: {
  //       name: 'email',
  //       content: isEmail.error,
  //     },
  //   }
  // }

  // if (!isPassword.success) {
  //   return {
  //     fieldErrors: {
  //       name: 'password',
  //       content: isPassword.error,
  //     },
  //   }
  // }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) return { formError: error?.message };

  return redirect('/profile');
};

export default function Screen() {
  useActionData<typeof action>();

  return (
    <Form method="post">
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
