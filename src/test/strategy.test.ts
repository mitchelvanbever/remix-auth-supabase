import { SupabaseStrategy } from '../index'
import { supabaseClient } from '../mocks/supabase'
import { sessionStorage } from '../mocks/sessionStorage'

describe('strategy', async() => {
  it('should throw if missing supabaseClient', async() => {
    // @ts-ignore
    expect(() => new SupabaseStrategy()).toThrow('SupabaseStrategy : Constructor expected to receive a supabase client instance. Missing options.supabaseClient')
  })
  it('should throw if missing sessionStorage', async() => {
    // @ts-ignore
    expect(() => new SupabaseStrategy({ supabaseClient })).toThrow('SupabaseStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage')
  })
  it('should throw if missing verify function', async() => {
    // @ts-ignore
    expect(() => new SupabaseStrategy({ supabaseClient, sessionStorage })).toThrow('SupabaseStrategy : Constructor expected to receive a verify function. Missing verify')
  })
  it('should throw if missing verify function', async() => {
    // @ts-ignore
    expect(() => new SupabaseStrategy({ supabaseClient, sessionStorage }, () => {})).not.toThrow()
  })
})
