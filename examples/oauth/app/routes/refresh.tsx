import type { LoaderFunction } from 'remix'
import { oAuthStrategy } from '~/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  await oAuthStrategy.refreshToken(request)
