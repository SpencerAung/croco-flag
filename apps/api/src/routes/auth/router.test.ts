import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthenticatedUser,
  createTestApp,
  jsonRequest,
} from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';
import type { AuthErrorResponse, MeResponse, TokenResponse } from './types';

describe('Auth Router', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /auth/token', () => {
    it('returns 400 when body is missing required fields', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/auth/token', {
        method: 'POST',
        body: {},
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when email is not a valid format', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/auth/token', {
        method: 'POST',
        body: { email: 'not-an-email', password: 'password123' },
      });

      expect(res.status).toBe(400);
    });

    it('returns 401 when user does not exist', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/auth/token', {
        method: 'POST',
        body: { email: 'missing@example.com', password: 'password123' },
      });

      expect(res.status).toBe(401);
      const json = (await res.json()) as AuthErrorResponse;
      expect(json.error).toBe('Unauthorized');
    });

    it('returns 401 when password is incorrect', async () => {
      const app = createTestApp();
      await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/auth/token', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'wrong-password' },
      });

      expect(res.status).toBe(401);
    });

    it('returns a token and sanitized user on valid credentials', async () => {
      const app = createTestApp();
      await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/auth/token', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123' },
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as TokenResponse;

      expect(json.data.token).toBeTruthy();
      expect(typeof json.data.expiresIn).toBe('number');
      expect(json.data.user.email).toBe('test@example.com');
      expect('passwordHash' in json.data.user).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/auth/me');

      expect(res.status).toBe(401);
    });

    it('returns 401 when Authorization header is not Bearer scheme', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/auth/me', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/auth/me', {
        headers: { Authorization: 'Bearer not-a-real-token' },
      });

      expect(res.status).toBe(401);
    });

    it('returns the sanitized current user for a valid token', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/auth/me', { headers: authHeader });

      expect(res.status).toBe(200);
      const json = (await res.json()) as MeResponse;

      expect(json.data.email).toBe('test@example.com');
      expect(json.data.name).toBe('Test User');
      expect('passwordHash' in json.data).toBe(false);
    });

    it('returns 401 when the token is valid but the user no longer exists', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      // Wipe the user the token was issued for; the JWT itself is still valid.
      await cleanDatabase();

      const res = await jsonRequest(app, '/auth/me', { headers: authHeader });

      expect(res.status).toBe(401);
    });
  });
});
