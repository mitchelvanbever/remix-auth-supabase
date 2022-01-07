import { SupabaseStrategy } from '../index'
import { supabaseClient } from '../mocks/supabase'
import { sessionStorage } from '../mocks/sessionStorage'

describe('strategy', async() => {
  it('should throw if missing supabaseClient', async() => {
    expect.assertions(1)
    // @ts-ignore
    expect(() => new SupabaseStrategy()).toThrow('SupabaseStrategy : Constructor expected to receive a supabase client instance. Missing options.supabaseClient')
  })
  it('should throw if missing sessionStorage', async() => {
    expect.assertions(1)
    // @ts-ignore
    expect(() => new SupabaseStrategy({ supabaseClient })).toThrow('SupabaseStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage')
  })
  it('should throw if missing verify function', async() => {
    expect.assertions(1)
    // @ts-ignore
    expect(() => new SupabaseStrategy({ supabaseClient, sessionStorage })).toThrow('SupabaseStrategy : Constructor expected to receive a verify function. Missing verify')
  })
  it('should throw if missing verify function', async() => {
    expect.assertions(1)
    // @ts-ignore
    expect(() => new SupabaseStrategy({ supabaseClient, sessionStorage }, () => {})).not.toThrow()
  })
  it('should strategy provides default sessionKey and sessionErrorKey', async() => {
    expect.assertions(2)
    // @ts-ignore
    const supabaseStrategy = new SupabaseStrategy({ supabaseClient, sessionStorage }, () => {})
    expect(supabaseStrategy.sessionKey).toBe('sb:session')
    expect(supabaseStrategy.sessionErrorKey).toBe('sb:error')
  })
  it('should strategy provides custom sessionKey and sessionErrorKey', async() => {
    expect.assertions(2)
    // @ts-ignore
    const supabaseStrategy = new SupabaseStrategy({ supabaseClient, sessionStorage, sessionKey: '__session', sessionErrorKey: '__error' }, () => {})
    expect(supabaseStrategy.sessionKey).toBe('__session')
    expect(supabaseStrategy.sessionErrorKey).toBe('__error')
  })
})
