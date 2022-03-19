import type { LoaderFunction } from 'remix'
import { supabaseStrategy } from '~/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  await supabaseStrategy.refreshToken(request)
