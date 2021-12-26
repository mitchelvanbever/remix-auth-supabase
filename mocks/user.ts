import type { User } from '@supabase/supabase-js'
import { internet } from 'faker'

export const password = internet.password()
export const email = internet.email()
export const user: Partial<User> = {
  email,
}
