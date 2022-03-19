/* eslint-disable brace-style */
import type { Session, SessionStorage } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/server-runtime'
import type {
  ApiError,
  SupabaseClient,
  Session as SupabaseSession,
  User,
} from '@supabase/supabase-js'
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
   * @param {string} refreshFailureRedirect
   * @description Where to redirect if access_token refresh fails
   */
  readonly refreshFailureRedirect: string
  /**
   * @param {string} refreshRoutePath
   * @description Where is strategy refresh's function used
   */
  readonly refreshRoutePath: string
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

export type UserSession = Pick<
  SupabaseSession,
  'access_token' | 'refresh_token'
> & {
  userId?: string
}

export class SupabaseStrategy extends Strategy<UserSession, VerifyParams> {
  name = 'sb'
  readonly sessionKey: string
  readonly sessionErrorKey: string

  private readonly redirectTo = 'redirectTo'
  private readonly supabaseClient: SupabaseClient
  private readonly sessionStorage: SessionStorage
  private readonly refreshFailureRedirect: string
  private readonly refreshRoutePath: string

  constructor(
    options: SupabaseStrategyOptions,
    verify: StrategyVerifyCallback<SupabaseSession, VerifyParams>
  ) {
    if (!options?.supabaseClient)
      throw new Error(
        'SupabaseStrategy : Constructor expected to receive a supabase client instance. Missing options.supabaseClient'
      )
    if (!options?.sessionStorage)
      throw new Error(
        'SupabaseStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage'
      )
    if (!options?.refreshFailureRedirect)
      throw new Error(
        'SupabaseStrategy : Constructor expected to receive a refreshFailureRedirect value. Missing options.refreshFailureRedirect'
      )
    if (!options?.refreshRoutePath)
      throw new Error(
        'SupabaseStrategy : Constructor expected to receive a refreshRoutePath value. Missing options.refreshRoutePath'
      )
    if (!verify)
      throw new Error(
        'SupabaseStrategy : Constructor expected to receive a verify function. Missing verify'
      )

    super(verify)

    this.supabaseClient = options.supabaseClient
    this.sessionStorage = options.sessionStorage
    this.sessionKey = options.sessionKey ?? 'sb:session'
    this.sessionErrorKey = options.sessionErrorKey ?? 'sb:error'
    this.refreshFailureRedirect = options.refreshFailureRedirect
    this.refreshRoutePath = options.refreshRoutePath
  }

  async authenticate(
    req: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<UserSession> {
    const [data, error] = await handlePromise(
      this.verify({ req, supabaseClient: this.supabaseClient })
    )

    if (error || !data)
      return this.failure(
        (error as Error)?.message ?? 'No user found',
        req,
        sessionStorage,
        options
      )

    return this.success(
      this.mapSession(data as SupabaseSession),
      req,
      sessionStorage,
      options
    )
  }

  private mapSession(session: SupabaseSession): UserSession {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      userId: session.user?.id,
    }
  }

  private async getUser(accessToken: string): Promise<
    | {
        user: User | null
        data: User | null
        error: ApiError | null
      }
    | undefined
  > {
    return (
      await handlePromise(this.supabaseClient.auth.api.getUser(accessToken))
    )[0]
  }

  private async handleRefreshToken(refreshToken: string): Promise<{
    data: SupabaseSession | null
    error: ApiError | null
  }> {
    const [data, error] = await handlePromise(
      this.supabaseClient.auth.api.refreshAccessToken(refreshToken)
    )

    if (error || !data) throw new Error('Error refreshing access token')

    return data
  }

  private async handleResult(
    req: Request,
    options: AuthenticateOptions,
    result: any,
    hasErrored = false
  ) {
    if (options.failureRedirect && hasErrored)
      return this.failure(result, req, this.sessionStorage, options)

    if (hasErrored) return null

    if (options.successRedirect && !hasErrored)
      return this.success(
        this.mapSession(result),
        req,
        this.sessionStorage,
        options
      )

    return result
  }

  async checkSession(
    req: Request,
    checkOptions: {
      successRedirect: string
      failureRedirect?: never
    }
  ): Promise<null>

  async checkSession(
    req: Request,
    checkOptions: {
      successRedirect?: never
      failureRedirect: string
    }
  ): Promise<UserSession>

  async checkSession(
    req: Request,
    checkOptions?: {
      successRedirect?: never
      failureRedirect?: never
    }
  ): Promise<UserSession | null>

  async checkSession(
    req: Request,
    checkOptions: CheckOptions = {}
  ): Promise<UserSession | null> {
    const options = {
      sessionKey: this.sessionKey,
      sessionErrorKey: this.sessionErrorKey,
      ...checkOptions,
    }
    const sessionCookie = await this.sessionStorage.getSession(
      req.headers.get('Cookie')
    )
    const session: UserSession | null = sessionCookie.get(this.sessionKey)

    if (!session?.refresh_token || !session?.access_token)
      return this.handleResult(req, options, 'No session data found', true)

    const user = await this.getUser(session.access_token)

    console.log('req.method', req.method)
    // access token expires, time to refresh !
    if (!user || user?.error) {
      // try to refresh here if called from an action
      if (req.method !== 'GET') {
        return null
      }

      const searchParams = new URLSearchParams([
        [this.redirectTo, new URL(req.url).pathname],
      ])
      throw redirect(`${this.refreshRoutePath}?${searchParams}`)
    }

    return this.handleResult(req, options, session)
  }

  async refreshToken(request: Request): Promise<UserSession | null> {
    const options: AuthenticateOptions = {
      sessionKey: this.sessionKey,
      sessionErrorKey: this.sessionErrorKey,
      failureRedirect: this.refreshFailureRedirect,
    }

    const redirectTo =
      new URL(request.url).searchParams.get(this.redirectTo) || undefined

    // if malformed url and request method is GET, redirect to refreshFailureRedirect
    if (!redirectTo && request.method === 'GET')
      return this.handleResult(
        request,
        options,
        'No redirectTo search param found',
        true
      )

    const sessionCookie = await this.sessionStorage.getSession(
      request.headers.get('Cookie')
    )
    const session: UserSession | null = sessionCookie.get(this.sessionKey)

    // if no refresh token, redirect to refreshFailureRedirect
    if (!session?.refresh_token)
      return this.handleResult(
        request,
        options,
        'No refresh_token found in session',
        true
      )

    const [newSession, error] = await handlePromise(
      this.handleRefreshToken(session.refresh_token)
    )

    // 🔑 if unable to refresh session, we don't want to continue, destroy session and redirect
    if (!newSession?.data || newSession?.error || error) {
      throw redirect(this.refreshFailureRedirect, {
        headers: {
          'Set-Cookie': await this.sessionStorage.destroySession(sessionCookie),
        },
      })
    }

    // flash new data and go back where we came from if called from a loader
    if (request.method === 'GET')
      return this.handleResult(
        request,
        {
          ...options,
          successRedirect: redirectTo,
        },
        newSession.data
      )

    // return new session if called from an action
    return this.handleResult(request, options, this.mapSession(newSession.data))
  }

  async getSession(request: Request): Promise<Session> {
    const sessionCookie = await this.sessionStorage.getSession(
      request.headers.get('Cookie')
    )
    return sessionCookie.get(this.sessionKey)
  }
}
