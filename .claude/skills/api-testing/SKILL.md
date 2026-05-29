---
name: api-testing
description: Write or migrate tests under apps/api using `jsonRequest` + schema-derived response types instead of inline literal `as` casts on `res.json()`. Use when adding, editing, or reviewing files matching `apps/api/**/*.test.ts`, when touching `apps/api/src/test/helpers.ts`, or when the user mentions API tests, route tests, or response type casts.
---

# API test (apps/api)

Tests in `apps/api` must derive response types from the route's Zod schema — never from hand-written inline shapes.

## The rule

- **Do** use `jsonRequest(app, path, { method, body, headers })` from `../../test/helpers`.
- **Do** cast `res.json()` to a type exported from the route's `types.ts`, where that type is `z.infer<typeof someResponseSchema>` over a schema defined in the route's `schema.ts`.
- **Don't** write inline literal casts like `(await res.json()) as { data: { token: string } }` — they're disconnected from the schema and silently rot when the route changes.
- **Don't** reach for `testClient` / Hono RPC. That pattern requires every router to be chained (`new Hono().get().post()`), which we don't want as a project-wide constraint. See *Why not testClient* below.

## Reference pattern

[apps/api/src/routes/auth/router.test.ts](apps/api/src/routes/auth/router.test.ts):

```ts
import { jsonRequest, createTestApp } from '../../test/helpers';
import type { TokenResponse, AuthErrorResponse } from './types';

const res = await jsonRequest(app, '/auth/token', {
  method: 'POST',
  body: { email, password },
});

expect(res.status).toBe(200);
const json = (await res.json()) as TokenResponse;
expect(json.data.token).toBeTruthy();
```

Where the types are derived end-to-end from Zod:

```ts
// auth/schema.ts
export const tokenResponseSchema = z.object({
  data: z.object({
    token: z.string(),
    expiresIn: z.number(),
    user: sanitizedUserSchema,
  }),
});

// auth/types.ts
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
```

Change the schema → the type changes → the test breaks at compile time. Same propagation guarantee as `testClient`, with no router-shape constraint.

## Writing a new test

1. Make sure the route has a Zod response schema in its `schema.ts`. If the route doesn't have one yet, add it — and wire it into `describeRoute(...)` on the handler so OpenAPI sees the same shape.
2. Export the inferred TS type from the route's `types.ts`: `export type FooResponse = z.infer<typeof fooResponseSchema>;`.
3. In the test, call `jsonRequest(app, path, { method, body, headers })`.
4. Assert the status with `expect(res.status).toBe(...)`.
5. Cast `await res.json()` to the imported type and assert against it.
6. For request bodies that intentionally violate the validator, just pass the bad body — there's no client-side type to fight.

## Bad patterns to flag in review

```ts
// Inline literal cast — rots silently
const json = (await res.json()) as { data: { token: string } };

// Untyped — every field is `any`
const json = await res.json();
expect(json.data.token).toBeTruthy();

// Casting to a hand-written type that's not derived from the schema
type TokenShape = { data: { token: string; expiresIn: number } };
const json = (await res.json()) as TokenShape;
```

All three drift from the schema. The fix is the same: derive the type from `z.infer<typeof responseSchema>` and import it.

## Why not `testClient`

`testClient(app)` only carries route types through if every router in the chain uses the `return new Hono().get(...).post(...)` form. Mixing that with the imperative `const r = new Hono(); r.get(...); r.post(...);` style — which most routers in this repo use — silently drops routes from the inferred `AppType`. We don't want to enforce the chained style across every router, so we use schema-derived casts instead.

## Escape hatch

If a route genuinely returns `unknown` (e.g. a passthrough), fix the route's response schema first. Only fall back to an inline cast inside the test if the schema cannot reasonably be tightened, and leave a one-line comment explaining why.
