import { describe, expect, it } from 'vitest';
import { authenticator } from '../mocks/authenticator';
import { validResponse } from '../mocks/handlers';
import { authenticatedReq } from '../mocks/requests';
import { user } from '../mocks/user';

describe('isAuthenticated', async () => {
  it('should return null', async () => {
    const isAuthenticated = await authenticator.isAuthenticated(new Request(''));
    expect(isAuthenticated).toBe(null);
  });
  it('should redirect when failureRedirect is defined', async () => {
    expect.assertions(1);
    await authenticator
      .isAuthenticated(new Request(''), { failureRedirect: '/error' })
      .catch((res: Response) => expect(res.status).toBe(302));
  });
  it('should redirect when successRedirect is defined', async () => {
    const req = await authenticatedReq();
    expect.assertions(1);
    await authenticator
      .isAuthenticated(req, { successRedirect: '/profile' })
      .catch((res: Response) => expect(res.status).toBe(302));
  });
  it('should return the session', async () => {
    const req = await authenticatedReq();
    const isAuthenticated = await authenticator.isAuthenticated(req);
    expect(isAuthenticated).toEqual({ ...validResponse, user: { id: user.id } });
  });
});
