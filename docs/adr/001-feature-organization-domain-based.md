# ADR 001: Feature Organization - Domain-Based vs UI-Based

## Status

Accepted

## Context

We need to decide how to organize features in the admin dashboard. The two primary approaches are:

1. **UI-Based Organization:** Group code by where it appears (routes/pages)
   - Example: `features/flags-list/`, `features/create-flag/`, `features/edit-flag/`

2. **Domain-Based Organization:** Group code by business domain/bounded context
   - Example: `features/flags/`, `features/projects/`, `features/users/`

## Decision

We will use **Domain-Based Organization** for all features.

**Core Principle:** Business logic is stable, UI is volatile. Organize around what changes together.

## Examples

### Example 1: Feature Flag CRUD Operations

❌ **UI-Based Organization (Problems):**

```
features/
├── flags-list/              # List page
│   ├── FlagListPage.tsx
│   ├── useFlagList.ts
│   └── FlagCard.tsx
├── create-flag/             # Create page
│   ├── CreateFlagPage.tsx
│   ├── useCreateFlag.ts
│   └── FlagForm.tsx
├── edit-flag/               # Edit page
│   ├── EditFlagPage.tsx
│   ├── useEditFlag.ts
│   └── FlagForm.tsx         # Duplicated!
└── flag-details/            # Details page
    ├── FlagDetailsPage.tsx
    └── useFlagDetails.ts
```

**Problems:**

1. **Code Duplication:** `FlagForm.tsx` duplicated in `create-flag/` and `edit-flag/`
2. **Shared Logic Scattered:** Flag validation, formatting, business rules split across folders
3. **Hard to Refactor:** Changing flag structure requires touching 4+ folders
4. **Hard to Reuse:** Want to show flag card in dashboard? Which folder to import from?
5. **Cross-Page Features Break:** Want search across all flags? Where does that live?
6. **Testing Complexity:** Tests for one "feature" spread across multiple folders

✅ **Domain-Based Organization (Better):**

```
features/
└── flags/
    ├── components/
    │   ├── FlagCard.tsx      # Used in list, search, dashboard
    │   ├── FlagList.tsx      # Used in list page
    │   ├── FlagForm.tsx      # Used in create AND edit (single source)
    │   └── FlagDetails.tsx   # Used in details page
    ├── hooks/
    │   ├── useFlags.ts       # All flag data operations
    │   ├── useFlagForm.ts    # Shared form logic (create + edit)
    │   └── useFlagValidation.ts  # Validation logic (reusable)
    ├── lib/
    │   └── flagHelpers.ts    # Format, validate, transform flags
    └── types.ts              # Single source of truth for Flag type
```

**Benefits:**

1. **Single Source of Truth:** Flag logic, types, validation in one place
2. **Easy Reuse:** Import `FlagCard` from `@/features/flags` anywhere
3. **Refactor Safety:** Change flag structure? One folder to update
4. **Clear Boundaries:** "Flags" feature = all flag-related code
5. **Shared Logic Co-located:** Form validation used by create/edit lives together
6. **Easier Testing:** All flag tests in one place

### Example 2: Cross-Page Features

Imagine you want to add:

- **Search functionality** that works on list, dashboard, and details pages
- **Bulk operations** (enable/disable multiple flags)
- **Flag templates** (pre-configured flag sets)

❌ **UI-Based:** Where does search live? `features/search/`? `features/flags-list/`? What if search needs to work for projects too?

✅ **Domain-Based:**

- Search flags → `features/flags/hooks/useFlagSearch.ts`
- Search projects → `features/projects/hooks/useProjectSearch.ts`
- Shared search UI → `components/SearchInput.tsx` (if truly generic)

### Example 3: Business Rules Evolution

Your flag system grows:

1. Start: Simple on/off flags
2. Add: Percentage rollouts
3. Add: User targeting rules
4. Add: Flag dependencies (flag X requires flag Y)
5. Add: A/B testing integration

❌ **UI-Based:** Each new feature might need changes across `create-flag/`, `edit-flag/`, `flags-list/`, etc. Where do dependencies live? Which folder owns the "flag evaluation" logic?

✅ **Domain-Based:**

- Flag evaluation logic → `features/flags/lib/evaluateFlag.ts`
- All UI pages import from same source
- Add dependency logic → `features/flags/hooks/useFlagDependencies.ts`
- Everything stays in `features/flags/` where it belongs

### Example 4: Sharing Components

You want a `FlagCard` component that shows flag status. Where should it live?

❌ **UI-Based Confusion:**

- In `flags-list/`? But what if dashboard needs it?
- Move to `components/`? But it's flag-specific, not generic
- Duplicate it? Now you have two sources of truth

✅ **Domain-Based Clear Answer:**

- Starts in `features/flags/components/FlagCard.tsx`
- Used by list, dashboard, search → still in flags (it's flag domain)
- Only promote to `components/` if used by 3+ different domains

## When UI-Based Might Make Sense

UI-based organization can work for:

- **Pure presentation apps** (no business logic, just views)
- **Design system libraries** (organized by component type)
- **Tiny apps** (< 5 pages, minimal logic)

But for apps with business logic (like a feature flag system), domain-based scales better.

## Real-World Analogy

Think of a restaurant:

- ❌ **UI-Based:** Organize by "dining room", "kitchen", "drive-through" → ingredients scattered everywhere
- ✅ **Domain-Based:** Organize by "menu items" (pizza, pasta, salads) → all pizza ingredients, recipes, equipment together

## Application to CrocoFlag

We have clear domains:

- **Flags** - The core feature flag entities
- **Projects** - Multi-tenancy/project management
- **Users** - User management (if you add it)
- **Analytics** - Flag evaluation tracking (if you add it)
- **Auth** - Authentication/authorization

Each domain has:

- Multiple UI pages (list, create, edit, details)
- Shared business logic (validation, evaluation, formatting)
- Related components that work together
- Types and utilities specific to that domain

Domain-based organization keeps related code together, making it easier to:

- Understand the system (all flag code in one place)
- Refactor safely (change flag logic = one folder)
- Reuse components (import from clear domain location)
- Test comprehensively (all flag tests together)
- Onboard new developers (clear feature boundaries)

## Consequences

### Positive

- All related code for a domain lives together
- Easier refactoring and maintenance
- Clear boundaries and responsibilities
- Better code reuse within domains
- Easier to test domains comprehensively
- Scales well as the application grows

### Negative

- Requires discipline to keep domain boundaries clear
- May need to extract shared utilities as domains evolve
- Initial structure may need adjustment as domains clarify

## Feature Organization Patterns

While we've chosen domain-based organization, there are different ways to structure within that approach:

### Pattern 1: Domain-Driven Design (DDD) Style (Recommended)

```
features/
├── flags/                    # Feature domain
│   ├── components/          # Feature UI components
│   ├── hooks/              # Feature business logic
│   ├── lib/                # Feature utilities
│   ├── types.ts            # Feature types
│   ├── actions.ts          # Server Actions
│   └── index.ts            # Public API (exports)
├── projects/
└── users/
```

- **Pros:** Clear domain boundaries, easy to understand
- **Cons:** Larger features can get unwieldy
- **Best for:** Medium to large apps with clear business domains

### Pattern 2: Vertical Slice (Feature Slices)

```
features/
├── flags/
│   ├── list/               # Slice: List flags
│   │   ├── FlagList.tsx
│   │   ├── useFlagList.ts
│   │   └── types.ts
│   ├── create/             # Slice: Create flag
│   │   ├── FlagForm.tsx
│   │   └── useFlagForm.ts
│   └── edit/               # Slice: Edit flag
└── projects/
```

- **Pros:** Very focused, easy to find specific functionality
- **Cons:** Can lead to duplication, harder to share within domain
- **Best for:** Very large features that need sub-organization

### Pattern 3: Hybrid (Domain + Slices)

```
features/
├── flags/
│   ├── components/         # Shared within flags domain
│   │   ├── FlagCard.tsx
│   │   └── FlagBadge.tsx
│   ├── hooks/             # Shared hooks
│   │   └── useFlags.ts
│   ├── list/              # Slice: List page
│   │   ├── FlagsListPage.tsx
│   │   └── useFlagList.ts
│   ├── create/            # Slice: Create page
│   │   └── CreateFlagPage.tsx
│   └── types.ts           # Shared types
```

- **Pros:** Balance between domain grouping and slice organization
- **Cons:** More complex structure
- **Best for:** Large domains that need sub-organization

### Recommendation

Start with **Pattern 1 (DDD Style)**. Add slices only when a feature grows large (>10 components).

## Shared Logic Strategies

When organizing shared code across features, we follow these strategies:

### Strategy 1: Services & Utilities Layer

```
services/                   # API clients, external integrations ("do work")
├── api/
│   ├── client.ts          # Base HTTP client
│   ├── endpoints.ts       # API endpoint definitions
│   └── types.ts           # API request/response types
└── auth/
    └── authClient.ts      # Auth API client

lib/                        # Pure utilities, helpers, constants ("transform data")
├── utils/                  # Pure utility functions
│   ├── format.ts          # formatDate, formatNumber
│   └── validation.ts      # Pure validators
└── constants/              # App-wide constants
```

- **services/**: API clients, HTTP clients, external service integrations
- **lib/**: Pure functions (no side effects), formatters, validators, constants
- Coupling: Low (utilities and services don't depend on features)

### Strategy 2: Shared Hooks

```
hooks/
├── useDebounce.ts         # Pure utility hook
├── useLocalStorage.ts
└── useApi.ts              # API integration hook
```

- Use for: Reusable React hooks that are feature-agnostic
- Coupling: Low (hooks are generic utilities)

### Strategy 3: Shared Feature Module

```
features/
├── shared/                 # Shared across multiple features
│   ├── api/               # Shared API utilities
│   ├── hooks/             # Shared feature hooks
│   │   └── useAuth.ts     # Auth used by many features
│   └── providers/         # Context providers
│       └── AuthProvider.tsx
```

- Use for: Code used by 2+ features but domain-specific
- Coupling: Medium (shared module depends on domains)

### Strategy 4: Context Providers Pattern

```
providers/                  # Root-level context providers
├── AuthProvider.tsx       # Auth context (used everywhere)
├── ThemeProvider.tsx
└── index.tsx              # Composes all providers
```

- Use for: Global app state (auth, theme, etc.)
- Coupling: Low (providers are infrastructure, features depend on them)

### Strategy 5: Business Logic Services Layer (if needed)

**Note:** This is different from API clients in `services/`. This is for complex business logic services.

```
services/
└── business/               # Business logic services (only if hooks aren't enough)
    ├── flagService.ts     # Complex flag domain logic
    └── projectService.ts  # Complex project domain logic
```

- Use for: Complex business logic that needs to be shared across features
- Coupling: Medium-High (services encapsulate domain logic)
- **Note:** Only if business logic is too complex for hooks. Usually avoid this.

### Recommended Approach

1. Start with **Strategy 1 & 2** (services/ + lib/ + hooks/) - API clients in services/, pure utilities in lib/
2. Add **Strategy 4** (providers/) - for global state
3. Use **Strategy 3** (features/shared/) - for domain-specific shared code
4. Avoid **Strategy 5** (business logic services layer) unless absolutely necessary

**Important Distinction:**

- **`services/api/`** (Strategy 1) = HTTP clients, API integration code ✅ Use this
- **`services/business/`** (Strategy 5) = Complex business logic services ⚠️ Avoid unless needed

**Key Distinction:**

- **services/**: Things that "do work" (API clients, HTTP calls, external integrations)
- **lib/**: Things that "transform data" (pure functions, formatters, validators, constants)

## References

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html)
