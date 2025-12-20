import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, jsonRequest } from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';

interface SetupStatusResponse {
  data: { initialized: boolean };
}

interface UserResponse {
  data: {
    id: string;
    email: string;
    name: string;
    passwordHash?: string;
  };
}

interface ErrorResponse {
  error: string;
}

describe('Setup Router', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /setup/status', () => {
    it('returns initialized: false when no users exist', async () => {
      const app = createTestApp();

      const res = await app.request('/setup/status');
      const json = (await res.json()) as SetupStatusResponse;

      expect(res.status).toBe(200);
      expect(json.data.initialized).toBe(false);
    });

    it('returns initialized: true when users exist', async () => {
      const app = createTestApp();

      // Create first user
      await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'admin@test.com',
          name: 'Admin',
          password: 'password123',
        },
      });

      const res = await app.request('/setup/status');
      const json = (await res.json()) as SetupStatusResponse;

      expect(res.status).toBe(200);
      expect(json.data.initialized).toBe(true);
    });
  });

  describe('POST /setup/init', () => {
    it('creates the first user successfully', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'admin@test.com',
          name: 'Admin User',
          password: 'securepass123',
        },
      });

      expect(res.status).toBe(201);

      const json = (await res.json()) as UserResponse;
      expect(json.data.email).toBe('admin@test.com');
      expect(json.data.name).toBe('Admin User');
      expect(json.data.passwordHash).toBeUndefined();
    });

    it('returns 403 when users already exist', async () => {
      const app = createTestApp();

      // Create first user
      await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'admin@test.com',
          name: 'Admin',
          password: 'password123',
        },
      });

      // Attempt to create second user via setup
      const res = await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'admin2@test.com',
          name: 'Admin 2',
          password: 'password123',
        },
      });

      expect(res.status).toBe(403);

      const json = (await res.json()) as ErrorResponse;
      expect(json.error).toBe('System already initialized');
    });

    it('validates required fields', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'admin@test.com',
          // missing name and password
        },
      });

      expect(res.status).toBe(400);
    });

    it('validates email format', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'not-an-email',
          name: 'Admin',
          password: 'password123',
        },
      });

      expect(res.status).toBe(400);
    });

    it('validates password minimum length', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/setup/init', {
        method: 'POST',
        body: {
          email: 'admin@test.com',
          name: 'Admin',
          password: 'short',
        },
      });

      expect(res.status).toBe(400);
    });
  });
});
