import { describe, expect, it } from 'vitest'

import { SupabaseStrategy } from '../index'
import { supabaseClient } from '../mocks/supabase'
import { sessionStorage } from '../mocks/sessionStorage'
import { verify } from '../mocks/authenticator'

describe('strategy', () => {
  it('should throw if missing supabaseClient', () => {
    // @ts-expect-error test
    expect(() => new SupabaseStrategy()).toThrow(
      'SupabaseStrategy : Constructor expected to receive a supabase client instance. Missing options.supabaseClient'
    )
  })
  it('should throw if missing sessionStorage', () => {
    // @ts-expect-error test
    expect(() => new SupabaseStrategy({ supabaseClient })).toThrow(
      'SupabaseStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage'
    )
  })
  it('should throw if missing verify function', () => {
    expect(
      () =>
        // @ts-expect-error test
        new SupabaseStrategy({
          supabaseClient,
          sessionStorage,
          refreshFailureRedirect: '/login',
          refreshRoutePath: '/refresh',
        })
    ).toThrow(
      'SupabaseStrategy : Constructor expected to receive a verify function. Missing verify'
    )
  })
  it('should throw if missing refreshFailureRedirect', () => {
    expect(
      () =>
        new SupabaseStrategy(
          // @ts-expect-error test
          { supabaseClient, sessionStorage, refreshRoutePath: '/refresh' },
          verify
        )
    ).toThrow(
      'SupabaseStrategy : Constructor expected to receive a refreshFailureRedirect value. Missing options.refreshFailureRedirect'
    )
  })
  it('should throw if missing refreshRoutePath', () => {
    expect(
      () =>
        new SupabaseStrategy(
          // @ts-expect-error test
          { supabaseClient, sessionStorage, refreshFailureRedirect: '/login' },
          verify
        )
    ).toThrow(
      'SupabaseStrategy : Constructor expected to receive a refreshRoutePath value. Missing options.refreshRoutePath'
    )
  })
  it('should provide an instance', () => {
    expect(
      () =>
        new SupabaseStrategy(
          {
            supabaseClient,
            sessionStorage,
            refreshFailureRedirect: '/login',
            refreshRoutePath: '/refresh',
          },
          verify
        )
    ).not.toThrow()
  })
  it('should provide a default sessionKey and sessionErrorKey', () => {
    const supabaseStrategy = new SupabaseStrategy(
      {
        supabaseClient,
        sessionStorage,
        refreshFailureRedirect: '/login',
        refreshRoutePath: '/refresh',
      },
      verify
    )
    expect(supabaseStrategy.sessionKey).toBe('sb:session')
    expect(supabaseStrategy.sessionErrorKey).toBe('sb:error')
  })
  it('should provide a custom sessionKey and sessionErrorKey', () => {
    const supabaseStrategy = new SupabaseStrategy(
      {
        supabaseClient,
        sessionStorage,
        sessionKey: '__session',
        sessionErrorKey: '__error',
        refreshFailureRedirect: '/login',
        refreshRoutePath: '/refresh',
      },
      verify
    )
    expect(supabaseStrategy.sessionKey).toBe('__session')
    expect(supabaseStrategy.sessionErrorKey).toBe('__error')
  })
})
