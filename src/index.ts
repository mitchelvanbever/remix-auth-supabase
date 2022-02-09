/* eslint-disable brace-style */
import type { SessionStorage } from '@remix-run/server-runtime'
import type { ApiError, Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth'
import { Strategy } from 'remix-auth'
import { handlePromise } from './handlePromise'

export interface SupabaseStrategyOptions {
  /**
   * @param {SupabaseClient} supabaseClient
   * @description Supabase instance
   */
  readonly supabaseClient: SupabaseClient
  /**
   * @param {SessionStorage} sessionStorage
   * @description Session storage instance
   */
  readonly sessionStorage: SessionStorage
  /**
   * @param {string?} sessionKey
   * @description Session key, **default is `sb:session`**
   */
  readonly sessionKey?: string
  /**
   * @param {string?} sessionErrorKey
   * @description Session error key, **default is `sb:error`**
   */
  readonly sessionErrorKey?: string
}

export interface VerifyParams {
  /**
   * @param {Request} req
   * @description Request provided by remix-auth Authenticator
   */
  readonly req: Request
  /**
   * @param {SupabaseClient} supabaseClient
   * @description Supabase instance provided by SupabaseStrategy
   */
  readonly supabaseClient: SupabaseClient
}

export type CheckOptions =
    | { successRedirect?: never; failureRedirect?: never }
    | { successRedirect: string; failureRedirect?: never }
    | { successRedirect?: never; failureRedirect: string }

export class SupabaseStrategy extends
  Strategy<Session, VerifyParams> {
  name = 'sb'
  readonly sessionKey: string
  readonly sessionErrorKey: string

  private readonly supabaseClient: SupabaseClient
  private readonly sessionStorage: SessionStorage

  constructor(
    options: SupabaseStrategyOptions,
    verify: StrategyVerifyCallback<Session, VerifyParams>,
  ) {
    if (!options?.supabaseClient)
      throw new Error('SupabaseStrategy : Constructor expected to receive a supabase client instance. Missing options.supabaseClient')
    if (!options?.sessionStorage)
      throw new Error('SupabaseStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage')
    if (!verify)
      throw new Error('SupabaseStrategy : Constructor expected to receive a verify function. Missing verify')

    super(verify)

    this.supabaseClient = options.supabaseClient
    this.sessionStorage = options.sessionStorage
    this.sessionKey = options.sessionKey ?? 'sb:session'
    this.sessionErrorKey = options.sessionErrorKey ?? 'sb:error'
  }

  async authenticate(
    req: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions,
  ): Promise<Session> {
    const [data, error] = await handlePromise(this.verify({ req, supabaseClient: this.supabaseClient }))

    if (error || !data)
      return this.failure((error as Error)?.message ?? 'No user found', req, sessionStorage, options)

    return this.success(this.sanitizeSession(data), req, sessionStorage, options)
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

  protected async handleResult(req: Request, options: AuthenticateOptions, result: any, hasErrored = false) {
    if (options.failureRedirect && hasErrored)
      return this.failure(result, req, this.sessionStorage, options)

    if (hasErrored)
      return null

    if (options.successRedirect && !hasErrored)
      return this.success(result, req, this.sessionStorage, options)

    return result
  }

  private sanitizeSession(session: Session): Session {
    delete session.user?.identities

    return session
  }

  async checkSession(req: Request, checkOptions: {
    successRedirect: string
    failureRedirect?: never
  }): Promise<null>

  async checkSession(req: Request, checkOptions: {
    successRedirect?: never
    failureRedirect: string
  }): Promise<Session>

  async checkSession(req: Request, checkOptions?: {
    successRedirect?: never
    failureRedirect?: never
  }): Promise<Session | null>

  async checkSession(req: Request, checkOptions: CheckOptions = {}): Promise<Session | null> {
    const sessionCookie = await this.sessionStorage.getSession(req.headers.get('Cookie'))
    const session: Session | null = sessionCookie.get(this.sessionKey)
    const options = { sessionKey: this.sessionKey, sessionErrorKey: this.sessionErrorKey, ...checkOptions }

    if (!session?.refresh_token || !session?.access_token)
      return this.handleResult(req, options, 'No session data found', true)

    const user = await this.getUser(session.access_token)

    if (!user || user?.error) {
      const [res, error] = await handlePromise(this.handleRefreshToken(session.refresh_token))

      if (!res?.data || res?.error || error)
        return this.handleResult(req, options, 'Could not refresh session', true)

      // flash new data
      const currentPath = new URL(req.url).pathname
      return this.success(this.sanitizeSession(res.data), req, this.sessionStorage, { ...options, successRedirect: options?.successRedirect ?? currentPath })
    }

    return this.handleResult(req, options, this.sanitizeSession(session))
  }
}
