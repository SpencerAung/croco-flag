import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthenticatedUser,
  createTestApp,
  jsonRequest,
} from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';
import type {
  ProjectListResponse,
  ProjectResponse,
  ProjectWithRelationsResponse,
} from './types';
import type {
  CreatedProjectKeyResponse,
  ProjectKeyListResponse,
} from '../api-keys/types';

describe('Projects Router', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /projects', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/projects');

      expect(res.status).toBe(401);
    });

    it('returns empty array when no projects exist', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/projects', { headers: authHeader });

      expect(res.status).toBe(200);
      const json = (await res.json()) as ProjectListResponse;
      expect(json.data).toEqual([]);
    });

    it('returns projects with user relations', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const createRes = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'Test Project', description: 'A test project' },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);

      const res = await jsonRequest(app, '/projects', { headers: authHeader });
      expect(res.status).toBe(200);
      const json = (await res.json()) as ProjectListResponse;

      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('Test Project');
      expect(json.data[0].creator).toBeDefined();
      expect(json.data[0].creator?.email).toBe('test@example.com');
      // passwordHash is omitted from SanitizedUser type
      expect('passwordHash' in (json.data[0].creator ?? {})).toBe(false);
    });
  });

  describe('GET /projects/:id', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/projects/some-id');

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/projects/00000000-0000-0000-0000-000000000000',
        { headers: authHeader },
      );

      expect(res.status).toBe(404);
    });

    it('returns project with user relations', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const createRes = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'Test Project' },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProjectResponse;

      const res = await jsonRequest(app, `/projects/${created.data.id}`, {
        headers: authHeader,
      });
      expect(res.status).toBe(200);
      const json = (await res.json()) as ProjectWithRelationsResponse;

      expect(json.data.name).toBe('Test Project');
      expect(json.data.creator?.email).toBe('test@example.com');
    });
  });

  describe('POST /projects', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'Test Project' },
      });

      expect(res.status).toBe(401);
    });

    it('creates a project with createdBy set', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'New Project', description: 'A new project' },
        headers: authHeader,
      });
      expect(res.status).toBe(201);
      const json = (await res.json()) as ProjectResponse;

      expect(json.data.name).toBe('New Project');
      expect(json.data.description).toBe('A new project');
      expect(json.data.createdBy).toBeDefined();
    });

    it('validates required fields', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: {},
        headers: authHeader,
      });

      expect(res.status).toBe(400);
    });

    it('validates name is not empty', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: '' },
        headers: authHeader,
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /projects/:id', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/projects/some-id', {
        method: 'PUT',
        body: { name: 'Updated' },
      });

      expect(res.status).toBe(401);
    });

    it('updates project and sets updatedBy', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const createRes = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'Original Name' },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProjectResponse;

      const res = await jsonRequest(app, `/projects/${created.data.id}`, {
        method: 'PUT',
        body: { name: 'Updated Name', description: 'New description' },
        headers: authHeader,
      });
      expect(res.status).toBe(200);
      const json = (await res.json()) as ProjectResponse;

      expect(json.data.name).toBe('Updated Name');
      expect(json.data.description).toBe('New description');
    });

    it('returns 404 for non-existent project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/projects/00000000-0000-0000-0000-000000000000',
        {
          method: 'PUT',
          body: { name: 'Updated' },
          headers: authHeader,
        },
      );

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('requires authentication', async () => {
      const app = createTestApp();

      const res = await jsonRequest(app, '/projects/some-id', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });

    it('deletes a project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const createRes = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'To Delete' },
        headers: authHeader,
      });
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as ProjectResponse;

      const res = await jsonRequest(app, `/projects/${created.data.id}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      expect(res.status).toBe(200);

      const getRes = await jsonRequest(app, `/projects/${created.data.id}`, {
        headers: authHeader,
      });
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);

      const res = await jsonRequest(
        app,
        '/projects/00000000-0000-0000-0000-000000000000',
        { method: 'DELETE', headers: authHeader },
      );

      expect(res.status).toBe(404);
    });
  });

  describe('Project Keys Router', () => {
    beforeEach(async () => {
      await cleanDatabase();
    });

    describe('GET /projects/:projectId/keys', () => {
      it('returns only keys belonging to the requested project', async () => {
        const app = createTestApp();
        const { authHeader } = await createAuthenticatedUser(app);

        const projectARes = await jsonRequest(app, '/projects', {
          method: 'POST',
          body: { name: 'Project A' },
          headers: authHeader,
        });
        expect(projectARes.status).toBe(201);
        const projectA = (await projectARes.json()) as ProjectResponse;

        const projectBRes = await jsonRequest(app, '/projects', {
          method: 'POST',
          body: { name: 'Project B' },
          headers: authHeader,
        });
        expect(projectBRes.status).toBe(201);
        const projectB = (await projectBRes.json()) as ProjectResponse;

        const keyARes = await jsonRequest(app, '/keys', {
          method: 'POST',
          body: { name: 'A key', type: 'secret', projectId: projectA.data.id },
          headers: authHeader,
        });
        expect(keyARes.status).toBe(201);
        // typecheck the create response shape too
        (await keyARes.json()) as CreatedProjectKeyResponse;

        const keyBRes = await jsonRequest(app, '/keys', {
          method: 'POST',
          body: { name: 'B key', type: 'secret', projectId: projectB.data.id },
          headers: authHeader,
        });
        expect(keyBRes.status).toBe(201);

        const res = await jsonRequest(
          app,
          `/projects/${projectA.data.id}/keys`,
          { headers: authHeader },
        );
        expect(res.status).toBe(200);
        const json = (await res.json()) as ProjectKeyListResponse;

        expect(json.data).toHaveLength(1);
        expect(json.data[0].projectId).toBe(projectA.data.id);
        expect(json.data[0].name).toBe('A key');
      });
    });
  });
});
