import type { User } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

export const password = faker.internet.password();
export const email = faker.internet.email();
export const user: Partial<User> = {
  id: faker.datatype.uuid(),
  email
};

export const concurrentUserA: Partial<User> = {
  id: faker.datatype.uuid(),
  email: faker.internet.email()
};

export const concurrentUserB: Partial<User> = {
  id: faker.datatype.uuid(),
  email: faker.internet.email()
};
