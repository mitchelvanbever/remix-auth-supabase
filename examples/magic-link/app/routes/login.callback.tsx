import { useEffect } from 'react';
import type { ActionArgs } from '@remix-run/node';
import { useSubmit } from '@remix-run/react';
import { authenticator } from '~/auth.server';
import { supabaseClient } from '~/supabase.client';

export const action = async ({ request }: ActionArgs) => {
  await authenticator.authenticate('sb-magic-link', request, {
    successRedirect: '/private',
    failureRedirect: '/login'
  });
};

export default function LoginCallback() {
  const submit = useSubmit();

  useEffect(() => {
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        const formData = new FormData();
        formData.append('session', JSON.stringify(session));

        submit(formData, { method: 'post' });
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [submit]);

  return null;
}
