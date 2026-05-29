import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, jsonRequest } from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';

describe('Users Router auth protection', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('GET /users requires authentication', async () => {
    const app = createTestApp();

    const res = await jsonRequest(app, '/users');

    expect(res.status).toBe(401);
  });

  it('GET /users/:id requires authentication', async () => {
    const app = createTestApp();

    const res = await jsonRequest(
      app,
      '/users/00000000-0000-0000-0000-000000000000',
    );

    expect(res.status).toBe(401);
  });

  it('POST /users requires authentication', async () => {
    const app = createTestApp();

    const res = await jsonRequest(app, '/users', {
      method: 'POST',
      body: { email: 'new@example.com', name: 'New', password: 'password123' },
    });

    expect(res.status).toBe(401);
  });

  it('PUT /users/:id requires authentication', async () => {
    const app = createTestApp();

    const res = await jsonRequest(
      app,
      '/users/00000000-0000-0000-0000-000000000000',
      { method: 'PUT', body: { name: 'Updated' } },
    );

    expect(res.status).toBe(401);
  });

  it('DELETE /users/:id requires authentication', async () => {
    const app = createTestApp();

    const res = await jsonRequest(
      app,
      '/users/00000000-0000-0000-0000-000000000000',
      { method: 'DELETE' },
    );

    expect(res.status).toBe(401);
  });
});
