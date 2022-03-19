import type { ActionFunction, LoaderFunction } from 'remix'
import { Form, json, useLoaderData } from 'remix'
import { authenticator, magicLinkStrategy } from '~/auth.server'
import { supabaseAdmin } from '~/supabase.server'

type LoaderData = { email?: string }

export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' })
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await magicLinkStrategy.checkSession(request, {
    failureRedirect: '/login',
  })

  const { user } = await supabaseAdmin.auth.api.getUser(session.access_token)

  return json<LoaderData>({ email: user?.email })
}

export default function Screen() {
  const { email } = useLoaderData<LoaderData>()
  return (
    <>
      <h1>Hello {email}</h1>

      <Form method="post">
        <button>Log Out</button>
      </Form>
    </>
  )
}
