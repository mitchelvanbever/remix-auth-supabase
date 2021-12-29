import type { SessionStorage } from '@remix-run/server-runtime'
import type { Session, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticateOptions } from 'remix-auth'
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

export class SupabaseStrategy extends Strategy<Partial<Session>, never> {
  readonly name = 'SUPABASE_AUTH'
  private supabaseClient: SupabaseClient

  constructor(
    options: MyStrategyOptions,
    verify: never,
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
  ): Promise<Partial<Session>> {
    const formData = await req.formData()
    const email = formData.get('email')
    const password = formData.get('password')
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string')
      return this.failure('Need a valid email and/or password', req, sessionStorage, options)

    return this.supabaseClient.auth.api.signInWithEmail(email, password).then((res) => {
      if (res?.error || !res.data)
        return this.failure(res?.error?.message ?? 'No user found', req, sessionStorage, options)

      return this.success(res?.data, req, sessionStorage, options)
    })
  }
}
