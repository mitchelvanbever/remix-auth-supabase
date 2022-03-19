import type { LoaderFunction } from 'remix'
import { magicLinkStrategy } from '~/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  await magicLinkStrategy.refreshToken(request)
