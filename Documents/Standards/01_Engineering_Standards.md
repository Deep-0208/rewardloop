# Engineering Standards

## 1. Engineering Philosophy

- **Documentation First:** Write the docs before writing the code.
- **Simplicity & Maintainability:** KISS and DRY. Avoid premature optimization.
- **Scalability & Testability:** Decouple business logic from UI frameworks.
- **Security, Accessibility & Performance by Default.**

## 2. AI Coding Standards

- **Strict TypeScript:** `strict: true`, absolutely no `any`.
- **Architecture:** Feature-first architecture. Co-locate tests, components, and utils by feature.
- **Principles:** SOLID, Clean Architecture. No duplicated business logic. Use Dependency Injection for external services.
- **Conventions:**
  - Naming: `camelCase` for vars/functions, `PascalCase` for Components/Types/Interfaces.
  - Folders: `kebab-case`.
  - Imports: Absolute paths (`@/components`, `@/lib`).
  - Error Handling: Use standard AppError classes. Fail fast.
  - Logging: Structured JSON logging. No raw `console.log` in production.
  - Comments: Use JSDoc for public functions. Explain _why_, not _what_.

## 3. Architecture Standards

- **Layer Responsibilities:**
  - _UI Layer (Next.js):_ Routing, rendering, presentation state.
  - _Application Layer:_ Use cases, Server Actions, business workflows.
  - _Domain Layer:_ Core models, Supabase schema definitions.
  - _Infrastructure Layer:_ Third-party API clients, payment gateways.
- **State Management:** Use URL search params and server state as much as possible. Local component state (useState/Zustand) only for ephemeral UI state.

## 4. Frontend Standards

- **Framework:** Next.js App Router, React 18+, Tailwind CSS, shadcn/ui.
- **Rules:**
  - **Server Components First:** Fetch data on the server.
  - **Client Components:** Use only for interactivity (`'use client'`). Push them down the tree.
  - **UI/UX:** Use Suspense and Skeleton Loading. Implement Optimistic UI for mutations via `useOptimistic`. Lazy load heavy client components. Use Error Boundaries per route.

## 5. Backend Standards

- **Framework:** Next.js Server Actions + Route Handlers.
- **Rules:**
  - **Auth/Authz:** Authenticate early, authorize before any mutation.
  - **Validation:** Always validate inputs using Zod.
  - **Transactions:** Use database transactions for multi-table inserts/updates.
  - **Caching:** Leverage Next.js data cache and `revalidateTag` for invalidation.
