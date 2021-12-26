import type { SessionStorage } from '@remix-run/server-runtime'
import type { SupabaseClient, SupabaseClientOptions, User as SupabaseUser } from '@supabase/supabase-js'
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
}

/**
 * This interface declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 */
export interface MyStrategyVerifyParams {}

export class SupabaseStrategy extends Strategy<SupabaseUser, MyStrategyVerifyParams> {
  readonly name = 'SUPABASE_AUTH'
  private sessionKey = 'sb:token'
  private supabaseClient: SupabaseClient

  constructor(
    options: MyStrategyOptions,
    verify: StrategyVerifyCallback<SupabaseUser, MyStrategyVerifyParams>,
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
  ): Promise<SupabaseUser> {
    const { email, password } = await req.json()

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
      return this.failure('Need a valid email and/or password', req, sessionStorage, options)

    return this.supabaseClient.auth.api.signInWithEmail(email, password).then((res) => {
      if (res?.error || !res.data?.user)
        return this.failure(res?.error?.message ?? 'No user found', req, sessionStorage, options)
      return this.success(res.data?.user, req, sessionStorage, options)
    }).catch((e) => {
      return this.failure(e?.message ?? 'Failed to authenticate', req, sessionStorage, options)
    })
  }

  // async isAuthenticated(
  //   req: Request,
  //   sessionStorage: SessionStorage,
  //   options: AuthenticateOptions,
  // ): Promise<SupabaseUser> {
  //   const token = (await sessionStorage.getSession())?.get(this.sessionKey) as string

  //   if (!token)
  //     return this.failure('No token present', req, sessionStorage, options)

  //   return this.supabaseClient.auth.api.getUser(token).then((res) => {
  //     if (res?.error || !res.user)
  //       return this.failure(res?.error?.message ?? 'No user found', req, sessionStorage, options)
  //     return this.success(res.user, req, sessionStorage, options)
  //   }).catch((e) => {
  //     return this.failure(e?.message ?? 'Failed to authenticate', req, sessionStorage, options)
  //   })
  // }
}
