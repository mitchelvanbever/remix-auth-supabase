/* eslint-disable brace-style */
import type { SessionStorage } from '@remix-run/server-runtime'
import type { ApiError, Session, SupabaseClient, SupabaseClientOptions, User } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth'
import { Strategy } from 'remix-auth'
import { handlePromise } from './handlePromise'

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
    const params: VerifyParams = { form: await req.formData() }

    const [data, error] = await handlePromise(this.verify(params))

    if (error || !data)
      return this.failure((error as Error)?.message ?? 'No user found', req, sessionStorage, options)

    return this.success(data, req, sessionStorage, options)
  }

  private async extractSession(req: Request, sessionStorage: SessionStorage) {
    return (await sessionStorage.getSession(req.headers.get('Cookie')))?.data
  }

  private async getUser(accessToken: string): Promise<{
    user: User | null
    data: User | null
    error: ApiError | null
  } | undefined> {
    return (await handlePromise(this.supabaseClient.auth.api.getUser(accessToken)))[0]
  }

  private async handleRefreshToken(refreshToken: string): Promise<{
    data: Session | null
    error: ApiError | null
  }> {
    const [data, error] = await handlePromise(this.supabaseClient.auth.api.refreshAccessToken(refreshToken))

    if (error || !data)
      throw new Error('Error refreshing access token')

    return data
  }

  protected async handleResult(req: Request, sessionStorage: SessionStorage, options: AuthenticateOptions, result: any, hasErrored: boolean) {
    if (options.failureRedirect && hasErrored)
      return this.failure(result, req, sessionStorage, options)

    if (options.successRedirect && !hasErrored)
      return this.success(result, req, sessionStorage, options)

    return result
  }

  async checkSession(req: Request, sessionStorage: SessionStorage, options: AuthenticateOptions) {
    const cookie = await this.extractSession(req, sessionStorage)

    if (!cookie?.[options?.sessionKey]?.refresh_token || !cookie?.[options?.sessionKey]?.access_token)
      return this.handleResult(req, sessionStorage, options, 'No session data found', true)

    const session = await this.getUser(cookie?.[options?.sessionKey]?.access_token)

    if (!session || session?.error) {
      const [data, error] = await handlePromise(this.handleRefreshToken(cookie?.[options?.sessionKey]?.refresh_token))

      if (!data?.data || data?.error || error)
        return this.handleResult(req, sessionStorage, options, 'No session data found', true)

      return this.success(data.data, req, sessionStorage, options)
    }

    if (!session)
      return this.handleResult(req, sessionStorage, options, 'No session data found', true)

    return this.handleResult(req, sessionStorage, options, { ...cookie?.[options?.sessionKey], user: session?.user }, false)
  }
}
