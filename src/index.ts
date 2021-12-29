import type { SessionStorage } from '@remix-run/server-runtime'
import type { Session, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type {
  AuthenticateOptions,
  StrategyVerifyCallback,
} from 'remix-auth'
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
  /**
   * @param sessionKey
   * @default session
   * @description key used to store the cookie
   */
  sessionKey?: string
  /**
   * @param sessionErrorKey
   * @default error
   * @description key used to store the cookie
   */
  sessionErrorKey?: string
}

/**
 * This interface declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 */
export interface MyStrategyVerifyParams {}

export class SupabaseStrategy extends Strategy<Partial<Session>, MyStrategyVerifyParams> {
  readonly name = 'SUPABASE_AUTH'
  private sessionKey = 'session'
  private sessionErrorKey = 'error'
  private supabaseClient: SupabaseClient

  constructor(
    options: MyStrategyOptions,
    verify: StrategyVerifyCallback<Partial<Session>, MyStrategyVerifyParams>,
  ) {
    super(verify)

    if (!options?.supabaseUrl || !options?.supabaseKey)
      throw new Error('Expected to receive a supabase URL and a supabase key')

    if (options?.sessionKey) this.sessionKey = options?.sessionKey
    if (options?.sessionErrorKey) this.sessionErrorKey = options?.sessionErrorKey

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
  ): Promise<Partial<Session>> {
    const mergedOptions = { ...options, sessionKey: this.sessionKey, sessionErrorKey: this.sessionErrorKey }

    const formData = await req.formData()

    const email = formData.get('email')
    const password = formData.get('password')
    // ensure email and password are at least string
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
      return this.failure('Need a valid email and/or password', req, sessionStorage, mergedOptions)

    return this.supabaseClient.auth.api.signInWithEmail(email, password).then((res) => {
      if (res?.error || !res.data)
        return this.failure(res?.error?.message ?? 'No user found', req, sessionStorage, mergedOptions)
      return this.success(res?.data, req, sessionStorage, mergedOptions)
    })
  }

  // I thought we could use this to override the isAuthenticated method,
  // but that doesn't seem to be the case
  // async isAuthenticated(
  //   req: Request,
  //   sessionStorage: SessionStorage,
  //   options: AuthenticateOptions,
  // ): Promise<Partial<Session>> {
  //   console.log('isAuthenticated', options)
  //   const mergedOptions = { ...options, sessionKey: this.sessionKey, sessionErrorKey: this.sessionErrorKey }

  //   const session = (await sessionStorage.getSession())?.get(this.sessionKey)
  //   if (!session?.access_token) return this.failure('No session.access_token present', req, sessionStorage, mergedOptions)

  // return this.supabaseClient.auth.api.getUser(session?.access_token).then(res => {
  //   if (error || !res?.user?.id)
  //     return this.failure(error?.message ?? 'No user found', req, sessionStorage, mergedOptions)
  //   return res.user
  // })
}
