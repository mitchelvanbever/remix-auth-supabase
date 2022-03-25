import type { User } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

export const password = faker.internet.password()
export const email = faker.internet.email()
export const user: Partial<User> = {
  email,
}
