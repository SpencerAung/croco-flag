import { Hono } from 'hono';
import { testDb } from './db';
import createApp from '../app';

export function createTestApp() {
  return createApp(testDb);
}

export async function jsonRequest(
  app: Hono,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
) {
  const { method = 'GET', body, headers = {} } = options;

  return app.request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function createAuthenticatedUser(
  app: Hono,
  user: { email: string; name: string; password: string } = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
  },
) {
  await jsonRequest(app, '/setup/init', {
    method: 'POST',
    body: user,
  });

  const tokenRes = await jsonRequest(app, '/auth/token', {
    method: 'POST',
    body: { email: user.email, password: user.password },
  });

  const { data } = (await tokenRes.json()) as { data: { token: string } };
  return {
    user,
    token: data.token,
    authHeader: { Authorization: `Bearer ${data.token}` },
  };
}
