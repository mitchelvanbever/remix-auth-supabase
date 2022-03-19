import type { User } from '@supabase/supabase-js'
import { internet } from '@faker-js/faker'

export const password = internet.password()
export const email = internet.email()
export const user: Partial<User> = {
  email,
  id: '05ae8d59-49f0-5a69-b014-af9aec9cc90d',
}
