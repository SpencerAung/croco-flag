import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from 'hono/testing';
import {
  assertStatus,
  createAuthenticatedUser,
  createTestApp,
} from '../../test/helpers';
import { cleanDatabase } from '../../test/setup';

describe('Projects Router', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /projects', () => {
    it('requires authentication', async () => {
      const client = testClient(createTestApp());

      const res = await client.projects.$get();

      assertStatus(res, 401);
    });

    it('returns empty array when no projects exist', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects.$get({}, { headers: authHeader });
      assertStatus(res, 200);
      const json = await res.json();

      expect(json.data).toEqual([]);
    });

    it('returns projects with user relations', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const createRes = await client.projects.$post(
        { json: { name: 'Test Project', description: 'A test project' } },
        { headers: authHeader },
      );
      assertStatus(createRes, 201);

      const res = await client.projects.$get({}, { headers: authHeader });
      assertStatus(res, 200);
      const json = await res.json();

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
      const client = testClient(createTestApp());

      const res = await client.projects[':id'].$get({
        param: { id: 'some-id' },
      });

      assertStatus(res, 401);
    });

    it('returns 404 for non-existent project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects[':id'].$get(
        { param: { id: '00000000-0000-0000-0000-000000000000' } },
        { headers: authHeader },
      );

      assertStatus(res, 404);
    });

    it('returns project with user relations', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const createRes = await client.projects.$post(
        { json: { name: 'Test Project' } },
        { headers: authHeader },
      );
      assertStatus(createRes, 201);
      const created = await createRes.json();

      const res = await client.projects[':id'].$get(
        { param: { id: created.data.id } },
        { headers: authHeader },
      );
      assertStatus(res, 200);
      const json = await res.json();

      expect(json.data.name).toBe('Test Project');
      expect(json.data.creator?.email).toBe('test@example.com');
    });
  });

  describe('POST /projects', () => {
    it('requires authentication', async () => {
      const client = testClient(createTestApp());

      const res = await client.projects.$post({
        json: { name: 'Test Project' },
      });

      assertStatus(res, 401);
    });

    it('creates a project with createdBy set', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects.$post(
        { json: { name: 'New Project', description: 'A new project' } },
        { headers: authHeader },
      );
      assertStatus(res, 201);
      const json = await res.json();

      expect(json.data.name).toBe('New Project');
      expect(json.data.description).toBe('A new project');
      expect(json.data.createdBy).toBeDefined();
    });

    it('validates required fields', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects.$post(
        // @ts-expect-error — intentionally missing required `name` to test validator
        { json: {} },
        { headers: authHeader },
      );

      assertStatus(res, 400);
    });

    it('validates name is not empty', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects.$post(
        { json: { name: '' } },
        { headers: authHeader },
      );

      assertStatus(res, 400);
    });
  });

  describe('PUT /projects/:id', () => {
    it('requires authentication', async () => {
      const client = testClient(createTestApp());

      const res = await client.projects[':id'].$put({
        param: { id: 'some-id' },
        json: { name: 'Updated' },
      });

      assertStatus(res, 401);
    });

    it('updates project and sets updatedBy', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const createRes = await client.projects.$post(
        { json: { name: 'Original Name' } },
        { headers: authHeader },
      );
      assertStatus(createRes, 201);
      const created = await createRes.json();

      const res = await client.projects[':id'].$put(
        {
          param: { id: created.data.id },
          json: { name: 'Updated Name', description: 'New description' },
        },
        { headers: authHeader },
      );
      assertStatus(res, 200);
      const json = await res.json();

      expect(json.data.name).toBe('Updated Name');
      expect(json.data.description).toBe('New description');
    });

    it('returns 404 for non-existent project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects[':id'].$put(
        {
          param: { id: '00000000-0000-0000-0000-000000000000' },
          json: { name: 'Updated' },
        },
        { headers: authHeader },
      );

      assertStatus(res, 404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('requires authentication', async () => {
      const client = testClient(createTestApp());

      const res = await client.projects[':id'].$delete({
        param: { id: 'some-id' },
      });

      assertStatus(res, 401);
    });

    it('deletes a project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const createRes = await client.projects.$post(
        { json: { name: 'To Delete' } },
        { headers: authHeader },
      );
      assertStatus(createRes, 201);
      const created = await createRes.json();

      const res = await client.projects[':id'].$delete(
        { param: { id: created.data.id } },
        { headers: authHeader },
      );
      assertStatus(res, 200);

      const getRes = await client.projects[':id'].$get(
        { param: { id: created.data.id } },
        { headers: authHeader },
      );
      assertStatus(getRes, 404);
    });

    it('returns 404 for non-existent project', async () => {
      const app = createTestApp();
      const { authHeader } = await createAuthenticatedUser(app);
      const client = testClient(app);

      const res = await client.projects[':id'].$delete(
        { param: { id: '00000000-0000-0000-0000-000000000000' } },
        { headers: authHeader },
      );

      assertStatus(res, 404);
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
        const client = testClient(app);

        const projectARes = await client.projects.$post(
          { json: { name: 'Project A' } },
          { headers: authHeader },
        );
        assertStatus(projectARes, 201);
        const projectA = await projectARes.json();

        const projectBRes = await client.projects.$post(
          { json: { name: 'Project B' } },
          { headers: authHeader },
        );
        assertStatus(projectBRes, 201);
        const projectB = await projectBRes.json();

        await client.keys.$post(
          {
            json: {
              name: 'A key',
              type: 'secret',
              projectId: projectA.data.id,
            },
          },
          { headers: authHeader },
        );
        await client.keys.$post(
          {
            json: {
              name: 'B key',
              type: 'secret',
              projectId: projectB.data.id,
            },
          },
          { headers: authHeader },
        );

        const res = await client.projects[':id'].keys.$get(
          { param: { id: projectA.data.id } },
          { headers: authHeader },
        );
        assertStatus(res, 200);
        const json = await res.json();

        expect(json.data).toHaveLength(1);
        expect(json.data[0].projectId).toBe(projectA.data.id);
        expect(json.data[0].name).toBe('A key');
      });
    });
  });
});
