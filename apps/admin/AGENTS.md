### Next.js (App Router)

- Use Server Components by default, add 'use client' only when needed
- Keep Server Components async when fetching data
- Use route handlers (`route.ts`) for API endpoints in app directory
- Use loading.tsx for loading states
- Use error.tsx for error boundaries
- Prefer `async/await` over `.then()` chains
- Use `next/link` for client-side navigation
- Use `next/image` for optimized images
- Place shared components in `src/components/`
- Use co-location for component-specific files (component.tsx, component.test.tsx, component.module.css)

### React

- Use functional components with hooks
- Extract custom hooks for reusable logic (prefix with `use`)
- Keep components small and focused (max 200-300 lines)
- Use React.memo() sparingly, only for expensive re-renders
- Prefer composition over inheritance
- Handle loading and error states explicitly
- Use proper TypeScript types for props (not PropTypes in TS)

### State Management

- Use React hooks (useState, useReducer) for local state
- Use Server Components for server state
- Consider React Context for shared client state
- Avoid prop drilling (use Context or composition)

**Global State Organization:**

```
apps/admin/src/
├── stores/                 # Global state stores (Jotai)
│   ├── authStore.ts       # Auth state
│   ├── uiStore.ts         # UI state (theme, sidebar, modals)
│   └── settingsStore.ts   # User preferences
├── providers/              # React Context providers
│   ├── AuthProvider.tsx   # Auth context provider
│   ├── ThemeProvider.tsx  # Theme context provider
│   └── Providers.tsx      # Root provider composition
├── services/
│   └── api/
│       └── client.ts     # API client (used by features)
└── utils/
    └── query-client.ts   # React Query/TanStack Query setup
```

**Global State Strategies by Type:**

1. **UI State (Theme, Sidebar, Modals):**
   - Location: `stores/uiStore.ts` (Jotai) or `providers/UIProvider.tsx` (Context)
   - Examples: Dark mode, sidebar open/closed, active modal
   - Why: Truly global, no business logic, simple state

2. **Auth State (Current User, Session):**
   - Location: `features/auth/` OR `stores/authStore.ts` (depends on complexity)
   - If simple: `stores/authStore.ts`
   - If complex (permissions, roles, token refresh): `features/auth/` with hooks and providers
   - Why: Might need auth-related business logic, API calls, token management

3. **Server State (API Data, Caching):**
   - Location: Use React Query/TanStack Query or SWR
   - Setup: `utils/query-client.ts` for React Query configuration (pure config, no API calls)
   - API Clients: `services/api/` for HTTP clients
   - Queries: Co-locate with features (e.g., `features/flags/hooks/useFlags.ts`)
   - Why: Server state is better handled by data fetching libraries than global state

4. **Application Settings (User Preferences, Language):**
   - Location: `stores/settingsStore.ts` or `features/settings/` (if complex)
   - Examples: Language, date format, notification preferences
   - Why: Global but might have persistence logic

5. **Feature Flags for Admin UI (Meta feature flags):**
   - Location: `stores/uiFlagsStore.ts` or `features/ui-flags/`
   - Examples: Enable beta features in admin UI itself
   - Why: Could be complex enough to be its own feature

**Recommended Approach:**

For **CrocoFlag Admin Dashboard**, use this pattern:

```
apps/admin/src/
├── stores/                      # Simple global state (Jotai recommended)
│   ├── uiStore.ts              # Theme, sidebar, modals
│   └── settingsStore.ts        # User preferences
├── providers/                   # React Context for providers
│   ├── QueryProvider.tsx       # React Query provider
│   ├── ThemeProvider.tsx       # Theme context (if complex)
│   └── Providers.tsx           # Root: composes all providers
├── features/
│   └── auth/                   # Auth feature (if complex)
│       ├── hooks/
│       │   ├── useAuth.ts     # Auth logic hook
│       │   └── useSession.ts  # Session management
│       └── AuthProvider.tsx   # Auth context provider
└── utils/
    └── query-client.ts         # React Query setup
```

**When to Use What:**

| State Type            | Solution         | Location                                             |
| --------------------- | ---------------- | ---------------------------------------------------- |
| UI toggle (sidebar)   | Jotai            | `stores/uiStore.ts`                                  |
| Current user          | Jotai or Context | `stores/authStore.ts` or `features/auth/`            |
| API data (flags list) | React Query      | `features/flags/hooks/useFlags.ts`                   |
| Theme                 | Context or Jotai | `providers/ThemeProvider.tsx` or `stores/uiStore.ts` |
| Form state            | Local useState   | Component or `features/{name}/hooks/useForm.ts`      |
| Selected project      | Jotai or Context | `stores/projectStore.ts`                             |

**Key Principles:**

1. **Start simple:** Use `useState` until you need global state
2. **Server state ≠ Global state:** Use React Query for API data, not Jotai/Context
3. **Co-locate with features:** Feature-specific state goes in `features/{name}/hooks/` or `features/{name}/atoms.ts`
4. **Global UI state:** Keep in `stores/` (Jotai)
5. **Complex domain logic:** Use `features/{name}/` even if global (like auth)
6. **Avoid over-engineering:** Don't add Redux unless you have complex state needs

### Styling (Tailwind CSS)

- Use Tailwind utility classes, avoid inline styles
- Create custom Tailwind classes in `globals.css` for repeated patterns
- Use Tailwind's responsive breakpoints (sm, md, lg, xl, 2xl)
- Prefer semantic color tokens (bg-primary, text-secondary)
- Keep component-specific styles in CSS modules if needed
- Use clsx or cn() utility for conditional classes

### File Organization

**Structure:**

```
apps/admin/src/
├── app/                    # Next.js App Router routes
│   ├── (routes)/          # Route groups
│   ├── layout.tsx
│   └── page.tsx
├── components/            # Reusable UI components (truly cross-feature)
│   ├── Button.tsx        # Primitive/design system components
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Card.tsx
├── stores/                # Global state stores (Jotai)
│   ├── uiStore.ts        # UI state (theme, sidebar, modals)
│   └── settingsStore.ts  # User preferences
├── providers/             # React Context providers
│   ├── QueryProvider.tsx # React Query provider
│   └── Providers.tsx     # Root provider composition
├── features/              # Feature-based organization (co-located code)
│   └── flags/            # Feature: Flags management
│       ├── components/   # Feature-specific components
│       │   ├── FlagCard.tsx
│       │   ├── FlagList.tsx
│       │   └── FlagForm.tsx
│       ├── hooks/        # React Query hooks for data fetching (CRUD operations)
│       │   ├── useFlags.ts      # Fetch, create, update, delete flags
│       │   └── useFlagForm.ts   # Form state management
│       ├── utils/        # Feature-specific utilities (data transformation, formatting)
│       │   └── flagHelpers.ts   # formatFlagStatus, formatDate, etc.
│       ├── types.ts      # Feature-specific UI types (if not using shared API types)
│       └── actions.ts    # Server Actions for this feature (if using)
├── hooks/                # Shared hooks used across multiple features
│   └── useDebounce.ts
├── services/             # API clients, external integrations ("do work")
│   ├── api/
│   │   ├── client.ts    # Base HTTP client
│   │   └── endpoints.ts # API endpoint definitions
│   └── auth/
│       └── authClient.ts # Auth API client
├── utils/                # Shared utilities used across features ("transform data")
│   ├── format.ts        # Shared formatting utilities
│   ├── validation.ts    # Shared validation utilities
│   └── constants.ts     # App-wide constants
├── types/                # Shared types (API types imported from @croco-flag/api)
│   └── common.ts        # UI-only types not from API
└── styles/               # Global styles, Tailwind config
```

**Decision Framework:**

1. **When to use `components/`:**
   - ✅ Primitive, design-system level components (Button, Input, Modal)
   - ✅ Components used by 3+ features
   - ❌ Feature-specific components (even if "reusable" within a feature)
   - ❌ Route-specific components (even if only used once - keep in features)

2. **When to use `features/{name}/`:**
   - ✅ All feature-specific code (components, hooks, types, utils)
   - ✅ Co-locate related code for easier refactoring
   - ✅ Components that might become shared later (promote when actually shared)

3. **Promoting from `features/` to `components/`:**
   - When a component is used by 3+ features, consider promoting it
   - Move to `components/` and update imports
   - This creates intentional friction to avoid premature abstraction

4. **Hooks organization:**
   - Feature hooks: `features/{name}/hooks/` (React Query hooks for CRUD, data fetching)
   - Shared hooks: `hooks/` (pure utility hooks like useDebounce, useLocalStorage)
   - Note: Admin dashboard is thin client - hooks mostly call API, not business logic

5. **Types organization:**
   - **API types**: Import from `@croco-flag/api` (source of truth, shared from API workspace)
   - Feature UI types: `features/{name}/types.ts` (only UI-specific types not from API)
   - Shared UI types: `types/` (UI-only types used across features)
   - If a type starts feature-specific but becomes shared, move it (same as components)

6. **Server Actions:**
   - Co-locate with features: `features/{name}/actions.ts`
   - Or use Next.js Server Actions in route handlers if preferred

7. **Services vs Utils:**
   - **`services/`**: API clients, external integrations, things that "do work"
     - HTTP clients, API endpoints, external service integrations
     - Example: `services/api/client.ts`, `services/auth/authClient.ts`
   - **`utils/`**: Shared utilities, helpers, constants, things that "transform data"
     - Pure functions (no side effects), formatters, validators, constants
     - Used by 2+ features
     - Example: `utils/format.ts` (formatDate, formatNumber), `utils/constants.ts`
   - **Feature-specific utilities**: Keep in `features/{name}/utils/` if only used by that feature
     - Data transformation, formatting specific to that feature
     - Example: `features/flags/utils/flagHelpers.ts`

8. **API Types Sharing:**
   - API workspace exports types that are the source of truth
   - Admin dashboard imports: `import { Flag, Project } from "@croco-flag/api"`
   - Only create local types for UI-specific needs (e.g., form state, component props)
   - Prefer using API types directly when possible

**Key Principles:**

1. **Thin Client Architecture** - Admin dashboard focuses on:
   - UI presentation and user interactions
   - Data fetching via React Query hooks
   - Client-side form state and validation (UX only)
   - Data transformation for display (formatting, filtering, sorting)
   - Business logic lives in the backend API

2. **All features live in `features/`** - Even if used by only one route, this ensures:
   - All features are visible at a glance in one place
   - Features can be easily promoted/reused later
   - Consistent organization (no hunting across `app/` and `features/`)

3. **Routes import from features** - `app/` folders should be thin wrappers:

   ```typescript
   // app/flags/page.tsx (thin route wrapper)
   import { FlagsPage } from '@/features/flags';
   export default FlagsPage;
   ```

4. **Feature = Domain/Bounded Context** - Organize by business domain, not UI pages:
   - ✅ `features/flags/`, `features/projects/`, `features/users/`
   - ❌ `features/flags-list/`, `features/create-flag/`, `features/dashboard/`
   - See [ADR 001](../docs/adr/001-feature-organization-domain-based.md) for detailed rationale

**Feature Organization Patterns & Shared Logic Strategies:**

- See [ADR 001](../docs/adr/001-feature-organization-domain-based.md) for feature organization patterns and shared logic strategies

**Testing Strategy:**

- Co-locate tests next to files: `Component.tsx` + `Component.test.tsx`
- Use `*.test.ts` or `*.test.tsx` naming convention
- Place integration tests in `features/{name}/__tests__/` if needed

**Concrete Example - Flags Feature:**

```
features/flags/
├── components/
│   ├── FlagCard.tsx          # Used in list + search
│   ├── FlagCard.test.tsx
│   ├── FlagList.tsx          # Used in list page
│   ├── FlagForm.tsx          # Used in create + edit pages
│   └── FlagForm.test.tsx
├── hooks/
│   ├── useFlags.ts           # React Query hook - Fetch flags, CRUD operations
│   ├── useFlags.test.ts
│   └── useFlagForm.ts        # Form state management (client-side only)
├── utils/
│   └── flagHelpers.ts        # Data transformation utilities (format, sort, filter)
├── types.ts                  # UI-specific types (if needed, otherwise import from @croco-flag/api)
├── actions.ts                # Server Actions (createFlag, updateFlag) - optional
└── index.ts                  # Public API:
                              #   export { FlagList } from './components/FlagList'
                              #   export { useFlags } from './hooks/useFlags'
```

**Routes import from features:**

```
app/
├── flags/
│   ├── page.tsx              # Thin wrapper: export { FlagsPage } from '@/features/flags'
│   └── [id]/
│       └── page.tsx          # Edit page: export { EditFlagPage } from '@/features/flags'
└── projects/
    └── page.tsx
```

**All features visible at a glance:**

```
features/
├── flags/      ← Feature 1
├── projects/   ← Feature 2
├── users/      ← Feature 3
└── auth/       ← Feature 4
```

This structure ensures:

- ✅ All features visible in one place (`features/` folder)
- ✅ No hunting across `app/` and `features/` folders
- ✅ Routes are thin wrappers (easy to see URL structure)
- ✅ Features can be easily found and understood
- ✅ Clear separation of concerns (components, hooks, types)

### Naming Conventions

- Components: PascalCase (e.g., `UserProfile.tsx`)
- Files: Match component name (e.g., `UserProfile.tsx` for `<UserProfile />`)
- Hooks: camelCase with 'use' prefix (e.g., `useFeatureFlags.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types/Interfaces: PascalCase (e.g., `User`, `FeatureFlag`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Routes: kebab-case folders matching URL structure

### API & Data Fetching

- Use Server Components with async/await for data fetching
- Handle errors gracefully with try/catch
- Validate data with Zod schemas at API boundaries
- Use Next.js `fetch` with proper caching strategies
- Revalidate data when appropriate (revalidate, tags)
- Prefer Server Actions for mutations

### Error Handling

- Use TypeScript's type system to prevent errors
- Validate user input on both client and server
- Provide meaningful error messages
- Log errors with context (use structured logging)
- Use Next.js error boundaries for React errors
- Handle loading states explicitly

### Performance

- Use Next.js Image component for images
- Implement proper loading states
- Use React Suspense for code splitting
- Lazy load heavy components
- Optimize bundle size (check what's imported)
- Use dynamic imports for large dependencies
- Implement proper caching strategies

### Testing

- Write tests for UI components, hooks, and utilities
- Test user interactions, not implementation details
- Use React Testing Library for component tests
- Mock API calls in tests (React Query provides utilities for this)
- Test data transformation utilities (formatting, filtering, sorting)
- Note: Business logic is tested in the backend API, not in admin dashboard
- Keep tests readable and maintainable

### Accessibility

- Use semantic HTML elements
- Provide proper ARIA labels when needed
- Ensure keyboard navigation works
- Maintain proper heading hierarchy
- Use proper form labels and error messages
- Test with screen readers

## Common Patterns

### Form Handling

```typescript
// Prefer Server Actions for forms
'use server';
export async function createFlag(formData: FormData) {
  // Validate and process
}
```

### Data Fetching in Server Components

```typescript
// In Server Component
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

### Client Component with State

```typescript
'use client';
import { useState } from 'react';

export function ClientComponent() {
  const [state, setState] = useState();
  // ...
}
```

### API Route Handler

```typescript
// app/api/flags/route.ts
export async function GET(request: Request) {
  // Handle GET request
}
```

## Environment Variables

- Use `NEXT_PUBLIC_` prefix for client-accessible vars
- Keep secrets server-side only
- Document required env vars in `.env.example`
- Use proper validation for env vars

## Reminders

- Next.js 16+ uses App Router by default
- React 19 has new features (use with care)
- Server Components are the default (no 'use client' needed)
- TypeScript strict mode is enabled - fix all errors
- Always handle loading and error states
- Keep components focused and testable
- Write self-documenting code with clear names
