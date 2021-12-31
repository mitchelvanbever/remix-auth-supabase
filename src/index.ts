/* eslint-disable brace-style */
import type { SessionStorage } from '@remix-run/server-runtime'
import type { ApiError, Session, SupabaseClient, SupabaseClientOptions, User } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth'
import { Strategy } from 'remix-auth'

/**
 * This interface declares what configuration the strategy needs from the
 * developer to correctly work.
 */
export interface MyStrategyOptions {
  /**
   * @param supabaseUrl
   * @description supabase url used to init supabaseClient
   */
  supabaseUrl: string
  /**
   * @param supabaseKey
   * @description supabase key used to init supabaseClient
   */
  supabaseKey: string
  /**
   * @param supabaseOptions
   * @description supabase options used to init supabaseClient
   * @remark supabase options should be provided accordingly (CF-workers needs options).
   */
  supabaseOptions?: SupabaseClientOptions
}

export interface VerifyParams {
  form?: FormData
}

export class SupabaseStrategy extends
  Strategy<Session, VerifyParams> {
  name = 'sb'
  private supabaseClient: SupabaseClient

  constructor(
    options: MyStrategyOptions,
    verify: StrategyVerifyCallback<Session, VerifyParams>,
  ) {
    super(verify)

    if (!options?.supabaseUrl || !options?.supabaseKey)
      throw new Error('Expected to receive a supabase URL and a supabase key')

    this.supabaseClient = createClient(
      options.supabaseUrl,
      options.supabaseKey,
      options?.supabaseOptions ?? {},
    )
  }

  async authenticate(
    req: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions,
  ): Promise<Session> {
    const form = await req.formData()

    let session

    const params: VerifyParams = { form }

    try {
      session = await this.verify(params)
    } catch (e: unknown) {
      return this.failure((e as Error)?.message ?? 'No user found', req, sessionStorage, options)
    }

    if (!session) return this.failure('No user found', req, sessionStorage, options)

    return this.success(session, req, sessionStorage, options)
  }

  private async extractSession(req: Request, sessionStorage: SessionStorage) {
    return (await sessionStorage.getSession(req.headers.get('Cookie')))?.data
  }

  private async getUser(accessToken: string): Promise<{
    user: User | null
    data: User | null
    error: ApiError | null
  } | undefined> {
    let res

    try {
      res = await this.supabaseClient.auth.api.getUser(accessToken)
    } catch (e) {
      console.error(e)
    }

    return res
  }

  private async handleRefreshToken(refreshToken: string): Promise<{
    data: Session | null
    error: ApiError | null
  }> {
    let res

    try {
      res = await this.supabaseClient.auth.api.refreshAccessToken(refreshToken)
    } catch (e) {
      console.error(e)
      throw new Error('No session data found')
    }

    return res
  }

  // check for valid JWT tokens and or refresh tokens to return the user
  async checkSession(req: Request, sessionStorage: SessionStorage, options: AuthenticateOptions) {
    const cookie = await this.extractSession(req, sessionStorage)

    if (!cookie?.session?.refresh_token || !cookie?.session?.access_token)
      return this.failure('No session data found', req, sessionStorage, options)

    const session = await this.getUser(cookie.session.access_token)

    if (!session || session?.error) {
      const res = await this.handleRefreshToken(cookie.session.refresh_token)

      if (!res.data || res.error)
        return this.failure('No session data found', req, sessionStorage, options)

      // flash updated cookie data
      return this.success(res.data, req, sessionStorage, options)
    }

    // if no user but we got this far, we should do some cleanup
    if (!session)
      return this.failure('No session data found', req, sessionStorage, options)

    // otherwise the token is valid and we should just return the user
    return session
  }
}
