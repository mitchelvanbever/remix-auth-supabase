import { describe, expect, it } from 'vitest';
import { authenticator } from '../mocks/authenticator';
import { validResponse } from '../mocks/handlers';
import { password, user } from '../mocks/user';

const mockUrl = new URL('/test/authenticate', 'http://localhost');

describe('authenticate', async () => {
  it('should handle faulty requests', async () => {
    const fData = new FormData();

    expect.assertions(1);

    await authenticator
      .authenticate(
        'sb',
        new Request(mockUrl, {
          method: 'POST',
          body: fData
        })
      )
      .catch(async (e) => expect((await e.json())?.message).toEqual('Need a valid email and/or password'));
  });
  it('should handle wrong credentials', async () => {
    const fData = new FormData();
    fData.append('email', user.email!);
    fData.append('password', 'WrongPassword123');

    expect.assertions(1);

    await authenticator
      .authenticate(
        'sb',
        new Request(mockUrl, {
          method: 'POST',
          body: fData
        })
      )
      .catch(async (e) => expect(await e.json()).toEqual({ message: 'Wrong email or password' }));
  });
  it('should sign in and return the user', async () => {
    const fData = new FormData();

    fData.append('email', user.email!);
    fData.append('password', password);

    expect.assertions(1);
    await authenticator
      .authenticate(
        'sb',
        new Request(mockUrl, {
          method: 'POST',
          body: fData
        })
      )
      .then((res) => expect(res).toEqual({ ...validResponse, user: { id: user.id } }));
  });
});
