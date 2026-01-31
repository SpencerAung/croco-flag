# CrocoFlag Project

## Project Overview

This is a monorepo feature flag management system built with:

- **Admin Dashboard**: Next.js 16+ (App Router) with React 19, TypeScript, Tailwind CSS
  - Thin client architecture: Primarily CRUD operations, data presentation, and UI
  - Business logic lives in the backend API
  - Data fetching via React Query, API clients in `services/`
- **API**: Node.js/Express backend (to be implemented)
  - Contains all business logic (flag evaluation, targeting rules, etc.)
  - API types exported and shared with admin dashboard
- **SDK**: TypeScript client library (to be implemented)

## Code Style & Conventions

### TypeScript

- Use strict mode TypeScript
- Prefer explicit types over `any`
- Use type inference where it improves readability
- Export types/interfaces from dedicated files when shared
- Use `const` assertions for immutable data
- Prefer interfaces for object shapes, types for unions/intersections

### General

- Add comment only for non-obvious or complex logic
- Don't add comment for obvious code

## Monorepo Guidelines

### Workspace Structure

- `apps/admin`: Next.js admin dashboard
- `apps/api`: Backend API server
- `packages/sdk`: TypeScript SDK library

### Shared Code

- Place shared types in appropriate workspace
- Use workspace references: `@croco-flag/sdk`, `@croco-flag/api`
- Import from workspace packages directly

### Dependencies

- Add workspace-specific deps in workspace package.json
- Add shared dev deps at root level
- Use exact versions for critical dependencies
- Keep dependencies up to date

## Git & Commits

- Write clear, descriptive commit messages
- Use conventional commits format (feat:, fix:, docs:, etc.)
- Keep commits focused and atomic
- Don't commit build artifacts or node_modules

## Code Review Checklist

- [ ] TypeScript types are correct and strict
- [ ] No console.logs or debug code
- [ ] Error handling is appropriate
- [ ] Loading states are handled
- [ ] Code follows project conventions
- [ ] No hardcoded values (use env vars)
- [ ] Accessibility considerations addressed
- [ ] Performance implications considered

## When Adding New Features

1. Create feature branch from main
2. Add types/interfaces first
3. Implement core logic
4. Add UI components
5. Write tests
6. Update documentation
7. Ensure TypeScript compilation passes
8. Test in browser

## Tools & Setup

- Use VS Code with TypeScript, ESLint, Prettier extensions
- Format on save enabled
- TypeScript strict mode enabled
- ESLint configured with Next.js rules
