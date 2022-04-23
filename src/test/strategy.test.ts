import { describe, expect, it } from 'vitest'

import { SupabaseStrategy } from '../index'
import { supabaseClient } from '../mocks/supabase'
import { sessionStorage } from '../mocks/sessionStorage'
import { verify } from '../mocks/authenticator'

describe('strategy', () => {
  it('should throw if missing supabaseClient', () => {
    // @ts-expect-error should throw if missing supabaseClient
    expect(() => new SupabaseStrategy()).toThrow('SupabaseStrategy : Constructor expected to receive a supabase client instance. Missing options.supabaseClient')
  })
  it('should throw if missing sessionStorage', () => {
    // @ts-expect-error missing sessionStorage
    expect(() => new SupabaseStrategy({ supabaseClient })).toThrow('SupabaseStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage')
  })
  it('should throw if missing verify function', () => {
    // @ts-expect-error missing verify function
    expect(() => new SupabaseStrategy({ supabaseClient, sessionStorage })).toThrow('SupabaseStrategy : Constructor expected to receive a verify function. Missing verify')
  })
  it('should provide an instance', () => {
    expect(() => new SupabaseStrategy({ supabaseClient, sessionStorage }, verify)).not.toThrow()
  })
  it('should provide a default sessionKey and sessionErrorKey', () => {
    const supabaseStrategy = new SupabaseStrategy({ supabaseClient, sessionStorage }, verify)
    expect(supabaseStrategy.sessionKey).toBe('sb:session')
    expect(supabaseStrategy.sessionErrorKey).toBe('sb:error')
  })
  it('should provide a custom sessionKey and sessionErrorKey', () => {
    const supabaseStrategy = new SupabaseStrategy({ supabaseClient, sessionStorage, sessionKey: '__session', sessionErrorKey: '__error' }, verify)
    expect(supabaseStrategy.sessionKey).toBe('__session')
    expect(supabaseStrategy.sessionErrorKey).toBe('__error')
  })
})
