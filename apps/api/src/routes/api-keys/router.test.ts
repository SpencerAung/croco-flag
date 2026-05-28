import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthenticatedUser,
  createTestApp,
  jsonRequest,
} from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';
import type {
  CreatedProjectKeyResponse,
  ProjectKeyResponse,
} from './types';
import type { ProjectResponse } from '../projects/types';

async function createProject(
  app: ReturnType<typeof createTestApp>,
  authHeader: Record<string, string>,
  name = 'Test Project',
) {
  const res = await jsonRequest(app, '/projects', {
    method: 'POST',
    body: { name },
    headers: authHeader,
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create project: ${res.status}`);
  }
  return (await res.json()) as ProjectResponse;
}

describe('Project Keys Router', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /keys', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/keys', {
        method: 'POST',
        body: { name: 'k', type: 'secret', projectId: 'pid' },
      });

      expect(res.status).toBe(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/keys', {
        method: 'POST',
        body: {},
        headers: authHeader,
      });

      expect(res.status).toBe(400);
    });

    it('creates a key and returns the plaintext only on creation', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const res = await jsonRequest(app, '/keys', {
        method: 'POST',
        body: {
          name: 'Production',
          type: 'secret',
          projectId: project.data.id,
        },
        headers: authHeader,
      });

      expect(res.status).toBe(201);
      const json = (await res.json()) as CreatedProjectKeyResponse;

      expect(json.data.name).toBe('Production');
      expect(json.data.type).toBe('secret');
      expect(json.data.projectId).toBe(project.data.id);
      expect(json.data.keyPrefix).toBeTruthy();
      expect(json.data.key).toBeTruthy();
      expect(json.data.key.startsWith(json.data.keyPrefix)).toBe(true);
      expect(json.data.createdBy).toBeTruthy();
      expect('keyHash' in json.data).toBe(false);
    });
  });

  describe('GET /keys/:id', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(
        app,
        '/keys/00000000-0000-0000-0000-000000000000',
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent key', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/keys/00000000-0000-0000-0000-000000000000',
        { headers: authHeader },
      );

      expect(res.status).toBe(404);
    });

    it('returns the key without the plaintext or keyHash', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const createRes = await jsonRequest(app, '/keys', {
        method: 'POST',
        body: {
          name: 'Reads only',
          type: 'publishable',
          projectId: project.data.id,
        },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as CreatedProjectKeyResponse;

      const res = await jsonRequest(app, `/keys/${created.data.id}`, {
        headers: authHeader,
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as ProjectKeyResponse;
      expect(json.data.id).toBe(created.data.id);
      expect(json.data.name).toBe('Reads only');
      expect(json.data.keyPrefix).toBe(created.data.keyPrefix);
      expect('key' in json.data).toBe(false);
      expect('keyHash' in json.data).toBe(false);
    });
  });

  describe('POST /keys/:id/revoke', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(
        app,
        '/keys/00000000-0000-0000-0000-000000000000/revoke',
        { method: 'POST' },
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent key', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/keys/00000000-0000-0000-0000-000000000000/revoke',
        { method: 'POST', headers: authHeader },
      );

      expect(res.status).toBe(404);
    });

    it('sets revokedAt and revokedBy', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const createRes = await jsonRequest(app, '/keys', {
        method: 'POST',
        body: {
          name: 'To revoke',
          type: 'secret',
          projectId: project.data.id,
        },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as CreatedProjectKeyResponse;

      const res = await jsonRequest(
        app,
        `/keys/${created.data.id}/revoke`,
        { method: 'POST', headers: authHeader },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as ProjectKeyResponse;
      expect(json.data.id).toBe(created.data.id);
      expect(json.data.revokedAt).toBeTruthy();
      expect(json.data.revokedBy).toBeTruthy();
    });
  });
});
