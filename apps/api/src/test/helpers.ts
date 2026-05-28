import type { Hono } from 'hono';
import { testDb } from './db';
import createApp from '../app';

export function createTestApp() {
  return createApp(testDb);
}

// Accept any Hono shape so the typed AppType from createApp flows through.
type AnyHono = Hono<any, any, any>;

export function assertStatus<R extends { status: number }, S extends number>(
  res: R,
  status: S,
): asserts res is R & { status: S } {
  if (res.status !== status) {
    throw new Error(`expected status ${status}, got ${res.status}`);
  }
}

export async function jsonRequest(
  app: AnyHono,
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
  app: AnyHono,
  user: { email: string; name: string; password: string } = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
  },
) {
  const setupRes = await jsonRequest(app, '/setup/init', {
    method: 'POST',
    body: user,
  });

  if (setupRes.status !== 201) {
    const error = await setupRes.json();
    throw new Error(`Failed to create user via setup: ${JSON.stringify(error)}`);
  }

  const tokenRes = await jsonRequest(app, '/auth/token', {
    method: 'POST',
    body: { email: user.email, password: user.password },
  });

  const tokenJson = (await tokenRes.json()) as { data?: { token: string }; error?: string };

  if (tokenRes.status !== 200 || !tokenJson.data) {
    throw new Error(`Failed to get auth token: ${JSON.stringify(tokenJson)}`);
  }

  return {
    user,
    token: tokenJson.data.token,
    authHeader: { Authorization: `Bearer ${tokenJson.data.token}` },
  };
}
