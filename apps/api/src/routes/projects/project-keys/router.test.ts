import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestApp,
  jsonRequest,
  createAuthenticatedUser,
} from '../../../test/helpers';
import { cleanDatabase } from '../../../test/setup';
import type { ProjectResponse } from '../types';

interface ProjectKey {
  id: string;
  projectId: string;
  name: string;
}

interface ProjectKeyListResponse {
  data: ProjectKey[];
}

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
      const projectA = (await projectARes.json()) as ProjectResponse;

      const projectBRes = await jsonRequest(app, '/projects', {
        method: 'POST',
        body: { name: 'Project B' },
        headers: authHeader,
      });
      const projectB = (await projectBRes.json()) as ProjectResponse;

      await jsonRequest(app, `/projects/${projectA.data.id}/keys`, {
        method: 'POST',
        body: { name: 'A key', type: 'secret' },
        headers: authHeader,
      });
      await jsonRequest(app, `/projects/${projectB.data.id}/keys`, {
        method: 'POST',
        body: { name: 'B key', type: 'secret' },
        headers: authHeader,
      });

      const res = await app.request(`/projects/${projectA.data.id}/keys`, {
        headers: authHeader,
      });
      const json = (await res.json()) as ProjectKeyListResponse;

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].projectId).toBe(projectA.data.id);
      expect(json.data[0].name).toBe('A key');
    });
  });
});
