import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthenticatedUser,
  createTestApp,
  jsonRequest,
} from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';
import type { FlagResponse } from './types';
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

describe('Flags Router', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /flags', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/flags', {
        method: 'POST',
        body: { key: 'k', name: 'n', projectId: 'pid' },
      });

      expect(res.status).toBe(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/flags', {
        method: 'POST',
        body: {},
        headers: authHeader,
      });

      expect(res.status).toBe(400);
    });

    it('creates a flag with createdBy and updatedBy set', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const res = await jsonRequest(app, '/flags', {
        method: 'POST',
        body: {
          key: 'dark-mode',
          name: 'Dark Mode',
          description: 'Enable dark mode',
          projectId: project.data.id,
        },
        headers: authHeader,
      });

      expect(res.status).toBe(201);
      const json = (await res.json()) as FlagResponse;

      expect(json.data.key).toBe('dark-mode');
      expect(json.data.name).toBe('Dark Mode');
      expect(json.data.projectId).toBe(project.data.id);
      expect(json.data.createdBy).toBeTruthy();
      expect(json.data.updatedBy).toBeTruthy();
      expect(json.data.isArchived).toBe(false);
    });
  });

  describe('GET /flags/:id', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(
        app,
        '/flags/00000000-0000-0000-0000-000000000000',
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent flag', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/flags/00000000-0000-0000-0000-000000000000',
        { headers: authHeader },
      );

      expect(res.status).toBe(404);
    });

    it('returns the flag for a valid id', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const createRes = await jsonRequest(app, '/flags', {
        method: 'POST',
        body: {
          key: 'feature-x',
          name: 'Feature X',
          projectId: project.data.id,
        },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as FlagResponse;

      const res = await jsonRequest(app, `/flags/${created.data.id}`, {
        headers: authHeader,
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as FlagResponse;
      expect(json.data.id).toBe(created.data.id);
      expect(json.data.key).toBe('feature-x');
    });
  });

  describe('PUT /flags/:id', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(
        app,
        '/flags/00000000-0000-0000-0000-000000000000',
        { method: 'PUT', body: { name: 'New' } },
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent flag', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/flags/00000000-0000-0000-0000-000000000000',
        {
          method: 'PUT',
          body: { name: 'New' },
          headers: authHeader,
        },
      );

      expect(res.status).toBe(404);
    });

    it('updates flag fields and sets updatedBy', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const createRes = await jsonRequest(app, '/flags', {
        method: 'POST',
        body: {
          key: 'feature-y',
          name: 'Original',
          enabled: false,
          projectId: project.data.id,
        },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as FlagResponse;

      const res = await jsonRequest(app, `/flags/${created.data.id}`, {
        method: 'PUT',
        body: {
          name: 'Updated Name',
          description: 'Updated description',
          enabled: true,
        },
        headers: authHeader,
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as FlagResponse;
      expect(json.data.name).toBe('Updated Name');
      expect(json.data.description).toBe('Updated description');
      expect(json.data.enabled).toBe(true);
      expect(json.data.updatedBy).toBeTruthy();
    });
  });

  describe('POST /flags/:id/archive', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(
        app,
        '/flags/00000000-0000-0000-0000-000000000000/archive',
        { method: 'POST' },
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent flag', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/flags/00000000-0000-0000-0000-000000000000/archive',
        { method: 'POST', headers: authHeader },
      );

      expect(res.status).toBe(404);
    });

    it('archives a flag and sets archivedBy/archivedAt', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const project = await createProject(app, authHeader);

      const createRes = await jsonRequest(app, '/flags', {
        method: 'POST',
        body: {
          key: 'to-archive',
          name: 'To archive',
          projectId: project.data.id,
        },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as FlagResponse;

      const res = await jsonRequest(
        app,
        `/flags/${created.data.id}/archive`,
        { method: 'POST', headers: authHeader },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as FlagResponse;
      expect(json.data.isArchived).toBe(true);
      expect(json.data.archivedAt).toBeTruthy();
      expect(json.data.archivedBy).toBeTruthy();
    });
  });
});
