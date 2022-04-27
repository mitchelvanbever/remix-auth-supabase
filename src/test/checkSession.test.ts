import { matchRequestUrl } from 'msw';
import { describe, expect, it } from 'vitest';
import { supabaseStrategy } from '../mocks/authenticator';
import { SESSION_KEY } from '../mocks/constants';
import { validResponse } from '../mocks/handlers';
import { authenticatedReq } from '../mocks/requests';
import { server } from '../mocks/server';
import { sessionStorage } from '../mocks/sessionStorage';
import { concurrentUserA, concurrentUserB, user } from '../mocks/user';

describe('[external export] revalidate', async () => {
  it('should redirect if cookie is not set', async () => {
    expect.assertions(2);
    await supabaseStrategy
      .checkSession(new Request(''), {
        failureRedirect: '/login'
      })
      .catch((res) => {
        expect(res.status).toBe(302);
        expect(res.headers.get('Location')).toEqual('/login');
      });
  });
  it('should return null if no cookie is set', async () => {
    expect.assertions(1);
    await supabaseStrategy.checkSession(new Request('')).then((res) => expect(res).toBe(null));
  });
  it('should redirect if cookie is set', async () => {
    expect.assertions(2);
    const req = await authenticatedReq();

    await supabaseStrategy
      .checkSession(req, {
        successRedirect: '/login'
      })
      .catch(async (res) => {
        // should check if the headers are being flashed
        expect(res.headers.get('Set-Cookie')).toBeDefined();
        expect(res.status).toBe(302);
      });
  });
  it('should return session if cookie is set', async () => {
    expect.assertions(1);
    const req = await authenticatedReq();

    await supabaseStrategy
      .checkSession(req, {
        failureRedirect: '/login'
      })
      .then((session) => expect(session).toEqual({ ...validResponse, user: { id: user.id } }));
  });
  it('should return null if refresh token fails', async () => {
    expect.assertions(1);
    const req = await authenticatedReq(new Request('https://localhost'), {
      user,
      access_token: 'expired',
      refresh_token: 'invalid',
      token_type: 'grant'
    });

    await supabaseStrategy.checkSession(req).then((res) => expect(res).toBe(null));
  });
  it('should refresh the token with a valid refresh token', async () => {
    expect.assertions(3);
    const req = await authenticatedReq(new Request('https://localhost/profile'), {
      user,
      access_token: 'expired',
      refresh_token: 'userA',
      token_type: 'grant'
    });

    await supabaseStrategy.checkSession(req).catch(async (error) => {
      const cookies = (await sessionStorage.getSession(error.headers.get('Set-Cookie')))?.data;
      expect(cookies?.[SESSION_KEY]).toEqual({
        ...validResponse,
        user: { id: concurrentUserA.id }
      });
      expect(error.status).toEqual(302);
      expect(error.headers.get('Location')).toEqual('/profile');
    });
  });
  it('should refresh the token with a valid refresh token and redirect if successRedirect is set', async () => {
    expect.assertions(3);
    const req = await authenticatedReq(new Request('https://localhost'), {
      user,
      access_token: 'expired',
      refresh_token: 'userA',
      token_type: 'grant'
    });

    await supabaseStrategy.checkSession(req, { successRedirect: '/dashboard' }).catch(async (error) => {
      const cookies = (await sessionStorage.getSession(error.headers.get('Set-Cookie')))?.data;
      expect(cookies?.[SESSION_KEY]).toEqual({
        ...validResponse,
        user: {
          id: concurrentUserA.id
        }
      });
      expect(error.status).toEqual(302);
      expect(error.headers.get('Location')).toEqual('/dashboard');
    });
  });
  it('should handles simultaneous refresh token', async () => {
    expect.assertions(1);
    const sendRequests = new Map();

    server.events.on('request:start', (req) => {
      const matchesMethod = req.method === 'POST';
      const matchesUrl = matchRequestUrl(
        req.url,
        '/supabase-project/auth/v1/token?grant_type=refresh_token',
        'http://supabase-url.com'
      ).matches;

      if (matchesMethod && matchesUrl) sendRequests.set(req.id, req);
    });

    const req = await authenticatedReq(new Request('https://localhost'), {
      user: concurrentUserA,
      access_token: 'expired',
      refresh_token: 'userA',
      token_type: 'grant'
    });

    const otherReq = await authenticatedReq(new Request('https://localhost'), {
      user: concurrentUserB,
      access_token: 'expired',
      refresh_token: 'userB',
      token_type: 'grant'
    });

    await Promise.all([
      supabaseStrategy.checkSession(otherReq).catch(() => {}),
      supabaseStrategy.checkSession(req).catch(() => {}),
      supabaseStrategy.checkSession(req).catch(() => {}),
      supabaseStrategy.checkSession(otherReq).catch(() => {}),
      supabaseStrategy.checkSession(otherReq).catch(() => {}),
      supabaseStrategy.checkSession(otherReq).catch(() => {}),
      supabaseStrategy.checkSession(otherReq).catch(() => {}),
      supabaseStrategy.checkSession(otherReq).catch(() => {})
    ]);

    server.events.removeAllListeners();

    expect(sendRequests.size).toEqual(2);
  });
});
